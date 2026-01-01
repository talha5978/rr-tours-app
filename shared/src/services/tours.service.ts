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
import type { GetTourDetails } from "@workspace/shared/types/tours";

@UseClassMiddleware(loggerMiddleware, asServiceMiddleware<ToursService>(verifyUser))
export class ToursService extends Service {
	/** Add tour details */
	async addTour(input: AddTourActionDate): Promise<string | null> {
		if (this.currentUser == null || this.currentUser.id == null) {
			throw new ApiError("Unauthorized", 401, []);
		}

		const mediaSvc = await this.createSubService(MediaService);

		let uploadedCoverPath = "";
		const uploadedImagePaths: string[] = [];
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

			// Upload secondary images
			if (input.images) {
				for (const img of input.images.filter(Boolean) as File[]) {
					const { data } = await mediaSvc.uploadImage(img);
					const path = data?.path;
					if (path) {
						uploadedImagePaths.push(path);
					} else {
						throw new ApiError("Failed to upload secondary image", 500, []);
					}
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
				cancellation_policy: input.cancellation_policy ? Number(input.cancellation_policy) : null,
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

			// Insert tour options
			for (const option of input.tour_options) {
				const optionData: TablesInsert<"tour_options"> = {
					name: option.name,
					inclusions: option.inclusions || null,
					exclusions: option.exclusions || null,
					note: option.note || null,
					sort_order: Number(option.sort_order || "1"),
					tour_id: tourId,
				};

				const { data: optionInsert, error: optionError } = await this.supabase
					.from(this.TOUR_OPTIONS_TABLE)
					.insert(optionData)
					.select("id")
					.single();

				if (optionError) {
					throw new ApiError(optionError.message, 500, [optionError.details || []]);
				}

				const optionId = optionInsert.id;
				optionIds.push(optionId);

				// Insert prices
				const pricesData = option.prices.map((p) => ({
					price: Number(p.price),
					participant_type_id: Number(p.participant),
					tour_option_id: optionId,
				}));

				const { error: pricesError } = await this.supabase
					.from(this.TOUR_OPTION_PRICES_TABLE)
					.insert(pricesData);

				if (pricesError) {
					throw new ApiError(pricesError.message, 500, [pricesError.details || []]);
				}

				// Insert availabilities if provided
				if (option.availabilities && option.availabilities.length > 0) {
					for (const avail of option.availabilities) {
						const availData: TablesInsert<"tour_availabilities"> = {
							date: avail.date, // FORMAT -> 2026-01-01
							isActive: avail.isActive === "true",
							tour_option_id: optionId,
						};

						const { data: availInsert, error: availError } = await this.supabase
							.from(this.TOUR_AVAILABILITIES_TABLE)
							.insert(availData)
							.select("id")
							.single();

						if (availError) {
							throw new ApiError(availError.message, 500, [availError.details || []]);
						}

						const availId = availInsert.id;
						availabilityIds.push(availId);

						// Insert timeslots and slots
						for (const ts of avail.timeslots) {
							const timeData: TablesInsert<"tour_time_slots"> = {
								time: ts.time,
								label: ts.label || null,
								sort_order: Number(ts.sort_order || "1"),
							};

							const { data: timeInsert, error: timeInsertError } = await this.supabase
								.from(this.TOUR_TIME_SLOTS_TABLE)
								.insert(timeData)
								.select("id")
								.single();

							if (timeInsertError) {
								throw new ApiError(timeInsertError.message, 500, [
									timeInsertError.details || [],
								]);
							}

							const timeSlotId = timeInsert.id;
							timeSlotIds.push(timeSlotId);

							// Insert availability slot (junction)
							const slotData: TablesInsert<"tour_availability_slots"> = {
								availability_id: availId,
								time_slot_id: timeSlotId,
								seat_type: option.seat_type,
								available_seats:
									ts.available_seats && option.seat_type === "LIMITED"
										? Number(ts.available_seats)
										: null,
							};

							const { error: slotError } = await this.supabase
								.from(this.TOUR_AVAILABILITY_SLOTS_TABLE)
								.insert(slotData);

							if (slotError) {
								throw new ApiError(slotError.message, 500, [slotError.details || []]);
							}
						}
					}
				}
			}

			return tourId ?? null;
		} catch (error) {
			// Cleanup on error
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

	async getTourDetails(tourId: string): Promise<GetTourDetails | null> {
		if (!tourId) {
			throw new ApiError("Tour ID is required", 400, []);
		}

		const { data: tour, error } = await this.supabase
			.from(this.TOURS_TABLE)
			.select(
				`
				*,
				meta_details (*),
				city: cities (
					id, name,
					meta_details (url_key)
				),
				tour_category: tours_categories (
					id, name,
					meta_details (url_key)
				),
				provider: activity_providers (*),
				cancellation_policy_detail: cancellation_policies (*),
				tags: tours_tags (
					tour_tags (*)
				),
				tour_options (
					*,
					prices: tour_option_prices (
					*,
					participant_type: participant_types (*)
					),
					availabilities: tour_availabilities (
					*,
					slots: tour_availability_slots (
						*,
						time_slot: tour_time_slots (*)
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
}
