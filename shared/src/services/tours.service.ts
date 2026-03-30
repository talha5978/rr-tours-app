// @ts-nocheck
import { ApiError } from "@workspace/shared/utils/ApiError";
import { MediaService } from "@workspace/shared/services/media.service";
import { Service } from "@workspace/shared/services/service.base";
import { UseClassMiddleware } from "@workspace/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@workspace/shared/middlewares/logger.middleware";
import { verifyUser } from "@workspace/shared/middlewares/auth.middleware";
import { asServiceMiddleware } from "@workspace/shared/middlewares/utils";
import { MetaDetailsService } from "@workspace/shared/services/meta-details.service";
import type { AddTourActionDate, UpdateTourActionPayload } from "@workspace/shared/schemas/tour.schema";
import type { Database, Tables, TablesInsert } from "@workspace/shared/types/supabase";
import type {
	GetHighLevelToursResponse,
	GetTourDetails,
	GetTourDetailsForUpdate,
	HighLevelTour,
	TourOptionsListResp,
	ToursListResp,
} from "@workspace/shared/types/tours";
import { type TourFilters } from "@workspace/shared/schemas/tours-filter.schema";
import { type FPTourFilters } from "@workspace/shared/schemas/fp-tours-filter.schema";
import type { FP_HighLevelTour, GetFPHighLevelToursResponse } from "@workspace/shared/types/fp-tours";
import { UseMiddleware } from "@workspace/shared/decorators/useMiddleware";

type UpdateTourPayload = UpdateTourActionPayload & {
	cover_image: File | null;
	images: File[] | null;
};

@UseClassMiddleware(loggerMiddleware)
export class ToursService extends Service {
	/** Add tour details */
	@UseMiddleware(asServiceMiddleware<ToursService>(verifyUser))
	async addTour(input: AddTourActionDate): Promise<string | null> {
		if (this.currentUser == null || this.currentUser.id == null) {
			throw new ApiError("Unauthorized", 401, []);
		}

		for (const option of input.tour_options) {
			if (option.rules == null || option.rules.length === 0) {
				throw new ApiError(
					`Please add at least one availability rule for ${option.name} tour option.`,
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
		const ruleIdsMap: Map<number, number[]> = new Map();
		const slotIdLabelMap: Map<string, number> = new Map();

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

			// Handle the availability rules
			for (let optIdx = 0; optIdx < input.tour_options.length; optIdx++) {
				const option = input.tour_options[optIdx];
				const optionId = insertedOptions[optIdx].id;

				// Prepare rules data
				const rulesData: TablesInsert<"availability_rules">[] = option.rules.map((rule) => ({
					start_date: rule.start_date,
					end_date: rule.end_date,
					weekdays: rule.weekdays.map(Number),
					is_active: rule.is_active === "true",
					tour_option_id: optionId,
				}));

				// Batch insert rules
				const { data: insertedRules, error: rulesError } = await this.supabase
					.from(this.AVAILABILITY_RULES_TABLE)
					.insert(rulesData)
					.select("id");

				if (rulesError) {
					throw new ApiError(rulesError.message, 500, [rulesError.details || []]);
				}

				ruleIdsMap.set(
					optIdx,
					insertedRules.map((r) => r.id),
				);

				// Prepare all time slots for this option's rules
				const allTimeSlots: TablesInsert<"time_slots">[] = [];
				option.rules.forEach((rule, ruleIdx) => {
					const ruleId = insertedRules[ruleIdx].id;
					rule.time_slots.forEach((ts) => {
						allTimeSlots.push({
							availability_rule_id: ruleId,
							label: ts.label,
							capacity: Number(ts.capacity),
							is_active: ts.is_active === "true",
						});
					});
				});

				// Batch insert time slots
				let { data: insertedTimeSlots, error: timeSlotsError } = await this.supabase
					.from(this.TIMESLOTS_TABLE)
					.insert(allTimeSlots)
					.select("id, label");

				if (timeSlotsError) {
					throw new ApiError(timeSlotsError.message, 500, [timeSlotsError.details || []]);
				}

				// Create label to id map (assuming unique labels per option)
				insertedTimeSlots.forEach((ts) => {
					if (ts.label) {
						slotIdLabelMap.set(ts.label, ts.id);
					}
				});

				// Prepare overrides data
				const overridesData: TablesInsert<"availability_overrides">[] = option.overrides.map((ov) => {
					let timeSlotId: number | null = null;
					if (ov.time_slot_label) {
						timeSlotId = slotIdLabelMap.get(ov.time_slot_label) ?? null;
						if (timeSlotId === null) {
							throw new ApiError(
								`Time slot label "${ov.time_slot_label}" not found for option ${option.name}`,
								400,
								[],
							);
						}
					}

					return {
						date: ov.date,
						override_type: ov.override_type,
						new_capacity:
							ov.new_capacity && ov.override_type === "CAPACITY_CHANGE"
								? Number(ov.new_capacity)
								: null,
						time_slot_id: timeSlotId,
						tour_option_id: optionId,
					};
				});

				// Batch insert overrides
				if (overridesData.length > 0) {
					const { error: overridesError } = await this.supabase
						.from(this.AVAILABILITY_OVERRIDES_TABLE)
						.insert(overridesData);

					if (overridesError) {
						throw new ApiError(overridesError.message, 500, [overridesError.details || []]);
					}
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

			for (const ruleIds of ruleIdsMap.values()) {
				if (ruleIds.length > 0) {
					await this.supabase.from(this.AVAILABILITY_RULES_TABLE).delete().in("id", ruleIds);
				}
			}

			console.error(error);
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
						${this.AVAILABILITY_RULES_TABLE} (
							*,
							${this.TIMESLOTS_TABLE} (*)
						),
						${this.AVAILABILITY_OVERRIDES_TABLE} (*)
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
						${this.AVAILABILITY_RULES_TABLE} (
							*,
							${this.TIMESLOTS_TABLE} (
								*
							)
						),
						${this.AVAILABILITY_OVERRIDES_TABLE} (
							*
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
						${this.CATEGORIES_TABLE}(id, name, ${this.META_DETAILS_TABLE}(url_key))
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

			const tours: HighLevelTour[] = data.map((tour: (typeof data)[0]) => ({
				id: tour.id,
				name: tour.name,
				cover_image: tour.cover_image,
				updated_at: tour.updated_at ?? "",
				url_key: tour.meta_details.url_key,
				isFeatured: tour.isFeatured,
				isActive: tour.isActive,
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
	async updateTour(data: UpdateTourPayload, tour_id: string) {
		const {
			tour_update,
			added_tags,
			removed_tags,
			tour_options_updates,
			cover_image,
			images = [],
			removed_images = [],
			meta_details,
		} = data;

		// Fetch current tour data (needed for image handling & meta_details_id)
		const { data: currentTour, error: fetchError } = await this.supabase
			.from(this.TOURS_TABLE)
			.select("id, meta_details_id, images, cover_image")
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
				await this.updateTourOptions(tour_id, tour_options_updates);
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
	async updateTourOptions(tour_id: string, payload: UpdateTourActionPayload["tour_options_updates"]) {
		const new_options = payload?.new_options ?? [];
		const deleted_options = payload?.deleted_options ?? [];
		const updated_options = payload?.updated_options ?? [];

		const new_prices = payload?.new_prices ?? [];
		const deleted_prices = payload?.deleted_prices ?? [];
		const updated_prices = payload?.updated_prices ?? [];

		const new_rules = payload?.new_rules ?? [];
		const deleted_rules = payload?.deleted_rules ?? [];

		const new_time_slots = payload?.new_time_slots ?? [];
		const deleted_time_slots = payload?.deleted_time_slots ?? [];

		const new_overrides = payload?.new_overrides ?? [];
		const deleted_overrides = payload?.deleted_overrides ?? [];

		// Temp ID mappings (for new entities)
		const tempOptionIdMap = new Map<string, number>();
		const tempRuleIdMap = new Map<string, number>();

		// Track IDs inserted in this transaction for rollback
		const insertedOptionIds: number[] = [];
		const insertedRuleIds: number[] = [];
		const insertedTimeSlotIds: number[] = [];
		const insertedOverrideIds: number[] = [];

		try {
			// DELETIONS (in dependent order: overrides → time slots → rules → prices → options)
			if (deleted_overrides.length > 0) {
				const { error } = await this.supabase
					.from(this.AVAILABILITY_OVERRIDES_TABLE)
					.delete()
					.in("id", deleted_overrides);

				if (error) throw new ApiError(error.message, 500, [error.details || []]);
			}

			if (deleted_time_slots.length > 0) {
				const { error } = await this.supabase
					.from(this.TIMESLOTS_TABLE)
					.delete()
					.in("id", deleted_time_slots);

				if (error) throw new ApiError(error.message, 500, [error.details || []]);
			}

			if (deleted_rules.length > 0) {
				const { error } = await this.supabase
					.from(this.AVAILABILITY_RULES_TABLE)
					.delete()
					.in("id", deleted_rules);

				if (error) throw new ApiError(error.message, 500, [error.details || []]);
			}

			if (deleted_prices.length > 0) {
				const { error } = await this.supabase
					.from(this.TOUR_OPTION_PRICES_TABLE)
					.delete()
					.in("id", deleted_prices);

				if (error) throw new ApiError(error.message, 500, [error.details || []]);
			}

			if (deleted_options.length > 0) {
				const { error } = await this.supabase
					.from(this.TOUR_OPTIONS_TABLE)
					.delete()
					.in("id", deleted_options);

				if (error) throw new ApiError(error.message, 500, [error.details || []]);
			}

			// UPDATES (options → prices → rules)
			for (const optUpdate of updated_options) {
				const { error } = await this.supabase
					.from(this.TOUR_OPTIONS_TABLE)
					.update(optUpdate)
					.eq("id", optUpdate.id);

				if (error) throw new ApiError(error.message, 500, [error.details || []]);
			}

			for (const priceUpdate of updated_prices) {
				const { error } = await this.supabase
					.from(this.TOUR_OPTION_PRICES_TABLE)
					.update(priceUpdate)
					.eq("id", priceUpdate.id);

				if (error) throw new ApiError(error.message, 500, [error.details || []]);
			}

			// ────────────────────────────────────────────────
			// INSERTIONS (options → prices → rules → time slots → overrides)
			// New options
			if (new_options.length > 0) {
				const { data: insertedOptions, error } = await this.supabase
					.from(this.TOUR_OPTIONS_TABLE)
					.insert(new_options.map((opt) => ({ ...opt, tour_id })))
					.select("id");

				if (error) throw new ApiError(error.message, 500, [error.details || []]);

				insertedOptions.forEach((opt) => insertedOptionIds.push(opt.id));

				new_options.forEach((opt, idx) => {
					tempOptionIdMap.set(`new-opt-${idx + 1}`, insertedOptions[idx].id);
				});
			}

			// New prices (resolve tour_option_id if temp)
			if (new_prices.length > 0) {
				const resolvedPrices = new_prices.map((price) => {
					const optionId =
						typeof price.tour_option_id === "string"
							? tempOptionIdMap.get(price.tour_option_id) || price.tour_option_id
							: price.tour_option_id;
					return { ...price, tour_option_id: optionId };
				});

				const { error } = await this.supabase
					.from(this.TOUR_OPTION_PRICES_TABLE)
					.insert(resolvedPrices);

				if (error) throw new ApiError(error.message, 500, [error.details || []]);
			}

			// New rules
			if (new_rules.length > 0) {
				const rulesWithTempId = new_rules.map((rule, idx) => {
					const tempId = `new-rule-${idx + 1}`;
					return { ...rule, temp_id: tempId }; // add temp_id for mapping
				});

				const resolvedRules = rulesWithTempId.map((rule) => {
					const optionId =
						typeof rule.tour_option_id === "string"
							? tempOptionIdMap.get(rule.tour_option_id) || null
							: rule.tour_option_id;

					if (!optionId) throw new Error(`Invalid temp tour_option_id for rule`);

					const { temp_id, ...insertData } = rule; // remove temp_id before insert
					return { ...insertData, tour_option_id: optionId };
				});

				const { data: insertedRules, error } = await this.supabase
					.from(this.AVAILABILITY_RULES_TABLE)
					.insert(resolvedRules)
					.select("id");

				if (error) throw new ApiError(error.message, 500, [error.details || []]);

				insertedRules.forEach((rule, idx) => {
					const tempId = rulesWithTempId[idx].temp_id;
					tempRuleIdMap.set(tempId, rule.id);
					insertedRuleIds.push(rule.id);
				});
			}

			// New time slots
			if (new_time_slots.length > 0) {
				const resolvedTimeSlots = new_time_slots.map((slot) => {
					const ruleId =
						typeof slot.availability_rule_id === "string"
							? tempRuleIdMap.get(slot.availability_rule_id) || null
							: slot.availability_rule_id;

					if (!ruleId)
						throw new Error(`No mapping found for temp rule ID: ${slot.availability_rule_id}`);

					return { ...slot, availability_rule_id: ruleId };
				});

				const { data: insertedTimeSlots, error } = await this.supabase
					.from(this.TIMESLOTS_TABLE)
					.insert(resolvedTimeSlots)
					.select("id");

				if (error) throw new ApiError(error.message, 500, [error.details || []]);

				insertedTimeSlots.forEach((slot) => insertedTimeSlotIds.push(slot.id));
			}

			// New overrides — similar to prices
			if (new_overrides.length > 0) {
				const resolvedOverrides = new_overrides.map((ov) => {
					console.log(ov);
					console.log(tempOptionIdMap.entries());

					let optionId =
						typeof ov.tour_option_id === "string"
							? tempOptionIdMap.get(ov.tour_option_id) || null
							: ov.tour_option_id;

					if (!optionId)
						throw new Error(`No mapping found for temp option ID: ${ov.tour_option_id}`);

					return { ...ov, tour_option_id: optionId };
				});

				const { data: insertedOverrides, error } = await this.supabase
					.from(this.AVAILABILITY_OVERRIDES_TABLE)
					.insert(resolvedOverrides)
					.select("id");

				if (error) throw new ApiError(error.message, 500, [error.details || []]);

				insertedOverrides.forEach((ov) => insertedOverrideIds.push(ov.id));
			}
		} catch (error) {
			try {
				// 1. Delete new overrides
				if (insertedOverrideIds.length > 0) {
					const { error } = await this.supabase
						.from(this.AVAILABILITY_OVERRIDES_TABLE)
						.delete()
						.in("id", insertedOverrideIds);

					if (error) console.error("Rollback failed (overrides):", error);
				}

				// 2. Delete new time slots
				if (insertedTimeSlotIds.length > 0) {
					const { error } = await this.supabase
						.from(this.TIMESLOTS_TABLE)
						.delete()
						.in("id", insertedTimeSlotIds);

					if (error) console.error("Rollback failed (time slots):", error);
				}

				// 3. Delete new rules
				if (insertedRuleIds.length > 0) {
					const { error } = await this.supabase
						.from(this.AVAILABILITY_RULES_TABLE)
						.delete()
						.in("id", insertedRuleIds);

					if (error) console.error("Rollback failed (rules):", error);
				}

				// 4. Delete new options (last, since others depend on them)
				if (insertedOptionIds.length > 0) {
					const { error } = await this.supabase
						.from(this.TOUR_OPTIONS_TABLE)
						.delete()
						.in("id", insertedOptionIds);

					if (error) console.error("Rollback failed (options):", error);
				}
			} catch (rollbackError) {
				console.error("Rollback failed completely:", rollbackError);
			}

			throw error;
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
						${this.TOUR_OPTIONS_TABLE}(
							*,
							prices: ${this.TOUR_OPTION_PRICES_TABLE} (
								price, ${this.PARTICIPANT_TYPES_TABLE}(age_min, age_max)
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

			query = query.order("created_at", { ascending: false });

			const { data, error, count } = await query;

			if (error) {
				throw new ApiError(error.message, 500, [error.details || ""]);
			}

			const getTourMinPrice = (tour: (typeof data)[0]): number => {
				let min = Infinity;
				for (const option of tour.tour_options || []) {
					for (const price of option.prices || []) {
						if (price.price < min) min = price.price;
					}
				}
				return min === Infinity ? 0 : min;
			};

			let tours: FP_HighLevelTour[] = data.map((tour: (typeof data)[0]) => {
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
						${this.AVAILABILITY_RULES_TABLE} (
							*,
							${this.TIMESLOTS_TABLE} (
								*
							)
						),
						${this.AVAILABILITY_OVERRIDES_TABLE} (
							*
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

	private getDayOfWeek(dateStr: string): number {
		const date = new Date(dateStr);
		const day = date.getDay();
		return day === 0 ? 7 : day;
	}

	/** Get tours list */
	async getToursList(q = "", pageIndex = 0, pageSize = 10): Promise<ToursListResp> {
		const from = pageIndex * pageSize;
		const to = from + pageSize - 1;

		let query = this.supabase
			.from(this.TOURS_TABLE)
			.select("id, name", { count: "exact" })
			.eq("isActive", true)
			.range(from, to)
			.order("created_at", { ascending: true });

		if (q.trim().length > 0) {
			query = query.ilike("name", `%${q}%`);
		}

		const { data, error: dbError, count } = await query;

		if (dbError) {
			return {
				error: new ApiError(dbError.message, 500, [dbError.details || ""]),
				total: count ?? 0,
				tours: [],
			};
		}

		return {
			error: null,
			total: count ?? 0,
			tours: data ?? [],
		};
	}

	/** Get tours + tour options list */
	async getTourOptionsList(q = "", pageIndex = 0, pageSize = 10): Promise<TourOptionsListResp> {
		const from = pageIndex * pageSize;
		const to = from + pageSize - 1;

		let query = this.supabase
			.from(this.TOURS_TABLE)
			.select(`id, name, ${this.TOUR_OPTIONS_TABLE}!inner(id, name)`, { count: "exact" })
			.eq("isActive", true)
			.range(from, to)
			.order("created_at", { ascending: true });

		if (q.trim().length > 0) {
			query = query.ilike("name", `%${q}%`);
		}

		const { data, error: dbError, count } = await query;

		if (dbError) {
			return {
				error: new ApiError(dbError.message, 500, [dbError.details || ""]),
				total: count ?? 0,
				tours: [],
			};
		}

		return {
			error: null,
			total: count ?? 0,
			tours: data ?? [],
		};
	}

	/**
	 * Returns time slots with real available_seats for a specific date
	 */
	async getTourTimeSlotAvailability(
		tourOptionId: number,
		date: string,
	): Promise<
		{
			id: number;
			available_seats: number;
		}[]
	> {
		const weekday = await this.getDayOfWeek(date);

		const { data: rules, error: ruleErr } = await this.supabase
			.from(this.AVAILABILITY_RULES_TABLE)
			.select(
				`
				id,
				${this.TIMESLOTS_TABLE} (
					id,
					label,
					capacity
				)
			`,
			)
			.eq("tour_option_id", tourOptionId)
			.lte("start_date", date)
			.gte("end_date", date)
			.contains("weekdays", [weekday]);

		if (ruleErr || !rules?.length) {
			throw new ApiError("No availability rules found for this date", 404);
		}

		// Flatten all time slots from matching rules
		const allTimeSlots = rules.flatMap((rule) =>
			(rule.time_slots || []).map((slot) => ({
				...slot,
				rule_id: rule.id,
			})),
		);

		if (!allTimeSlots.length) {
			return [];
		}

		const timeSlotLabels = allTimeSlots.map((s) => s.label);

		const { data: bookedData, error: bookedErr } = await this.supabase
			.from(this.BOOKING_ITEMS_TABLE)
			.select(
				`
				preffered_timeslot,
				${this.BOOKING_PARTICIPANTS_TABLE} (quantity),
				booking:bookings_new!inner(booking_status)
			`,
			)
			.eq("tour_option_id", tourOptionId)
			.eq("preffered_date", date)
			.in("preffered_timeslot", timeSlotLabels)
			.in("booking.booking_status", ["PENDING", "CONFIRMED"]);

		if (bookedErr) {
			throw new ApiError("Failed to fetch booked capacity", 500);
		}

		// Aggregate booked quantity per timeslot label
		const bookedByLabel = new Map<string, number>();

		bookedData?.forEach((item) => {
			const label = item.preffered_timeslot;
			const qty = (item.booking_participants_new || []).reduce(
				(sum: number, p) => sum + (p.quantity || 0),
				0,
			);

			bookedByLabel.set(label, (bookedByLabel.get(label) || 0) + qty);
		});

		const { data: overrides, error: overrideErr } = await this.supabase
			.from(this.AVAILABILITY_OVERRIDES_TABLE)
			.select("*")
			.eq("tour_option_id", tourOptionId)
			.eq("date", date);

		if (overrideErr) {
			throw new ApiError("Failed to fetch availability overrides", 500);
		}

		const overridesBySlotId = new Map<number | null, (typeof overrides)[0]>();

		overrides?.forEach((ov) => {
			const key = ov.time_slot_id ?? null;
			overridesBySlotId.set(key, ov);
		});

		const result = allTimeSlots.map((slot) => {
			const label = slot.label;
			const baseCapacity = slot.capacity ?? Infinity;

			let effectiveCapacity = baseCapacity;
			let isClosed = false;

			// Slot-specific override
			const slotOverride = overridesBySlotId.get(slot.id);
			if (slotOverride) {
				if (slotOverride.override_type === "CLOSE") {
					isClosed = true;
				} else if (slotOverride.override_type === "CAPACITY_CHANGE") {
					effectiveCapacity = slotOverride.new_capacity ?? baseCapacity;
				}
			}

			// Whole-day override (time_slot_id = null)
			const wholeDayOverride = overridesBySlotId.get(null);
			if (wholeDayOverride) {
				if (wholeDayOverride.override_type === "CLOSE") {
					isClosed = true;
				} else if (wholeDayOverride.override_type === "CAPACITY_CHANGE") {
					effectiveCapacity = wholeDayOverride.new_capacity ?? effectiveCapacity;
				}
			}

			const booked = bookedByLabel.get(label) || 0;
			let available = isClosed ? 0 : effectiveCapacity - booked;
			available = Math.max(0, available);

			return {
				id: slot.id,
				available_seats: available,
			};
		});

		return result;
	}
}
