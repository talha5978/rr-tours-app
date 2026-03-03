import { ApiError } from "@workspace/shared/utils/ApiError";
import { Service } from "@workspace/shared/services/service.base";
import { UseClassMiddleware } from "@workspace/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@workspace/shared/middlewares/logger.middleware";
import { verifyUser } from "@workspace/shared/middlewares/auth.middleware";
import { asServiceMiddleware } from "@workspace/shared/middlewares/utils";
import { UseMiddleware } from "@workspace/shared/decorators/useMiddleware";
import type { HighLevelCollection, HighLevelCollectionsResp } from "@workspace/shared/types/collections";

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
}
