// @ts-nocheck
import { ApiError } from "@workspace/shared/utils/ApiError";
import { MediaService } from "@workspace/shared/services/media.service";
import { Service } from "@workspace/shared/services/service.base";
import { UseClassMiddleware } from "@workspace/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@workspace/shared/middlewares/logger.middleware";
import { verifyUser } from "@workspace/shared/middlewares/auth.middleware";
import { asServiceMiddleware } from "@workspace/shared/middlewares/utils";
import { MetaDetailsService } from "@workspace/shared/services/meta-details.service";
import type { AddTourActionDate } from "@workspace/shared/schemas/tour.schema";
import type { Database, Tables, TablesInsert } from "@workspace/shared/types/supabase";
import type {
	GetHighLevelToursResponse,
	GetTourDetails,
	GetTourDetailsForUpdate,
	HighLevelTour,
} from "@workspace/shared/types/tours";
import { type TourFilters } from "@workspace/shared/schemas/tours-filter.schema";
import { type FPTourFilters } from "@workspace/shared/schemas/fp-tours-filter.schema";
import type { FP_HighLevelTour, GetFPHighLevelToursResponse } from "@workspace/shared/types/fp-tours";
import { UseMiddleware } from "@workspace/shared/decorators/useMiddleware";

@UseClassMiddleware(loggerMiddleware)
export class ToursService extends Service {
	/** Add tour details */
	@UseMiddleware(asServiceMiddleware<ToursService>(verifyUser))
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
	@UseMiddleware(asServiceMiddleware<ToursService>(verifyUser))
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

		let hasGroupPrice =
			tour.tour_options.some((option) =>
				option.prices.some(
					(price) => price.participant_type.age_max === 0 && price.participant_type.age_min === 0,
				),
			) || false;

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
			hasGroupPrice,
		};
	}

	/** Get tour details for update page */
	@UseMiddleware(asServiceMiddleware<ToursService>(verifyUser))
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
	@UseMiddleware(asServiceMiddleware<ToursService>(verifyUser))
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

	/** Update tour details */
	@UseMiddleware(asServiceMiddleware<ToursService>(verifyUser))
	async updateTour(data: any, tour_id: string) {
		const {
			tour_update,
			added_tags,
			removed_tags,
			tour_options_updates,
			cover_image,
			// removed_cover_image,
			images = [],
			removed_images = [],
			meta_details,
		} = data;

		// Fetch current tour data (needed for image handling & meta_details_id)
		const { data: currentTour, error: fetchError } = await this.supabase
			.from(this.TOURS_TABLE)
			.select(
				"*, meta_details_id, images, cover_image, tour_options(*, tour_option_prices(*), tour_availabilities(*, tour_availability_slots(*, tour_time_slots(*))))",
			)
			.eq("id", tour_id)
			.single();

		if (fetchError || !currentTour) {
			throw new ApiError(fetchError?.message ?? "Failed to fetch current tour", 500, []);
		}

		const mediaSvc = await this.createSubService(MediaService);

		let newCoverPath: string | null = null;
		const newImagePaths: string[] = [];

		try {
			// 1. Update main tour fields
			if (tour_update && Object.keys(tour_update).length > 0) {
				const { error } = await this.supabase
					.from(this.TOURS_TABLE)
					.update(tour_update)
					.eq("id", tour_id);
				if (error) throw new ApiError("Failed to update tour fields", 500, []);
			}

			// 2. Handle tags
			if (added_tags?.length > 0) {
				const tagInserts = added_tags.map((tag_id: number) => ({
					tour_id,
					tour_tag_id: tag_id,
				}));
				const { error } = await this.supabase.from(this.TOURS_TAGS_LINK_TABLE).insert(tagInserts);
				if (error) throw new ApiError("Failed to add tags", 500, []);
			}

			if (removed_tags?.length > 0) {
				const { error } = await this.supabase
					.from(this.TOURS_TAGS_LINK_TABLE)
					.delete()
					.eq("tour_id", tour_id)
					.in("tour_tag_id", removed_tags);
				if (error) throw new ApiError("Failed to remove tags", 500, []);
			}

			// === COVER IMAGE HANDLING (exact same flow as updateCategory) ===
			// === COVER IMAGE HANDLING ===
			let newCoverPath: string | null = null;

			if (cover_image && cover_image instanceof File && cover_image.size > 0) {
				const { data } = await mediaSvc.uploadImage(cover_image);

				if (!data?.path || data?.path === "") {
					throw new ApiError("Failed to upload cover image", 500, []);
				}

				newCoverPath = data.path;
			}

			// === SECONDARY IMAGES HANDLING ===
			const newImagePaths: string[] = [];

			if (images.length > 0) {
				for (const file of images) {
					if (!(file instanceof File) || file.size === 0) continue;

					const { data } = await mediaSvc.uploadImage(file);

					if (!data?.path || data?.path === "") {
						throw new ApiError("Failed to upload secondary image", 500, []);
					}

					newImagePaths.push(data.path);
				}
			}

			// === BUILD IMAGE UPDATE OBJECT ===
			const tourImageUpdate: Partial<any> = {};

			// Handle cover image update
			if (newCoverPath) {
				tourImageUpdate.cover_image = newCoverPath;
			}

			// Handle secondary images update (any combination of add/remove)
			if (newImagePaths.length > 0 || removed_images.length > 0) {
				const currentImages = currentTour.images || [];
				const keptImages = currentImages.filter((img: string) => !removed_images.includes(img));
				const finalImages = [...keptImages, ...newImagePaths];
				tourImageUpdate.images = finalImages;
			}

			// Apply DB update only if something changed
			if (Object.keys(tourImageUpdate).length > 0) {
				const { error } = await this.supabase
					.from(this.TOURS_TABLE)
					.update(tourImageUpdate)
					.eq("id", tour_id);

				if (error) {
					// Rollback all uploaded files on failure
					if (newCoverPath) await mediaSvc.deleteImage(newCoverPath);
					for (const path of newImagePaths) await mediaSvc.deleteImage(path);
					throw new ApiError("Failed to update tour images", 500, []);
				}
			}

			// === CLEANUP OLD FILES AFTER SUCCESSFUL UPDATE ===

			// Delete old cover image only if we uploaded a new one
			if (newCoverPath && currentTour.cover_image) {
				await mediaSvc.deleteImage(currentTour.cover_image);
			}

			// Delete removed secondary images
			if (removed_images.length > 0) {
				for (const url of removed_images) {
					if (url && typeof url === "string") {
						await mediaSvc.deleteImage(url);
					}
				}
			}
			// 5. Handle meta_details
			if (meta_details) {
				const metaDetailsService = await this.createSubService(MetaDetailsService);
				await metaDetailsService.updateMetaDetails({
					meta_details,
					metaDetailsId: currentTour.meta_details_id,
				});
			}

			// 6. Handle tour_options_updates
			if (tour_options_updates) {
				await this.updateTourOptions_V2(tour_id, tour_options_updates);
			}
		} catch (error: any) {
			// Rollback uploaded images on any failure
			if (newCoverPath) await mediaSvc.deleteImage(newCoverPath);
			for (const path of newImagePaths) await mediaSvc.deleteImage(path);

			console.error(error);
			throw new ApiError(error.message || "Tour update failed", error.statusCode ?? 500, []);
		}
	}

	/** Update all details related to tour options */
	async updateTourOptions(
		tour_id: string,
		payload: {
			new_options?: any[];
			deleted_options?: number[];
			updated_options?: any[];

			new_prices?: any[];
			deleted_prices?: number[];
			updated_prices?: any[];

			new_availabilities?: any[];
			deleted_availabilities?: number[];
			updated_availabilities?: any[];

			new_slots?: any[];
			deleted_slots?: number[];
			updated_slots?: any[];

			new_timeslots?: any[];
			deleted_timeslots?: number[];
			updated_timeslots?: any[];
		},
	) {
		const {
			new_options = [],
			deleted_options = [],
			updated_options = [],

			new_prices = [],
			deleted_prices = [],
			updated_prices = [],

			new_availabilities = [],
			deleted_availabilities = [],
			updated_availabilities = [],

			new_slots = [],
			deleted_slots = [],
			updated_slots = [],

			new_timeslots = [],
			deleted_timeslots = [],
			updated_timeslots = [],
		} = payload;

		try {
			// 1. Handle time slots first (global, needed for slots)
			const timeSlotMap = new Map<string, number>(); // time -> id

			// Process new timeslots
			for (const ts of new_timeslots) {
				const { time, label, sort_order } = ts;

				// Check if time exists
				const { data: existingTs, error: checkErr } = await this.supabase
					.from(this.TOUR_TIME_SLOTS_TABLE)
					.select("id, label, sort_order")
					.eq("time", time)
					.single();

				if (checkErr && checkErr.code !== "PGRST116") {
					throw new ApiError(`Failed to check time slot: ${checkErr.message}`, 500);
				}

				if (existingTs) {
					// Update if label or sort changed
					const updateData: any = {};
					if (label !== existingTs.label) updateData.label = label;
					if (sort_order !== existingTs.sort_order) updateData.sort_order = sort_order;

					if (Object.keys(updateData).length > 0) {
						const { error } = await this.supabase
							.from(this.TOUR_TIME_SLOTS_TABLE)
							.update(updateData)
							.eq("id", existingTs.id);

						if (error) throw new ApiError(`Failed to update time slot ${existingTs.id}`, 500);
					}

					timeSlotMap.set(time, existingTs.id);
				} else {
					// Insert new
					const { data: newTs, error } = await this.supabase
						.from(this.TOUR_TIME_SLOTS_TABLE)
						.insert({ time, label, sort_order })
						.select("id")
						.single();

					if (error || !newTs)
						throw new ApiError(`Failed to insert time slot: ${error?.message}`, 500);
					timeSlotMap.set(time, newTs.id);
				}
			}

			// Process updated timeslots
			for (const ts of updated_timeslots) {
				const { id, label, sort_order } = ts;

				const updateData: any = {};
				if (label !== undefined) updateData.label = label;
				if (sort_order !== undefined) updateData.sort_order = sort_order;

				if (Object.keys(updateData).length > 0) {
					const { error } = await this.supabase
						.from(this.TOUR_TIME_SLOTS_TABLE)
						.update(updateData)
						.eq("id", id);

					if (error) throw new ApiError(`Failed to update time slot ${id}: ${error.message}`, 500);
				}
			}

			// 2. Delete slots
			if (deleted_slots.length > 0) {
				const { error } = await this.supabase
					.from(this.TOUR_AVAILABILITY_SLOTS_TABLE)
					.delete()
					.in("id", deleted_slots);

				if (error) throw new ApiError(`Failed to delete slots: ${error.message}`, 500);
			}

			// 3. Delete availabilities
			if (deleted_availabilities.length > 0) {
				const { error } = await this.supabase
					.from(this.TOUR_AVAILABILITIES_TABLE)
					.delete()
					.in("id", deleted_availabilities);

				if (error) throw new ApiError(`Failed to delete availabilities: ${error.message}`, 500);
			}

			// 4. Delete prices
			if (deleted_prices.length > 0) {
				const { error } = await this.supabase
					.from(this.TOUR_OPTION_PRICES_TABLE)
					.delete()
					.in("id", deleted_prices);

				if (error) throw new ApiError(`Failed to delete prices: ${error.message}`, 500);
			}

			// 5. Delete options (after nested deletes)
			if (deleted_options.length > 0) {
				const { error } = await this.supabase
					.from(this.TOUR_OPTIONS_TABLE)
					.delete()
					.in("id", deleted_options);

				if (error) throw new ApiError(`Failed to delete options: ${error.message}`, 500);
			}

			// 6. Update options
			for (const opt of updated_options) {
				const { id, ...updateData } = opt;
				if (Object.keys(updateData).length > 0) {
					const { error } = await this.supabase
						.from(this.TOUR_OPTIONS_TABLE)
						.update(updateData)
						.eq("id", id);

					if (error) throw new ApiError(`Failed to update option ${id}: ${error.message}`, 500);
				}
			}

			// 7. Insert new options, map temp IDs
			const optionIdMap = new Map<string, number>(); // temp -> real id
			if (new_options.length > 0) {
				const { data: newOpts, error } = await this.supabase
					.from(this.TOUR_OPTIONS_TABLE)
					.insert(new_options.map((opt) => ({ ...opt, tour_id })))
					.select("id");

				if (error || !newOpts)
					throw new ApiError(`Failed to insert new options: ${error?.message}`, 500);

				new_options.forEach((_, index) => {
					const tempId = `new-opt-${index + 1}`; // Match frontend counter starting from 1
					optionIdMap.set(tempId, newOpts[index].id);
				});
			}
			// console.log("Updated Prices: ", updated_prices);

			// 8. Update prices
			for (const price of updated_prices) {
				let pl: Partial<Tables<"tour_option_prices">> = {};
				if (price.price) {
					pl.price = price.price;
				}

				if (price.participant_type_id) {
					pl.participant_type_id = price.participant_type_id;
				}

				// console.log(pl);
				const { error } = await this.supabase
					.from(this.TOUR_OPTION_PRICES_TABLE)
					.update(pl)
					.eq("id", price.id);

				if (error) throw new ApiError(`Failed to update price ${price.id}: ${error.message}`, 500);
			}

			// 9. Insert new prices, resolve tour_option_id
			if (new_prices.length > 0) {
				const resolvedNewPrices = new_prices.map((price) => {
					const resolvedId =
						typeof price.tour_option_id === "string"
							? optionIdMap.get(price.tour_option_id)
							: price.tour_option_id;
					if (resolvedId === undefined) throw new ApiError(`Unresolved option ID for price`, 500);
					return { ...price, tour_option_id: resolvedId };
				});

				const { error } = await this.supabase
					.from(this.TOUR_OPTION_PRICES_TABLE)
					.insert(resolvedNewPrices);

				if (error) throw new ApiError(`Failed to insert new prices: ${error.message}`, 500);
			}

			// 10. Update availabilities
			for (const avail of updated_availabilities) {
				const { id, isActive } = avail;
				const { error } = await this.supabase
					.from(this.TOUR_AVAILABILITIES_TABLE)
					.update({ isActive })
					.eq("id", id);

				if (error) throw new ApiError(`Failed to update availability ${id}: ${error.message}`, 500);
			}

			// 11. Insert new availabilities, map temp IDs
			const availIdMap = new Map<string, number>();
			if (new_availabilities.length > 0) {
				const resolvedNewAvails = new_availabilities.map((avail) => {
					const resolvedId =
						typeof avail.tour_option_id === "string"
							? optionIdMap.get(avail.tour_option_id)
							: avail.tour_option_id;
					if (resolvedId === undefined)
						throw new ApiError(`Unresolved option ID for availability`, 500);
					return { ...avail, tour_option_id: resolvedId };
				});

				const { data: newAvails, error } = await this.supabase
					.from(this.TOUR_AVAILABILITIES_TABLE)
					.insert(resolvedNewAvails)
					.select("id");

				if (error || !newAvails)
					throw new ApiError(`Failed to insert new availabilities: ${error?.message}`, 500);

				new_availabilities.forEach((_, index) => {
					// Frontend counter for avail starts after opt, but we can calculate based on order
					// Since order preserved, map by index
					availIdMap.set(`new-avail-${new_options.length + index + 1}`, newAvails[index].id); // Adjust counter based on frontend logic
					// NOTE: Frontend uses ++tempCounter across opt and avail, so if 2 new opt, then new avail will be new-avail-3 etc.
					// But to make robust, perhaps use unique temp, but since sequential, and we know new_opt count, but to simplify, assume order of processing matches
				});
			}

			// 12. Update slots
			for (const slot of updated_slots) {
				const { id, ...updateData } = slot;
				if (Object.keys(updateData).length > 0) {
					const { error } = await this.supabase
						.from(this.TOUR_AVAILABILITY_SLOTS_TABLE)
						.update(updateData)
						.eq("id", id);

					if (error) throw new ApiError(`Failed to update slot ${id}: ${error.message}`, 500);
				}
			}

			// 13. Insert new slots, resolve IDs
			if (new_slots.length > 0) {
				const resolvedNewSlots = [];
				for (const slot of new_slots) {
					const resolvedAvailId =
						typeof slot.availability_id === "string"
							? availIdMap.get(slot.availability_id)
							: slot.availability_id;
					if (resolvedAvailId === undefined)
						throw new ApiError(`Unresolved availability ID for slot`, 500);

					// ALWAYS create a NEW time_slot row — NO REUSE
					const { data: newTs, error: insErr } = await this.supabase
						.from(this.TOUR_TIME_SLOTS_TABLE)
						.insert({
							time: slot.time,
							label: slot.label,
							sort_order: slot.sort_order,
						})
						.select("id")
						.single();

					if (insErr || !newTs)
						throw new ApiError(`Failed to create time slot: ${insErr?.message}`, 500);

					const timeSlotId = newTs.id;

					resolvedNewSlots.push({
						availability_id: resolvedAvailId,
						time_slot_id: timeSlotId,
						available_seats: slot.available_seats,
						seat_type: slot.seat_type,
					});
				}

				const { error } = await this.supabase
					.from(this.TOUR_AVAILABILITY_SLOTS_TABLE)
					.insert(resolvedNewSlots);

				if (error) throw new ApiError(`Failed to insert new slots: ${error.message}`, 500);
			}

			// 14. Delete unused time slots
			for (const id of deleted_timeslots) {
				// Check usage
				// console.log("DEleted timeslot: ", id);

				const { count, error: countErr } = await this.supabase
					.from(this.TOUR_AVAILABILITY_SLOTS_TABLE)
					.select("id", { count: "exact", head: true })
					.eq("time_slot_id", id);

				if (countErr) {
					console.warn(`Failed to check usage for time slot ${id}: ${countErr.message}`);
					continue;
				}

				if (count === 0) {
					const { error } = await this.supabase
						.from(this.TOUR_TIME_SLOTS_TABLE)
						.delete()
						.eq("id", id);

					if (error) console.warn(`Failed to delete unused time slot ${id}: ${error.message}`);
				}
			}
		} catch (error: any) {
			console.error("Tour options update failed:", error);
			throw new ApiError(error.message || "Failed to update tour options", 500);
		}
	}
	async updateTourOptions_V2(
		tour_id: string,
		payload: {
			new_options?: any[];
			deleted_options?: number[];
			updated_options?: any[];

			new_prices?: any[];
			deleted_prices?: number[];
			updated_prices?: any[];

			new_availabilities?: any[];
			deleted_availabilities?: number[];
			updated_availabilities?: any[];

			new_slots?: any[];
			deleted_slots?: number[];
			updated_slots?: any[];

			new_timeslots?: any[];
			deleted_timeslots?: number[];
			updated_timeslots?: any[];
		},
	) {
		const {
			new_options = [],
			deleted_options = [],
			updated_options = [],

			new_prices = [],
			deleted_prices = [],
			updated_prices = [],

			new_availabilities = [],
			deleted_availabilities = [],
			updated_availabilities = [],

			new_slots = [],
			deleted_slots = [],
			updated_slots = [],

			new_timeslots = [],
			deleted_timeslots = [],
			updated_timeslots = [],
		} = payload;

		try {
			// Retry wrapper for network errors
			const withRetry = async (
				fn: () => Promise<any>,
				retries: number = 3,
				delayBase: number = 1000,
			) => {
				let lastErr: any;
				for (let attempt = 1; attempt <= retries; attempt++) {
					try {
						return await fn();
					} catch (err: any) {
						lastErr = err;
						if (
							err.message?.includes("fetch failed") ||
							err.message?.includes("network") ||
							err.code === "ECONNRESET"
						) {
							await new Promise((resolve) => setTimeout(resolve, delayBase * attempt));
						} else {
							throw err;
						}
					}
				}
				throw lastErr;
			};

			// Helper for chunked deletes
			const chunkedDelete = async (table: string, ids: number[], batchSize: number = 500) => {
				for (let i = 0; i < ids.length; i += batchSize) {
					const batch = ids.slice(i, i + batchSize);
					const { error } = await withRetry(() =>
						this.supabase.from(table).delete().in("id", batch),
					);
					if (error) throw new ApiError(`Failed to delete in ${table}: ${error.message}`, 500);
				}
			};

			// Helper for chunked inserts (returns all inserted data concatenated)
			const chunkedInsert = async <T extends { id: number }>(
				table: string,
				items: any[],
				batchSize: number = 500,
			): Promise<T[]> => {
				let allData: T[] = [];
				for (let i = 0; i < items.length; i += batchSize) {
					const batch = items.slice(i, i + batchSize);
					const { data, error } = await withRetry(() =>
						this.supabase.from(table).insert(batch).select("*"),
					);
					if (error || !data)
						throw new ApiError(`Failed to insert in ${table}: ${error?.message}`, 500);
					allData = allData.concat(data as T[]);
				}
				return allData;
			};

			// === Handle time slots (global) ===

			// 1. Process new_timeslots in bulk
			const timeSlotMap = new Map<string, number>(); // time -> id

			if (new_timeslots.length > 0) {
				// Collect unique times
				const uniqueTimes = [...new Set(new_timeslots.map((ts) => ts.time))];

				// Bulk check existing
				const { data: existingTss, error: checkErr } = await withRetry(() =>
					this.supabase
						.from(this.TOUR_TIME_SLOTS_TABLE)
						.select("id, time, label, sort_order")
						.in("time", uniqueTimes),
				);

				if (checkErr) {
					throw new ApiError(`Failed to check time slots: ${checkErr.message}`, 500);
				}

				// Map existing
				const existingByTime = new Map(existingTss.map((ts) => [ts.time, ts]));

				// Prepare inserts and updates
				const tsInserts = [];
				const tsUpdates = []; // Collect for chunked updates

				for (const ts of new_timeslots) {
					const { time, label, sort_order } = ts;
					const existing = existingByTime.get(time);

					if (existing) {
						const updateData: any = {};
						if (label !== existing.label) updateData.label = label;
						if (sort_order !== existing.sort_order) updateData.sort_order = sort_order;

						if (Object.keys(updateData).length > 0) {
							tsUpdates.push({ id: existing.id, ...updateData });
						}
						timeSlotMap.set(time, existing.id);
					} else {
						tsInserts.push({ time, label, sort_order });
					}
				}

				// Bulk insert new
				if (tsInserts.length > 0) {
					const newTss = await chunkedInsert<{ id: number; time: string }>(
						this.TOUR_TIME_SLOTS_TABLE,
						tsInserts,
					);
					newTss.forEach((ts) => timeSlotMap.set(ts.time, ts.id));
				}

				// Chunked update for time slots (smaller batch for stability)
				if (tsUpdates.length > 0) {
					for (let i = 0; i < tsUpdates.length; i += 100) {
						// Reduced to 100
						const batch = tsUpdates.slice(i, i + 100);
						const updatePromises = batch.map((update) =>
							withRetry(() =>
								this.supabase
									.from(this.TOUR_TIME_SLOTS_TABLE)
									.update(update)
									.eq("id", update.id),
							),
						);
						const results = await Promise.all(updatePromises);
						results.forEach(({ error }) => {
							if (error)
								throw new ApiError(`Failed to update time slot: ${error.message}`, 500);
						});
					}
				}
			}

			// 2. Process updated_timeslots in chunked parallel
			if (updated_timeslots.length > 0) {
				for (let i = 0; i < updated_timeslots.length; i += 100) {
					// Reduced to 100
					const batch = updated_timeslots.slice(i, i + 100);
					const updatePromises = batch.map((ts) => {
						const { id, label, sort_order } = ts;
						const updateData: any = {};
						if (label !== undefined) updateData.label = label;
						if (sort_order !== undefined) updateData.sort_order = sort_order;

						if (Object.keys(updateData).length > 0) {
							return withRetry(() =>
								this.supabase
									.from(this.TOUR_TIME_SLOTS_TABLE)
									.update(updateData)
									.eq("id", id),
							);
						}
						return Promise.resolve({ error: null });
					});

					const updateResults = await Promise.all(updatePromises);
					updateResults.forEach(({ error }) => {
						if (error) throw new ApiError(`Failed to update time slot: ${error.message}`, 500);
					});
				}
			}

			// === Deletes (chunked bulk) ===

			// 3. Delete slots (chunked)
			if (deleted_slots.length > 0) {
				await chunkedDelete(this.TOUR_AVAILABILITY_SLOTS_TABLE, deleted_slots);
			}

			// 4. Delete availabilities (chunked)
			if (deleted_availabilities.length > 0) {
				await chunkedDelete(this.TOUR_AVAILABILITIES_TABLE, deleted_availabilities);
			}

			// 5. Delete prices (chunked)
			if (deleted_prices.length > 0) {
				await chunkedDelete(this.TOUR_OPTION_PRICES_TABLE, deleted_prices);
			}

			// 6. Delete options (chunked)
			if (deleted_options.length > 0) {
				await chunkedDelete(this.TOUR_OPTIONS_TABLE, deleted_options);
			}

			// === Updates (chunked parallel) ===

			// 7. Update options (chunked parallel)
			if (updated_options.length > 0) {
				for (let i = 0; i < updated_options.length; i += 100) {
					// Reduced to 100
					const batch = updated_options.slice(i, i + 100);
					const updatePromises = batch.map((opt) => {
						const { id, ...updateData } = opt;
						if (Object.keys(updateData).length > 0) {
							return withRetry(() =>
								this.supabase.from(this.TOUR_OPTIONS_TABLE).update(updateData).eq("id", id),
							);
						}
						return Promise.resolve({ error: null });
					});

					const updateResults = await Promise.all(updatePromises);
					updateResults.forEach(({ error }) => {
						if (error) throw new ApiError(`Failed to update option: ${error.message}`, 500);
					});
				}
			}

			// 8. Update prices (chunked parallel)
			if (updated_prices.length > 0) {
				for (let i = 0; i < updated_prices.length; i += 100) {
					// Reduced to 100
					const batch = updated_prices.slice(i, i + 100);
					const updatePromises = batch.map((price) => {
						const pl: Partial<Database["public"]["Tables"]["tour_option_prices"]["Update"]> = {};
						if (price.price !== undefined) pl.price = price.price;
						if (price.participant_type_id !== undefined)
							pl.participant_type_id = price.participant_type_id;

						if (Object.keys(pl).length > 0) {
							return withRetry(() =>
								this.supabase
									.from(this.TOUR_OPTION_PRICES_TABLE)
									.update(pl)
									.eq("id", price.id),
							);
						}
						return Promise.resolve({ error: null });
					});

					const updateResults = await Promise.all(updatePromises);
					updateResults.forEach(({ error }) => {
						if (error) throw new ApiError(`Failed to update price: ${error.message}`, 500);
					});
				}
			}

			// 9. Update availabilities (chunked parallel)
			if (updated_availabilities.length > 0) {
				for (let i = 0; i < updated_availabilities.length; i += 100) {
					// Reduced to 100
					const batch = updated_availabilities.slice(i, i + 100);
					const updatePromises = batch.map((avail) => {
						const { id, isActive } = avail;
						return withRetry(() =>
							this.supabase
								.from(this.TOUR_AVAILABILITIES_TABLE)
								.update({ isActive })
								.eq("id", id),
						);
					});

					const updateResults = await Promise.all(updatePromises);
					updateResults.forEach(({ error }) => {
						if (error) throw new ApiError(`Failed to update availability: ${error.message}`, 500);
					});
				}
			}

			// 10. Update slots (chunked parallel)
			if (updated_slots.length > 0) {
				for (let i = 0; i < updated_slots.length; i += 100) {
					// Reduced to 100
					const batch = updated_slots.slice(i, i + 100);
					const updatePromises = batch.map((slot) => {
						const { id, ...updateData } = slot;
						if (Object.keys(updateData).length > 0) {
							return withRetry(() =>
								this.supabase
									.from(this.TOUR_AVAILABILITY_SLOTS_TABLE)
									.update(updateData)
									.eq("id", id),
							);
						}
						return Promise.resolve({ error: null });
					});

					const updateResults = await Promise.all(updatePromises);
					updateResults.forEach(({ error }) => {
						if (error) throw new ApiError(`Failed to update slot: ${error.message}`, 500);
					});
				}
			}

			// === Inserts (chunked) ===

			// 11. Insert new options, map temp IDs
			const optionIdMap = new Map<string, number>();
			if (new_options.length > 0) {
				const resolvedNewOpts = new_options.map((opt) => ({ ...opt, tour_id }));
				const newOpts = await chunkedInsert<{ id: number }>(this.TOUR_OPTIONS_TABLE, resolvedNewOpts);

				new_options.forEach((_, index) => {
					const tempId = `new-opt-${index + 1}`;
					optionIdMap.set(tempId, newOpts[index].id);
				});
			}

			// 12. Insert new prices, resolve IDs
			if (new_prices.length > 0) {
				const resolvedNewPrices = new_prices.map((price) => {
					const resolvedId =
						typeof price.tour_option_id === "string"
							? optionIdMap.get(price.tour_option_id)
							: price.tour_option_id;
					if (resolvedId === undefined) throw new ApiError(`Unresolved option ID for price`, 500);
					return { ...price, tour_option_id: resolvedId };
				});

				await chunkedInsert(this.TOUR_OPTION_PRICES_TABLE, resolvedNewPrices);
			}

			// 13. Insert new availabilities, map temp IDs
			const availIdMap = new Map<string, number>();
			if (new_availabilities.length > 0) {
				const resolvedNewAvails = new_availabilities.map((avail) => {
					const resolvedId =
						typeof avail.tour_option_id === "string"
							? optionIdMap.get(avail.tour_option_id)
							: avail.tour_option_id;
					if (resolvedId === undefined) {
						throw new ApiError(`Unresolved option ID for availability`, 500);
					}
					return { ...avail, tour_option_id: resolvedId };
				});

				const newAvails = await chunkedInsert<{ id: number }>(
					this.TOUR_AVAILABILITIES_TABLE,
					resolvedNewAvails,
				);

				new_availabilities.forEach((_, index) => {
					const tempId = `new-avail-${new_options.length + index + 1}`;
					availIdMap.set(tempId, newAvails[index].id);
				});
			}

			// 14. Insert new slots with bulk time slots creation
			if (new_slots.length > 0) {
				// Collect unique time configs
				const configMap = new Map<
					string,
					{ time: string; label: string | null; sort_order: number }
				>();
				new_slots.forEach((slot) => {
					const key = `${slot.time}|${slot.label ?? ""}|${slot.sort_order ?? 0}`;
					if (!configMap.has(key)) {
						configMap.set(key, {
							time: slot.time,
							label: slot.label,
							sort_order: slot.sort_order,
						});
					}
				});

				const uniqueConfigs = Array.from(configMap.values());
				const uniqueTimes = uniqueConfigs.map((c) => c.time);

				// Bulk fetch existing matching configs
				const { data: existingTss, error: fetchErr } = await withRetry(() =>
					this.supabase
						.from(this.TOUR_TIME_SLOTS_TABLE)
						.select("id, time, label, sort_order")
						.in("time", uniqueTimes),
				);

				if (fetchErr) {
					throw new ApiError(`Failed to fetch existing time slots: ${fetchErr.message}`, 500);
				}

				// Map existing by config key
				const existingConfigMap = new Map<string, number>();
				existingTss.forEach((ts) => {
					const key = `${ts.time}|${ts.label ?? ""}|${ts.sort_order ?? 0}`;
					existingConfigMap.set(key, ts.id);
				});

				// Prepare new inserts
				const tsInserts = uniqueConfigs.filter((c) => {
					const key = `${c.time}|${c.label ?? ""}|${c.sort_order ?? 0}`;
					return !existingConfigMap.has(key);
				});

				// Bulk insert new time slots (chunked)
				if (tsInserts.length > 0) {
					const newTss = await chunkedInsert<{
						id: number;
						time: string;
						label: string | null;
						sort_order: number;
					}>(this.TOUR_TIME_SLOTS_TABLE, tsInserts);
					newTss.forEach((ts) => {
						const key = `${ts.time}|${ts.label ?? ""}|${ts.sort_order ?? 0}`;
						existingConfigMap.set(key, ts.id);
					});
				}

				// Now resolve slots
				const resolvedNewSlots = new_slots.map((slot) => {
					const resolvedAvailId =
						typeof slot.availability_id === "string"
							? availIdMap.get(slot.availability_id)
							: slot.availability_id;
					if (resolvedAvailId === undefined) {
						throw new ApiError(`Unresolved availability ID for slot`, 500);
					}

					const key = `${slot.time}|${slot.label ?? ""}|${slot.sort_order ?? 0}`;
					const timeSlotId = existingConfigMap.get(key);
					if (timeSlotId === undefined) {
						throw new ApiError(`Failed to resolve time slot ID for config: ${key}`, 500);
					}

					return {
						availability_id: resolvedAvailId,
						time_slot_id: timeSlotId,
						available_seats: slot.available_seats,
						seat_type: slot.seat_type,
					};
				});

				// Chunked insert slots
				await chunkedInsert(this.TOUR_AVAILABILITY_SLOTS_TABLE, resolvedNewSlots);
			}

			// 15. Delete unused time slots (chunked check and delete)
			if (deleted_timeslots.length > 0) {
				// Chunk the check if very large
				let usedIds = new Set<number>();
				for (let i = 0; i < deleted_timeslots.length; i += 500) {
					const batch = deleted_timeslots.slice(i, i + 500);
					const { data: usages, error: countErr } = await withRetry(() =>
						this.supabase
							.from(this.TOUR_AVAILABILITY_SLOTS_TABLE)
							.select("time_slot_id")
							.in("time_slot_id", batch),
					);

					if (countErr) {
						console.warn(`Failed to check time slot usages: ${countErr.message}`);
						continue;
					}

					usages.forEach((u) => usedIds.add(u.time_slot_id));
				}

				const toDelete = deleted_timeslots.filter((id) => !usedIds.has(id));

				if (toDelete.length > 0) {
					await chunkedDelete(this.TOUR_TIME_SLOTS_TABLE, toDelete);
				}
			}
		} catch (error: any) {
			console.error("Tour options update failed:", error);
			throw new ApiError(error.message || "Failed to update tour options", 500);
		}
	}
	/** Get tours for searching, for main page and for handling all the filters for front panel */
	async getFPHighLevelTours(
		q = "",
		pageIndex = 0,
		pageSize = 10,
		filters: FPTourFilters = {},
	): Promise<GetFPHighLevelToursResponse> {
		const from = pageIndex * pageSize;
		const to = from + pageSize - 1;

		try {
			let query = this.supabase
				.from(this.TOURS_TABLE)
				.select(
					`
						id, name, cover_image, updated_at,
						${this.META_DETAILS_TABLE}(url_key),
						${this.CITIES_TABLE}(id, name, ${this.META_DETAILS_TABLE}(url_key)),
						${this.CATEGORIES_TABLE}(id, name, ${this.META_DETAILS_TABLE}(url_key)),
						${this.TOUR_OPTIONS_TABLE} (
							prices: ${this.TOUR_OPTION_PRICES_TABLE} (price, ${this.PARTICIPANT_TYPES_TABLE}(age_min, age_max)),
							${this.TOUR_AVAILABILITIES_TABLE} (
								date, isActive,
								${this.TOUR_AVAILABILITY_SLOTS_TABLE} (
									seat_type, available_seats
								)
							)
						)
						`,
					{ count: "exact" },
				)
				.range(from, to)
				.eq("isActive", true);

			if (q.trim().length > 0) {
				query = query.ilike("name", `%${q}%`);
			}

			if (filters.isFeatured != null) {
				query = query.eq("isFeatured", filters.isFeatured);
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
					return { tours: [], total: 0 };
				}
			}

			function formatLocalDate(date: Date) {
				const yyyy = date.getFullYear();
				const mm = String(date.getMonth() + 1).padStart(2, "0");
				const dd = String(date.getDate()).padStart(2, "0");
				return `${yyyy}-${mm}-${dd}`;
			}

			// Available date filter
			if (filters.availableDate) {
				const dateStr = formatLocalDate(filters.availableDate);
				console.log("Filtering for date:", dateStr);

				const { data: matchingTourIds, error: idError } = await this.supabase
					.rpc("get_tours_with_active_availability_on_date", { p_date: dateStr })
					.select("tour_id");

				if (idError) {
					throw new ApiError(`Failed to fetch tours for date: ${idError.message}`, 500);
				}

				// console.log("Filtering for date:", dateStr);
				// console.log("Matching tour IDs from RPC:", matchingTourIds);

				if (matchingTourIds && matchingTourIds.length > 0) {
					const tourIds = matchingTourIds.map((row: any) => row.tour_id);
					query = query.in("id", tourIds);
				} else {
					return { tours: [], total: 0 };
				}
			}

			// Price range filter (min price across options)
			// if (filters.price && filters.price.length === 2) {
			// 	const [minP, maxP] = filters.price.sort((a, b) => a - b);
			// 	const minPriceSubquery = `(tour_options!inner(tour_option_prices!inner(price))).price`;
			// 	query = query.gte(minPriceSubquery, minP).lte(minPriceSubquery, maxP);
			// }

			// Default DB sort (only by created_at - price sort will be done in JS)
			query = query.order("created_at", { ascending: false });

			const { data, error, count } = await query;

			if (error) {
				throw new ApiError(error.message, 500, [error.details || ""]);
			}

			// Helper: min price of one option
			// const getOptionMinPrice = (option: any): number => {
			// 	if (!option.prices?.length) return Infinity;
			// 	return Math.min(...option.prices.map((p: any) => p.price));
			// };

			const getTourMinPrice = (tour: (typeof data)[0]): number => {
				let min = Infinity;
				for (const option of tour.tour_options || []) {
					for (const price of option.prices || []) {
						if (price.price < min) min = price.price;
					}
				}
				return min === Infinity ? 0 : min;
			};

			// Helper: sold-out score
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
									if (slot.available_seats <= 0) soldOut++;
								}
							}
						}
					}
				}
				return totalLimited > 0 ? soldOut / totalLimited : 0;
			};

			// Map raw data → enriched tours with min price
			let tours: FP_HighLevelTour[] = data.map((tour: (typeof data)[0]) => {
				// const minPrice = Math.min(...tour.tour_options.map(getOptionMinPrice), Infinity);
				const minPrice = getTourMinPrice(tour);
				let hasGroupPrice =
					tour.tour_options.some((option) =>
						option.prices.some(
							(price) =>
								price.participant_types.age_max === 0 &&
								price.participant_types.age_min === 0,
						),
					) || false;

				return {
					id: tour.id,
					name: tour.name,
					cover_image: tour.cover_image,
					url_key: tour.meta_details.url_key,
					updated_at: tour.updated_at,
					toBeSoldOutScore: computeToBeSoldOutScore(tour),
					price: minPrice === Infinity ? 0 : minPrice,
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

			// Apply price sorting in JavaScript (simple & reliable)
			if (filters.sortBy === "price") {
				tours.sort((a, b) => {
					if (filters.sortType === "asc") {
						return a.price - b.price;
					}
					return b.price - a.price;
				});
			}

			if (filters.price && filters.price.length === 2) {
				const [minP, maxP] = filters.price.sort((a, b) => a - b);
				tours = tours.filter((tour) => tour.price >= minP && tour.price <= maxP);
			}

			return { tours, total: count ?? 0 };
		} catch (error) {
			console.error(error);
			throw error instanceof ApiError ? error : new ApiError("Failed to get tours", 500, []);
		}
	}

	/** Get tour details for preview page */
	async getFPTourDetails(tourId: string): Promise<GetTourDetails | null> {
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
			.eq("isActive", true)
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

		let hasGroupPrice =
			tour.tour_options.some((option) =>
				option.prices.some(
					(price) => price.participant_type.age_max === 0 && price.participant_type.age_min === 0,
				),
			) || false;

		return {
			...tour,
			hasGroupPrice,
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
}
