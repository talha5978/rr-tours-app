import { ApiError } from "@workspace/shared/utils/ApiError";
import { MediaService } from "@workspace/shared/services/media.service";
import { Service } from "@workspace/shared/services/service.base";
import { UseClassMiddleware } from "@workspace/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@workspace/shared/middlewares/logger.middleware";
import { verifyUser } from "@workspace/shared/middlewares/auth.middleware";
import { asServiceMiddleware } from "@workspace/shared/middlewares/utils";
import { MetaDetailsService } from "@workspace/shared/services/meta-details.service";
import type { AddTourActionDate } from "@workspace/shared/schemas/tour.schema";
import { type TablesInsert } from "@workspace/shared/types/supabase";
import type {
	GetHighLevelToursResponse,
	GetTourDetails,
	GetTourDetailsForUpdate,
	HighLevelTour,
} from "@workspace/shared/types/tours";
import { type TourFilters } from "@workspace/shared/schemas/tours-filter.schema";

@UseClassMiddleware(loggerMiddleware, asServiceMiddleware<ToursService>(verifyUser))
export class ToursService extends Service {
	/** Add tour details */
	async addTour(input: AddTourActionDate): Promise<string | null> {
		if (this.currentUser == null || this.currentUser.id == null) {
			throw new ApiError("Unauthorized", 401, []);
		}

		for (const option of input.tour_options) {
			if (option.availabilities == null || option.availabilities.length === 0) {
				throw new ApiError(
					`Please add at least one availability for ${option.name} tour option.`,
					400,
					[],
				);
			}
		}

		const mediaSvc = await this.createSubService(MediaService);

		let uploadedCoverPath = "";
		let uploadedImagePaths: string[] = [];
		let metaId: string | null = null;
		let tourId: string | null = null;
		const optionIds: number[] = [];
		const availabilityIds: number[] = [];
		const timeSlotIds: number[] = [];

		try {
			// Upload cover image
			if (input.cover_image && input.cover_image.size > 0) {
				const { data } = await mediaSvc.uploadImage(input.cover_image);
				uploadedCoverPath = data?.path ?? "";
				if (!uploadedCoverPath) {
					throw new ApiError("Failed to upload cover image", 500, []);
				}
			}

			// Upload secondary images in parallel
			if (input.images) {
				const uploadPromises = input.images
					.filter(Boolean)
					.map((img) => mediaSvc.uploadImage(img as File));
				const uploadedResults = await Promise.all(uploadPromises);

				uploadedImagePaths = uploadedResults
					.map((res) => res.data?.path)
					.filter((path): path is string => !!path);

				if (uploadedImagePaths.length !== input.images.filter(Boolean).length) {
					throw new ApiError("Failed to upload one or more secondary images", 500, []);
				}
			}

			// Create meta details
			const metaDetailsService = await this.createSubService(MetaDetailsService);
			metaId = await metaDetailsService.createMetaDetails(input.meta_details);
			if (!metaId) {
				throw new ApiError("Failed to create meta details", 500, []);
			}

			// Preparing tour data
			const tourData: TablesInsert<"tours"> = {
				address_link: input.address_link || null,
				address_name: input.address_name || null,
				age_health_restrictions: input.age_health_restrictions || null,
				cancellation_policy:
					input.cancellation_policy && input.cancellation_policy != ""
						? Number(input.cancellation_policy)
						: null,
				city_id: Number(input.city_id),
				cover_image: uploadedCoverPath,
				duration_minutes: input.duration_minutes ? parseFloat(input.duration_minutes) : null,
				free_cancelation_avilable: input.free_cancelation_avilable === "true",
				highlights: input.highlights || null,
				images: uploadedImagePaths,
				isActive: input.isActive === "true",
				isFeatured: input.isFeatured === "true",
				isWeelChairAccessible: input.isWeelChairAccessible === "true",
				know_before_you_go: input.know_before_you_go || null,
				live_tour_guide: input.live_tour_guide === "true",
				live_tour_guide_langs: input.live_tour_guide_langs?.join(",") || null,
				meta_details_id: metaId,
				name: input.name,
				overview: input.overview,
				provider: input.provider ? Number(input.provider) : null,
				tour_category_id: Number(input.tour_category_id),
				added_by: this.currentUser.id as string,
			};

			// Insert tour
			const { data: tourInsertData, error: tourError } = await this.supabase
				.from(this.TOURS_TABLE)
				.insert(tourData)
				.select("id")
				.single();

			if (tourError) {
				throw new ApiError(tourError.message, 500, [tourError.details || []]);
			}

			tourId = tourInsertData.id;

			// Insert tags if provided
			if (tourId != null && input.tags && input.tags.length > 0) {
				const tagsData = input.tags.map((tagId) => ({
					tour_id: tourId as string,
					tour_tag_id: Number(tagId),
				}));

				const { error: tagsError } = await this.supabase
					.from(this.TOURS_TAGS_LINK_TABLE)
					.insert(tagsData);

				if (tagsError) {
					throw new ApiError(tagsError.message, 500, [tagsError.details || []]);
				}
			}

			// Prepare all tour options data
			const optionsData: TablesInsert<"tour_options">[] = input.tour_options.map((option) => ({
				name: option.name,
				inclusions: option.inclusions || null,
				exclusions: option.exclusions || null,
				note: option.note || null,
				sort_order: Number(option.sort_order || "1"),
				tour_id: tourId as string,
				isOpenDated: option.isOpenDated === "true",
			}));

			// Batch insert tour options
			const { data: insertedOptions, error: optionsError } = await this.supabase
				.from(this.TOUR_OPTIONS_TABLE)
				.insert(optionsData)
				.select("id");

			if (optionsError) {
				throw new ApiError(optionsError.message, 500, [optionsError.details || []]);
			}

			optionIds.push(...insertedOptions.map((opt) => opt.id));

			// Prepare all prices data
			const allPrices: TablesInsert<"tour_option_prices">[] = [];
			input.tour_options.forEach((option, optIdx) => {
				const optionId = insertedOptions[optIdx].id;
				option.prices.forEach((p) => {
					allPrices.push({
						price: Number(p.price),
						participant_type_id: Number(p.participant),
						tour_option_id: optionId,
					});
				});
			});

			// Batch insert prices
			if (allPrices.length > 0) {
				const { error: pricesError } = await this.supabase
					.from(this.TOUR_OPTION_PRICES_TABLE)
					.insert(allPrices);

				if (pricesError) {
					throw new ApiError(pricesError.message, 500, [pricesError.details || []]);
				}
			}

			// Prepare all availabilities data
			const allAvails: TablesInsert<"tour_availabilities">[] = [];
			input.tour_options.forEach((option, optIdx) => {
				const optionId = insertedOptions[optIdx].id;
				option.availabilities?.forEach((avail) => {
					allAvails.push({
						date: avail.date,
						isActive: avail.isActive === "true",
						tour_option_id: optionId,
					});
				});
			});

			// Batch insert availabilities
			const { data: insertedAvails, error: availsError } = await this.supabase
				.from(this.TOUR_AVAILABILITIES_TABLE)
				.insert(allAvails)
				.select("id");

			if (availsError) {
				throw new ApiError(availsError.message, 500, [availsError.details || []]);
			}

			availabilityIds.push(...insertedAvails.map((avail) => avail.id));

			// Prepare all time slots data
			const allTimeSlots: TablesInsert<"tour_time_slots">[] = [];
			input.tour_options.forEach((option) => {
				option.availabilities?.forEach((avail) => {
					avail.timeslots.forEach((ts) => {
						allTimeSlots.push({
							time: ts.time,
							label: ts.label || null,
							sort_order: Number(ts.sort_order || "1"),
						});
					});
				});
			});

			// Batch insert time slots
			const { data: insertedTimeSlots, error: timeSlotsError } = await this.supabase
				.from(this.TOUR_TIME_SLOTS_TABLE)
				.insert(allTimeSlots)
				.select("id");

			if (timeSlotsError) {
				throw new ApiError(timeSlotsError.message, 500, [timeSlotsError.details || []]);
			}

			timeSlotIds.push(...insertedTimeSlots.map((ts) => ts.id));

			// Prepare all availability slots data
			const allAvailSlots: TablesInsert<"tour_availability_slots">[] = [];
			let availIndex = 0;
			let timeSlotIndex = 0;
			input.tour_options.forEach((option) => {
				option.availabilities?.forEach((avail) => {
					const availId = insertedAvails[availIndex].id;
					avail.timeslots.forEach((ts) => {
						allAvailSlots.push({
							availability_id: availId,
							time_slot_id: insertedTimeSlots[timeSlotIndex].id,
							seat_type: option.seat_type,
							available_seats:
								ts.available_seats && option.seat_type === "LIMITED"
									? Number(ts.available_seats)
									: null,
						});
						timeSlotIndex++;
					});
					availIndex++;
				});
			});

			// Batch insert availability slots
			if (allAvailSlots.length > 0) {
				const { error: availSlotsError } = await this.supabase
					.from(this.TOUR_AVAILABILITY_SLOTS_TABLE)
					.insert(allAvailSlots);

				if (availSlotsError) {
					throw new ApiError(availSlotsError.message, 500, [availSlotsError.details || []]);
				}
			}

			return tourId ?? null;
		} catch (error) {
			// Cleanup on error
			const imgPromises: Promise<any>[] = [];

			if (uploadedCoverPath) {
				imgPromises.push(mediaSvc.deleteImage(uploadedCoverPath).catch(() => {}));
			}
			for (const path of uploadedImagePaths) {
				imgPromises.push(mediaSvc.deleteImage(path).catch(() => {}));
			}

			Promise.all(imgPromises);

			if (uploadedCoverPath) {
				await mediaSvc.deleteImage(uploadedCoverPath);
			}
			for (const path of uploadedImagePaths) {
				await mediaSvc.deleteImage(path);
			}
			if (metaId) {
				await this.supabase.from(this.META_DETAILS_TABLE).delete().eq("id", metaId);
			}
			if (tourId) {
				await this.supabase.from(this.TOURS_TABLE).delete().eq("id", tourId);
			}
			for (const optId of optionIds) {
				await this.supabase.from(this.TOUR_OPTIONS_TABLE).delete().eq("id", optId);
			}
			for (const availId of availabilityIds) {
				await this.supabase.from(this.TOUR_AVAILABILITIES_TABLE).delete().eq("id", availId);
			}
			for (const tsId of timeSlotIds) {
				await this.supabase.from(this.TOUR_TIME_SLOTS_TABLE).delete().eq("id", tsId);
			}

			throw error instanceof ApiError ? error : new ApiError("Failed to add tour", 500, []);
		}
	}

	/** Get tour details for preview page */
	async getTourDetails(tourId: string): Promise<GetTourDetails | null> {
		if (!tourId) {
			throw new ApiError("Tour ID is required", 400, []);
		}

		const { data: tour, error } = await this.supabase
			.from(this.TOURS_TABLE)
			.select(
				`
					*,
					${this.META_DETAILS_TABLE} (*),
					city: ${this.CITIES_TABLE} (
						id, name,
						${this.META_DETAILS_TABLE} (url_key)
					),
					tour_category: ${this.CATEGORIES_TABLE} (
						id, name,
						${this.META_DETAILS_TABLE} (url_key)
					),
					provider: ${this.PROVIDERS_TABLE} (*),
					cancellation_policy_detail: ${this.CANCELLATION_POLICIES_TABLE} (*),
					tags: ${this.TOURS_TAGS_LINK_TABLE} (
						${this.TOUR_TAGS_TABLE} (*)
					),
					${this.TOUR_OPTIONS_TABLE} (
						*,
						prices: ${this.TOUR_OPTION_PRICES_TABLE} (
							*,
							participant_type: ${this.PARTICIPANT_TYPES_TABLE} (*)
						),
						availabilities: ${this.TOUR_AVAILABILITIES_TABLE} (
							*,
							slots: ${this.TOUR_AVAILABILITY_SLOTS_TABLE} (
								*,
								time_slot: ${this.TOUR_TIME_SLOTS_TABLE} (*)
							)
						)
					)
				`,
			)
			.eq("id", tourId)
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				throw new ApiError("Tour not found", 404, []);
			}
			throw new ApiError(error.message, 500, [error.details || []]);
		}

		if (!tour) {
			throw new ApiError("Tour not found", 404, []);
		}

		return {
			...tour,
			tags: tour.tags.map((tag) => tag.tour_tags),
			city: {
				id: tour.city.id,
				name: tour.city.name,
				url_key: tour.city.meta_details.url_key,
			},
			tour_category: {
				id: tour.tour_category.id,
				name: tour.tour_category.name,
				url_key: tour.tour_category.meta_details.url_key,
			},
		};
	}

	/** Get tour details for update page */
	async getTourDetailsForUpdate(tourId: string): Promise<GetTourDetailsForUpdate | null> {
		if (!tourId) {
			throw new ApiError("Tour ID is required", 400, []);
		}

		const { data: tour, error } = await this.supabase
			.from(this.TOURS_TABLE)
			.select(
				`
					*,
					${this.META_DETAILS_TABLE} (*),
					city: ${this.CITIES_TABLE} (
						id, name
					),
					tour_category: ${this.CATEGORIES_TABLE} (
						id, name
					),
					provider: ${this.PROVIDERS_TABLE} (*),
					cancellation_policy_detail: ${this.CANCELLATION_POLICIES_TABLE} (*),
					tags: ${this.TOURS_TAGS_LINK_TABLE} (
						${this.TOUR_TAGS_TABLE} (*)
					),
					${this.TOUR_OPTIONS_TABLE} (
						*,
						prices: ${this.TOUR_OPTION_PRICES_TABLE} (
							*,
							participant_type: ${this.PARTICIPANT_TYPES_TABLE} (*)
						),
						availabilities: ${this.TOUR_AVAILABILITIES_TABLE} (
							*,
							slots: ${this.TOUR_AVAILABILITY_SLOTS_TABLE} (
								*,
								time_slot: ${this.TOUR_TIME_SLOTS_TABLE} (*)
							)
						)
					)
				`,
			)
			.eq("id", tourId)
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				throw new ApiError("Tour not found", 404, []);
			}
			throw new ApiError(error.message, 500, [error.details || []]);
		}

		if (!tour) {
			throw new ApiError("Tour not found", 404, []);
		}

		return {
			...tour,
			tags: tour.tags.map((tag) => tag.tour_tags),
			city: {
				id: tour.city.id,
				name: tour.city.name,
			},
			tour_category: {
				id: tour.tour_category.id,
				name: tour.tour_category.name,
			},
		};
	}

	/** Get tours for main tours page in the admin panel  */
	async getHighLevelTours(
		q = "",
		pageIndex = 0,
		pageSize = 10,
		filters: TourFilters = {},
	): Promise<GetHighLevelToursResponse> {
		const from = pageIndex * pageSize;
		const to = from + pageSize - 1;

		try {
			let query = this.supabase
				.from(this.TOURS_TABLE)
				.select(
					`
						id, name, cover_image, updated_at, isFeatured, isActive,
						${this.META_DETAILS_TABLE}(url_key),
						${this.CITIES_TABLE}(id, name, ${this.META_DETAILS_TABLE}(url_key)),
						${this.CATEGORIES_TABLE}(id, name, ${this.META_DETAILS_TABLE}(url_key)),
						tour_options(tour_availabilities(date, isActive, tour_availability_slots(seat_type, available_seats)))
					`,
					{ count: "exact" },
				)
				.range(from, to);

			if (q.trim().length > 0) {
				query = query.ilike("name", `%${q}%`);
			}

			if (filters.isFeatured != null) {
				query = query.eq("isFeatured", filters.isFeatured);
			}

			if (filters.isActive != null) {
				query = query.eq("isActive", filters.isActive);
			}

			if (filters.categories && filters.categories.length > 0) {
				query = query.in(
					"tour_category_id",
					filters.categories.map((i) => Number(i)),
				);
			}

			if (filters.cities && filters.cities.length > 0) {
				query = query.in(
					"city_id",
					filters.cities.map((i) => Number(i)),
				);
			}

			if (filters.providers && filters.providers.length > 0) {
				query = query.in(
					"provider",
					filters.providers.map((i) => Number(i)),
				);
			}

			if (filters.tags && filters.tags.length > 0) {
				const { data: tagTourIds, error: tagError } = await this.supabase
					.from(this.TOURS_TAGS_LINK_TABLE)
					.select("tour_id")
					.in(
						"tour_tag_id",
						filters.tags.map((i) => Number(i)),
					);

				if (tagError) {
					throw new ApiError(tagError.message, 500, [tagError.details || ""]);
				}

				const uniqueTourIds = [...new Set(tagTourIds.map((t) => t.tour_id))];
				if (uniqueTourIds.length > 0) {
					query = query.in("id", uniqueTourIds);
				} else {
					// No matching tours, return empty
					return { tours: [], total: 0 };
				}
			}

			if (filters.isOpenDated != null) {
				const { data: openDatedTourIds, error: openDatedError } = await this.supabase
					.from(this.TOUR_OPTIONS_TABLE)
					.select("tour_id")
					.eq("isOpenDated", true);

				if (openDatedError) {
					throw new ApiError(openDatedError.message, 500, [openDatedError.details || ""]);
				}

				const uniqueOpenDatedIds = [...new Set(openDatedTourIds.map((o) => o.tour_id))];

				if (filters.isOpenDated) {
					if (uniqueOpenDatedIds.length > 0) {
						query = query.in("id", uniqueOpenDatedIds);
					} else {
						// If isOpenDated=true and no such tours, return empty
						return { tours: [], total: 0 };
					}
				} else {
					if (uniqueOpenDatedIds.length > 0) {
						query = query.notIn("id", uniqueOpenDatedIds);
					}
				}
			}

			if (filters.created_at) {
				query = query.gte("created_at", filters.created_at.from.toISOString());
				query = query.lte("created_at", filters.created_at.to.toISOString());
			}

			if (filters.sortBy) {
				query = query.order(filters.sortBy, { ascending: filters.sortType === "asc" });
			} else {
				query = query.order("created_at", { ascending: false });
			}

			const { data, error, count } = await query;

			if (error) {
				throw new ApiError(error.message, 500, [error.details || ""]);
			}

			const computeToBeSoldOutScore = (tour: (typeof data)[0]): number => {
				const now = new Date().toISOString().split("T")[0];
				let totalLimited = 0;
				let soldOut = 0;
				for (const option of tour.tour_options || []) {
					for (const avail of option.tour_availabilities || []) {
						if (avail.date >= now && avail.isActive) {
							for (const slot of avail.tour_availability_slots || []) {
								if (slot.seat_type === "LIMITED" && slot.available_seats != null) {
									totalLimited++;
									if (slot.available_seats <= 0) {
										soldOut++;
									}
								}
							}
						}
					}
				}
				return totalLimited > 0 ? soldOut / totalLimited : 0;
			};

			const tours: HighLevelTour[] = data.map((tour: (typeof data)[0]) => ({
				id: tour.id,
				name: tour.name,
				cover_image: tour.cover_image,
				updated_at: tour.updated_at ?? "",
				url_key: tour.meta_details.url_key,
				isFeatured: tour.isFeatured,
				isActive: tour.isActive,
				toBeSoldOutScore: computeToBeSoldOutScore(tour),
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
			}));

			return { tours, total: count ?? 0 };
		} catch (error) {
			console.error(error);

			throw error instanceof ApiError ? error : new ApiError("Failed to get tours", 500, []);
		}
	}
}
