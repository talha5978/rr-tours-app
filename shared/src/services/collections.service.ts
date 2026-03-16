import { ApiError } from "@workspace/shared/utils/ApiError";
import { Service } from "@workspace/shared/services/service.base";
import { UseClassMiddleware } from "@workspace/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@workspace/shared/middlewares/logger.middleware";
import { verifyUser } from "@workspace/shared/middlewares/auth.middleware";
import { asServiceMiddleware } from "@workspace/shared/middlewares/utils";
import { UseMiddleware } from "@workspace/shared/decorators/useMiddleware";
import type {
	CollectionDetailsResp,
	CollectionRow,
	FPCollection,
	GetFpCollectionsResponse,
	HighLevelCollection,
	HighLevelCollectionsResp,
} from "@workspace/shared/types/collections";
import { FP_HighLevelTour } from "@workspace/shared/types/fp-tours";
import type { FPTourFilters } from "@workspace/shared/schemas/fp-tours-filter.schema";
import type { UpdateCollectionActionSchema } from "@workspace/shared/schemas/collection.schema";
import type { TablesUpdate } from "@workspace/shared/types/supabase";

@UseClassMiddleware(loggerMiddleware)
export class CollectionsService extends Service {
	/** Get all high level collections for admin */
	@UseMiddleware(asServiceMiddleware<CollectionsService>(verifyUser))
	async getHighLevelCollections(q = "", pageIndex = 0, pageSize = 10): Promise<HighLevelCollectionsResp> {
		const from = pageIndex * pageSize;
		const to = from + pageSize - 1;

		let query = this.supabase
			.from(this.COLLECTIONS_TABLE)
			.select(
				`
				id,
				name,
				isFeatured,
				created_at,
				no_of_tours:${this.COLLECTION_TOURS_TABLE}(count),
				${this.CITIES_TABLE}:${this.COLLECTION_CITIES_TABLE}(
					city:${this.CITIES_TABLE}(
						id,
						name
					)
				)
			`,
				{ count: "exact" },
			)
			.range(from, to)
			.order("created_at", { ascending: false });

		if (q.trim().length > 0) {
			query = query.ilike("name", `%${q.trim()}%`);
		}

		const { data, error: dbError, count } = await query;

		if (dbError) {
			const error = new ApiError(dbError.message, 500, [
				dbError.details || dbError.hint || "Database error",
			]);
			return { collections: [], total: 0, error };
		}

		const collections: HighLevelCollection[] = (data ?? []).map((item) => ({
			id: item.id,
			name: item.name,
			isFeatured: !!item.isFeatured,
			created_at: item.created_at,
			no_of_tours: Math.max(1, Number(item.no_of_tours?.[0]?.count ?? 0)),
			cities: (item.cities ?? []).map((rel) => ({
				id: rel.city?.id,
				name: rel.city?.name,
			})),
		}));

		return {
			collections,
			total: count ?? 0,
			error: null,
		};
	}

	/** Add new collection */
	@UseMiddleware(asServiceMiddleware<CollectionsService>(verifyUser))
	async addCollection(input: {
		name: string;
		description?: string | null;
		isFeatured: "Y" | "N";
		cities: number[];
		tours: string[];
	}): Promise<{ error: ApiError | null }> {
		let insertedCollectionId: number | null = null;
		let insertedTourRelationIds: number[] = [];

		try {
			const { cities, description, isFeatured, name, tours } = input;

			if (tours.length === 0) {
				return { error: new ApiError("At least one tour is required", 400) };
			}

			const { data: collection, error: collErr } = await this.supabase
				.from(this.COLLECTIONS_TABLE)
				.insert({
					name,
					description: description ?? undefined,
					isFeatured: isFeatured === "Y",
				})
				.select("id")
				.single();

			if (collErr || !collection?.id) {
				return { error: new ApiError(collErr?.message ?? "Failed to create collection", 500) };
			}

			insertedCollectionId = collection.id;

			const tourRelations = tours.map((tour_id) => ({
				collection_id: insertedCollectionId!,
				tour_id,
			}));

			const { data: insertedTours, error: toursErr } = await this.supabase
				.from(this.COLLECTION_TOURS_TABLE)
				.insert(tourRelations)
				.select("id");

			if (toursErr || !insertedTours?.length) {
				return { error: new ApiError(toursErr?.message ?? "Failed to associate tours", 500) };
			}

			insertedTourRelationIds = insertedTours.map((r) => r.id);

			if (cities.length > 0) {
				const cityRelations = cities.map((city_id) => ({
					collection_id: insertedCollectionId!,
					city_id,
				}));

				const { error: citiesErr } = await this.supabase
					.from(this.COLLECTION_CITIES_TABLE)
					.insert(cityRelations);

				if (citiesErr) {
					return { error: new ApiError(citiesErr.message ?? "Failed to associate cities", 500) };
				}
			}

			return { error: null };
		} catch (err: any) {
			// ROLLBACK on failure
			const rollbackErrors: string[] = [];

			if (insertedCollectionId) {
				const { error: delCollErr } = await this.supabase
					.from(this.COLLECTIONS_TABLE)
					.delete()
					.eq("id", insertedCollectionId);

				if (delCollErr) {
					rollbackErrors.push(`Failed to delete collection: ${delCollErr.message}`);
				}
			}

			if (insertedTourRelationIds.length > 0) {
				const { error: delToursErr } = await this.supabase
					.from(this.COLLECTION_TOURS_TABLE)
					.delete()
					.in("id", insertedTourRelationIds);

				if (delToursErr) {
					rollbackErrors.push(`Failed to delete tour relations: ${delToursErr.message}`);
				}
			}

			if (rollbackErrors.length > 0) {
				console.error("[CRITICAL ROLLBACK FAILURE]", rollbackErrors);
			}

			return {
				error:
					err instanceof ApiError
						? err
						: new ApiError(err.message || "Failed to create collection", 500),
			};
		}
	}

	@UseMiddleware(asServiceMiddleware<CollectionsService>(verifyUser))
	async updateCollection(id: number, data: UpdateCollectionActionSchema) {
		const mainUpdate: TablesUpdate<"collections"> = {};

		if (data.name !== undefined) mainUpdate.name = data.name;
		if (data.description !== undefined) mainUpdate.description = data.description;
		if (data.isFeatured !== undefined) mainUpdate.isFeatured = data.isFeatured;

		if (Object.keys(mainUpdate).length > 0) {
			const { error } = await this.supabase
				.from(this.COLLECTIONS_TABLE)
				.update(mainUpdate)
				.eq("id", id);

			if (error) throw new ApiError(error.message, 500);
		}

		if (data.added_cities && data.added_cities.length > 0) {
			const inserts = data.added_cities.map((cityId) => ({
				collection_id: id,
				city_id: cityId,
			}));

			const { error } = await this.supabase.from(this.COLLECTION_CITIES_TABLE).insert(inserts);
			if (error) throw new ApiError(error.message, 500);
		}

		if (data.removed_cities && data.removed_cities.length > 0) {
			const { error } = await this.supabase
				.from(this.COLLECTION_CITIES_TABLE)
				.delete()
				.eq("collection_id", id)
				.in("city_id", data.removed_cities);

			if (error) throw new ApiError(error.message, 500);
		}

		if (data.added_tours && data.added_tours.length > 0) {
			const inserts = data.added_tours.map((tourId) => ({
				collection_id: id,
				tour_id: tourId,
			}));

			const { error } = await this.supabase.from(this.COLLECTION_TOURS_TABLE).insert(inserts);
			if (error) throw new ApiError(error.message, 500);
		}

		if (data.removed_tours && data.removed_tours.length > 0) {
			const { error } = await this.supabase
				.from(this.COLLECTION_TOURS_TABLE)
				.delete()
				.eq("collection_id", id)
				.in("tour_id", data.removed_tours);

			if (error) throw new ApiError(error.message, 500);
		}

		return { success: true };
	}

	/** Delete a collection */
	@UseMiddleware(asServiceMiddleware<CollectionsService>(verifyUser))
	async deleteCollection(collectionId: number): Promise<{ error: ApiError | null }> {
		try {
			const { data, error } = await this.supabase.rpc("delete_collection", {
				p_collection_id: collectionId,
			});

			type DeleteCollectionResult =
				| {
						success: true;
						message: string;
						deleted_collection_id: number;
				  }
				| {
						success: false;
						message: string;
						code?: string;
						detail?: string;
				  };

			if (error) {
				console.error("RPC error:", error);
				return {
					error: new ApiError(
						error.message || "Failed to execute delete procedure",
						error.code ? Number(error.code) : 500,
						[error.details || error.hint || ""],
					),
				};
			}

			const result = data as DeleteCollectionResult | null;

			if (!result || !result?.success) {
				return {
					error: new ApiError(result?.message || "Delete operation failed", 400, [
						result?.code || "unknown_error",
					]),
				};
			}

			return { error: null };
		} catch (err: any) {
			console.error("Unexpected error during delete:", err);
			return {
				error: new ApiError(err.message || "Unexpected error while deleting collection", 500),
			};
		}
	}

	async getCollectionById(id: number): Promise<CollectionRow | null> {
		try {
			const { data, error } = await this.supabase
				.from(this.COLLECTIONS_TABLE)
				.select(`*`)
				.eq("id", id)
				.single();

			if (error) {
				throw new ApiError(error.message, 500, [error.details || ""]);
			}

			return data;
		} catch (error) {
			console.error(error);
			return null;
		}
	}

	/** FETCH collection details */
	@UseMiddleware(asServiceMiddleware<CollectionsService>(verifyUser))
	async getCollectionDetails(collectionId: number): Promise<CollectionDetailsResp> {
		if (!collectionId) {
			return {
				data: null,
				error: new ApiError("Collection ID is required", 400),
			};
		}

		const { data, error } = await this.supabase
			.from(this.COLLECTIONS_TABLE)
			.select(
				`
				id, created_at, isFeatured, name, description,
				${this.COLLECTION_CITIES_TABLE}(
					city:${this.CITIES_TABLE}(
						id, name
					)
				),
				${this.COLLECTION_TOURS_TABLE}(
					tour:${this.TOURS_TABLE}(
						id, name
					)
				)
			`,
			)
			.eq("id", collectionId)
			.single();

		if (error) {
			return {
				data: null,
				error: new ApiError(error.message, 500),
			};
		}

		return {
			data: {
				id: data.id,
				name: data.name,
				description: data.description,
				isFeatured: data.isFeatured,
				created_at: data.created_at,
				cities: data.collection_cities.map((c) => c.city),
				tours: data.collection_tours.map((t) => t.tour),
			},
			error: null,
		};
	}

	/** Fetch paginated tours for a specific collection */
	async getCollectionTours(
		collectionId: number,
		pageIndex = 0,
		pageSize = 10,
		q = "",
		filters: Partial<FPTourFilters> = {},
	): Promise<{ tours: FP_HighLevelTour[]; total: number; error: ApiError | null }> {
		const from = pageIndex * pageSize;
		const to = from + pageSize - 1;

		try {
			let query = this.supabase
				.from(this.COLLECTION_TOURS_TABLE)
				.select(
					`
					tour:${this.TOURS_TABLE}(
						id, name, cover_image, updated_at,
						${this.META_DETAILS_TABLE}(url_key),
						${this.CITIES_TABLE}(id, name, ${this.META_DETAILS_TABLE}(url_key)),
						${this.CATEGORIES_TABLE}(id, name, ${this.META_DETAILS_TABLE}(url_key)),
						${this.TOUR_OPTIONS_TABLE}(
							*,
							${this.TOUR_OPTION_PRICES_TABLE}(
								price,
								${this.PARTICIPANT_TYPES_TABLE}(age_min, age_max)
							)
						)
					)
					`,
					{ count: "exact" },
				)
				.eq("collection_id", collectionId)
				.eq(`${this.TOURS_TABLE}.isActive`, true);

			if (q.trim().length > 0) {
				query = query.ilike(`${this.TOURS_TABLE}.name`, `%${q}%`);
			}

			if (filters.categories && filters.categories.length > 0) {
				query = query.in(
					`${this.TOURS_TABLE}.tour_category_id`,
					filters.categories.map((c) => Number(c)),
				);
			}

			query = query.range(from, to).order("id", { ascending: true });

			const { data, error, count } = await query;

			if (error) {
				throw new ApiError(error.message, 500, [error.details || ""]);
			}

			const getTourMinPrice = (tour: any): { minPrice: number; hasGroupPrice: boolean } => {
				let min = Infinity;
				let hasGroup = false;
				for (const option of tour.tour_options || []) {
					for (const price of option.tour_option_prices || []) {
						if (price.price < min) min = price.price;
						if (price.participant_types.age_max === 0 && price.participant_types.age_min === 0) {
							hasGroup = true;
						}
					}
				}
				return { minPrice: min === Infinity ? 0 : min, hasGroupPrice: hasGroup };
			};

			let tours: FP_HighLevelTour[] = (data || [])
				.filter((ct) => ct.tour !== null)
				.map((ct) => {
					const tour = ct.tour;
					const { minPrice, hasGroupPrice } = getTourMinPrice(tour);

					return {
						id: tour.id,
						name: tour.name,
						cover_image: tour.cover_image,
						url_key: tour.meta_details.url_key,
						updated_at: tour.updated_at,
						price: minPrice,
						city: {
							id: tour.cities.id,
							name: tour.cities.name,
							url_key: tour.cities.meta_details.url_key,
						},
						category: {
							id: tour.tours_categories.id,
							name: tour.tours_categories.name,
							url_key: tour.tours_categories.meta_details.url_key,
						},
						hasGroupPrice,
					};
				});

			// console.log("FOrmatted tours: \n", tours);

			if (filters.price && filters.price.length === 2) {
				const [minP, maxP] = filters.price.sort((a, b) => a - b);
				tours = tours.filter((tour) => tour.price >= minP && tour.price <= maxP);
			}

			if (filters.sortBy === "price") {
				tours.sort((a, b) => {
					if (filters.sortType === "asc") {
						return a.price - b.price;
					}
					return b.price - a.price;
				});
			}

			return { tours, total: count ?? 0, error: null };
		} catch (error) {
			console.error(error);
			return {
				tours: [],
				total: 0,
				error:
					error instanceof ApiError
						? error
						: new ApiError("Failed to get collection tours", 500, []),
			};
		}
	}

	/** Fetch collection with home page and city page filters (now without tours) */
	async getFpCollections(
		isFeatured: boolean = true,
		cityId: number | null = null,
		pageIndex = 0,
		pageSize = 10,
	): Promise<GetFpCollectionsResponse> {
		const from = pageIndex * pageSize;
		const to = from + pageSize - 1;

		try {
			let query = this.supabase
				.from(this.COLLECTIONS_TABLE)
				.select(
					`
						id,
						name,
						description,
						isFeatured,
						${this.COLLECTION_CITIES_TABLE}(id, city_id)
					`,
					{ count: "exact" },
				)
				.range(from, to)
				.order("id", { ascending: true });

			if (isFeatured) {
				query = query.eq("isFeatured", true);
			} else if (cityId != null) {
				query = query.in(`${this.COLLECTION_CITIES_TABLE}.city_id`, [cityId]);
			} else {
				throw new ApiError("Either isFeatured must be true or cityId must be provided", 400);
			}

			const { data: dbData, error, count } = await query;

			// console.log("Data in the service function : \n", JSON.stringify(dbData, null, 2));

			if (error) {
				console.error(error);
				throw new ApiError(error.message, 500, [error.details || ""]);
			}

			let data = dbData.filter((collection) => {
				if (collection.collection_cities.length === 0 && cityId != null) {
					return false;
				}
				return true;
			});

			const collPromises = (data || []).map(async (coll) => {
				const { tours, error: terr } = await this.getCollectionTours(coll.id);
				if (terr) {
					console.error(terr);
					return { ...coll, tours: [] };
				}
				return { ...coll, tours };
			});

			const collections: FPCollection[] = await Promise.all(collPromises);

			return { collections, total: count ?? 0, error: null };
		} catch (error) {
			return {
				collections: [],
				total: 0,
				error: error instanceof ApiError ? error : new ApiError("Failed to get collections", 500, []),
			};
		}
	}
}
