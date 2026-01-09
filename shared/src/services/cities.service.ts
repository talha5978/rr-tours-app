import { ApiError } from "@workspace/shared/utils/ApiError";
import { MediaService } from "@workspace/shared/services/media.service";
import { Service } from "@workspace/shared/services/service.base";
import { UseClassMiddleware } from "@workspace/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@workspace/shared/middlewares/logger.middleware";
import { verifyUser } from "@workspace/shared/middlewares/auth.middleware";
import { asServiceMiddleware } from "@workspace/shared/middlewares/utils";
import { MetaDetailsService } from "@workspace/shared/services/meta-details.service";
import type { AddCityActionData, UpdateCityActionData } from "@workspace/shared/schemas/city.schema";
import type {
	CityUpdationPayload,
	GetCityDetailsForUpdateResponse,
	GetCityList,
	GetFPCityDetailResponse,
	GetFPHighLevelCitiesResponse,
	GetHighLevelCitiesResponse,
} from "@workspace/shared/types/cities";
import { UseMiddleware } from "@workspace/shared/decorators/useMiddleware";

@UseClassMiddleware(loggerMiddleware)
export class CityService extends Service {
	/** Add city */
	@UseMiddleware(asServiceMiddleware<CityService>(verifyUser))
	async addCity(input: AddCityActionData): Promise<void> {
		const { card_image, full_image, meta_details, name } = input;
		const mediaSvc = await this.createSubService(MediaService);
		let uploaded_card_img_url = "";
		let uploaded_full_img_url = "";

		try {
			if (card_image && card_image.size > 0) {
				const { data } = await mediaSvc.uploadImage(card_image);

				uploaded_card_img_url = data?.path ?? "";

				if (!uploaded_card_img_url || uploaded_card_img_url == "") {
					throw new ApiError("Failed to upload card image", 500, []);
				}
			}

			if (full_image && full_image.size > 0) {
				const { data } = await mediaSvc.uploadImage(full_image);

				uploaded_full_img_url = data?.path ?? "";

				if (!uploaded_full_img_url || uploaded_full_img_url == "") {
					throw new ApiError("Failed to upload full image", 500, []);
				}
			}

			const metaDetailsService = await this.createSubService(MetaDetailsService);
			const metaDetailsId = await metaDetailsService.createMetaDetails(meta_details);

			if (!metaDetailsId) {
				throw new ApiError("Failed to create meta details", 500, []);
			}

			const { error } = await this.supabase.from(this.CITIES_TABLE).insert({
				name,
				card_image: uploaded_card_img_url,
				full_image: uploaded_full_img_url,
				meta_details_id: metaDetailsId,
			});

			if (error) {
				throw new ApiError(`${error.message}`, 500, [error.details || []]);
			}
		} catch (error) {
			if (uploaded_card_img_url !== "") {
				await mediaSvc.deleteImage(uploaded_card_img_url);
			}
			if (uploaded_full_img_url !== "") {
				await mediaSvc.deleteImage(uploaded_full_img_url);
			}
			throw error instanceof ApiError ? error : new ApiError("Failed to add city", 500, []);
		}
	}

	/** Get all high level cities */
	@UseMiddleware(asServiceMiddleware<CityService>(verifyUser))
	async getHighLevelCities(): Promise<GetHighLevelCitiesResponse> {
		let query = this.supabase
			.from(this.CITIES_TABLE)
			.select(
				`
				id, name, card_image, created_at,
				${this.META_DETAILS_TABLE}(url_key),
				${this.TOURS_TABLE}(id)
			`,
				{ count: "exact" },
			)
			.order("created_at", { ascending: true });

		const { data, error: dbError, count } = await query;

		let error: ApiError | null = null;

		if (dbError) {
			error = new ApiError(dbError.message, 500, [dbError.details || ""]);
		}

		return {
			data:
				data?.map((i) => ({
					id: i.id,
					name: i.name,
					card_image: i.card_image,
					url_key: i.meta_details.url_key,
					tours: i.tours.length ?? 0,
					created_at: i.created_at,
				})) || [],
			total: count ?? 0,
			error,
		};
	}

	/** Get front panel cities */
	async getFPHighLevelCities(): Promise<GetFPHighLevelCitiesResponse> {
		let query = this.supabase
			.from(this.CITIES_TABLE)
			.select(
				`
				id, name, card_image,
				${this.META_DETAILS_TABLE}(url_key)
			`,
			)
			.range(0, 20)
			.order("created_at", { ascending: false });

		const { data, error: dbError } = await query;

		let error: ApiError | null = null;

		if (dbError) {
			error = new ApiError(dbError.message, 500, [dbError.details || ""]);
		}

		return {
			data:
				data?.map((i) => ({
					id: i.id,
					name: i.name,
					card_image: i.card_image,
					url_key: i.meta_details.url_key,
				})) || [],
			error,
		};
	}

	/** Get city details for front panel page */
	async getCityDetailsFrontPanel(cityId: number): Promise<GetFPCityDetailResponse> {
		const { data, error: dbError } = await this.supabase
			.from(this.CITIES_TABLE)
			.select(
				`
					id, name, card_image, full_image,
					${this.META_DETAILS_TABLE}(*)
				`,
			)
			.eq("id", cityId)
			.single();

		let error: ApiError | null = null;

		if (dbError) {
			error = new ApiError(dbError.message, 500, [dbError.details || ""]);
		}

		return {
			data: data,
			error,
		};
	}

	/** Get full city list */
	@UseMiddleware(asServiceMiddleware<CityService>(verifyUser))
	async getCitiesList(): Promise<GetCityList> {
		const { data, error: dbError } = await this.supabase
			.from(this.CITIES_TABLE)
			.select("id, name")
			.order("created_at", { ascending: true });

		if (dbError) {
			throw new ApiError(dbError.message, 500, [dbError.details || ""]);
		}

		return data ?? [];
	}

	/** Get full details of a city to update */
	@UseMiddleware(asServiceMiddleware<CityService>(verifyUser))
	async getCityDetailsForUpdate(cityId: number): Promise<GetCityDetailsForUpdateResponse> {
		const { data, error: dbError } = await this.supabase
			.from(this.CITIES_TABLE)
			.select(
				`
					id, name, card_image, full_image,
					${this.META_DETAILS_TABLE}(*)
				`,
			)
			.eq("id", cityId)
			.single();

		let error: ApiError | null = null;

		if (dbError) {
			error = new ApiError(dbError.message, 500, [dbError.details || ""]);
		}

		return {
			data: data,
			error,
		};
	}

	/** Update city */
	@UseMiddleware(asServiceMiddleware<CityService>(verifyUser))
	async updateCity(
		categoryId: number | string,
		input: Partial<UpdateCityActionData>,
	): Promise<{ error: ApiError | null }> {
		const { card_image, removed_card_image, full_image, removed_full_image, meta_details, name } = input;

		if (typeof card_image === "string" || typeof full_image === "string") {
			throw new ApiError("Invalid image input provided.", 400, []);
		}

		const mediaSvc = await this.createSubService(MediaService);

		let newCardImagePath: string | null = null;
		let newFullImagePath: string | null = null;

		try {
			const { data: cityData, error: fetchError } = await this.supabase
				.from(this.CITIES_TABLE)
				.select("card_image, full_image, meta_details_id")
				.eq("id", Number(categoryId))
				.single();

			if (fetchError) {
				throw new ApiError(fetchError.message, Number(fetchError.code) ?? 500, [fetchError.details]);
			}

			const metaDetailsId = cityData.meta_details_id;

			if (card_image && card_image.size > 0) {
				if (!removed_card_image) {
					throw new ApiError("Invalid card image input provided.", 400, []);
				}

				const { data } = await mediaSvc.uploadImage(card_image);

				if (!data?.path) {
					throw new ApiError("Failed to upload card image", 500, []);
				}

				newCardImagePath = data.path;
			}

			if (full_image && full_image.size > 0) {
				if (!removed_full_image) {
					throw new ApiError("Invalid full image input provided.", 400, []);
				}

				const { data } = await mediaSvc.uploadImage(full_image);

				if (!data?.path) {
					throw new ApiError("Failed to upload full image", 500, []);
				}

				newFullImagePath = data.path;
			}

			const cityUpdate: Partial<CityUpdationPayload> = {};

			if (name) cityUpdate.name = name;
			if (newCardImagePath && newCardImagePath !== cityData.card_image) {
				cityUpdate.card_image = newCardImagePath;
			}
			if (newFullImagePath && newFullImagePath !== cityData.full_image) {
				cityUpdate.full_image = newFullImagePath;
			}

			if (Object.keys(cityUpdate).length > 0) {
				const { error: updateError } = await this.supabase
					.from(this.CITIES_TABLE)
					.update(cityUpdate)
					.eq("id", Number(categoryId));

				if (updateError) {
					if (newCardImagePath) await mediaSvc.deleteImage(newCardImagePath);
					if (newFullImagePath) await mediaSvc.deleteImage(newFullImagePath);

					return {
						error: new ApiError(`Failed to update city: ${updateError.message}`, 500, []),
					};
				}
			}

			/* ---------------- META DETAILS ---------------- */
			if (meta_details) {
				const metaDetailsService = await this.createSubService(MetaDetailsService);
				await metaDetailsService.updateMetaDetails({
					meta_details,
					metaDetailsId,
				});
			}

			/* ---------------- CLEANUP OLD IMAGES ---------------- */
			if (newCardImagePath && cityData.card_image && cityData.card_image !== newCardImagePath) {
				await mediaSvc.deleteImage(cityData.card_image);
			}

			if (newFullImagePath && cityData.full_image && cityData.full_image !== newFullImagePath) {
				await mediaSvc.deleteImage(cityData.full_image);
			}

			return { error: null };
		} catch (error) {
			return {
				error: error instanceof ApiError ? error : new ApiError("Failed to update city", 500, []),
			};
		}
	}
}
