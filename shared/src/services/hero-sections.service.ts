import { Service } from "@workspace/shared/services/service.base";
import { UseClassMiddleware } from "@workspace/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@workspace/shared/middlewares/logger.middleware";
import { verifyUser } from "@workspace/shared/middlewares/auth.middleware";
import { asServiceMiddleware } from "@workspace/shared/middlewares/utils";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { MediaService } from "@workspace/shared/services/media.service";
import { UseMiddleware } from "@workspace/shared/decorators/useMiddleware";
import type {
	GetAllHeroSections,
	GetHeroSection,
	HeroSectionUpdationPayload,
} from "@workspace/shared/types/hero-sections";
import type {
	AddHeroSectionInput,
	UpdateHeroSecActionData,
} from "@workspace/shared/schemas/hero-section.schema";

@UseClassMiddleware(loggerMiddleware)
export class HeroSectionsService extends Service {
	/** Get All Hero sections */
	async getAllHeroSections(): Promise<GetAllHeroSections> {
		const { data, error } = await this.supabase
			.from(this.HERO_SECTIONS_TABLE)
			.select("id, name, image")
			.limit(100);

		if (error) {
			throw new ApiError(error.message, 500, []);
		}

		return data ?? [];
	}

	/** Get single hero section */
	@UseMiddleware(asServiceMiddleware<HeroSectionsService>(verifyUser))
	async getHeroSectionById(id: number): Promise<GetHeroSection> {
		const { data, error } = await this.supabase
			.from(this.HERO_SECTIONS_TABLE)
			.select("id, name, image")
			.eq("id", id)
			.single();

		if (error) {
			throw new ApiError(error.message, 500, []);
		}

		return data ?? [];
	}

	/** Add hero section */
	@UseMiddleware(asServiceMiddleware<HeroSectionsService>(verifyUser))
	async addHeroSection(input: AddHeroSectionInput): Promise<void> {
		const { image, name } = input;
		const mediaSvc = await this.createSubService(MediaService);
		let uploaded_img_url = "";

		try {
			if (image && image.size > 0) {
				const { data } = await mediaSvc.uploadImage(image);

				uploaded_img_url = data?.path ?? "";

				if (!uploaded_img_url || uploaded_img_url == "") {
					throw new ApiError("Failed to upload image", 500, []);
				}
			}

			const { error } = await this.supabase.from(this.HERO_SECTIONS_TABLE).insert({
				name,
				image: uploaded_img_url,
			});

			if (error) {
				throw new ApiError(`${error.message}`, 500, [error.details || []]);
			}
		} catch (error) {
			if (uploaded_img_url) {
				await mediaSvc.deleteImage(uploaded_img_url);
			}
			throw error instanceof ApiError ? error : new ApiError("Failed to add hero section", 500, []);
		}
	}

	/** Update hero section */
	@UseMiddleware(asServiceMiddleware<HeroSectionsService>(verifyUser))
	async updateHeroSection(
		id: number,
		input: Partial<UpdateHeroSecActionData>,
	): Promise<{ error: ApiError | null }> {
		const { image, removed_image, name } = input;

		if (typeof image === "string") {
			throw new ApiError("Inavalid image input provided.", 400, []);
		}

		let newImagePath: string | null = null;
		const mediaSvc = await this.createSubService(MediaService);

		try {
			const { data: tagData, error: fetchError } = await this.supabase
				.from(this.HERO_SECTIONS_TABLE)
				.select("image")
				.eq("id", Number(id))
				.single();

			if (fetchError) {
				throw new ApiError(fetchError.message, Number(fetchError.code) ?? 500, [fetchError.details]);
			}

			if (image && image.size > 0) {
				if (!removed_image) {
					throw new ApiError("Inavalid image input provided.", 400, []);
				}

				const { data } = await mediaSvc.uploadImage(image);

				if (!data?.path || data?.path == "") {
					throw new ApiError("Failed to upload image", 500, []);
				}

				newImagePath = data.path;
			}

			const tagUpdate: Partial<HeroSectionUpdationPayload> = {};
			if (name) tagUpdate.name = name;
			if (newImagePath && newImagePath !== tagData.image) tagUpdate.image = newImagePath;

			let error: ApiError | null = null;

			// Update hero section if any fields provided
			if (Object.keys(tagUpdate).length > 0) {
				const { error: tagErr } = await this.supabase
					.from(this.HERO_SECTIONS_TABLE)
					.update(tagUpdate)
					.eq("id", Number(id));

				if (tagErr) {
					if (newImagePath) {
						await mediaSvc.deleteImage(newImagePath);
					}

					error = new ApiError(`Failed to update hero section: ${tagErr.message}`, 500, []);

					return { error };
				}
			}

			// Delete old image if a new one was uploaded
			if (newImagePath && tagData.image && tagData.image !== newImagePath) {
				await mediaSvc.deleteImage(tagData.image);
			}

			return { error };
		} catch (error) {
			return {
				error:
					error instanceof ApiError
						? error
						: new ApiError("Failed to update hero-section", 500, []),
			};
		}
	}

	/** Delete hero section */
	@UseMiddleware(asServiceMiddleware<HeroSectionsService>(verifyUser))
	async deleteHeroSection(id: number): Promise<void> {
		const mediaSvc = await this.createSubService(MediaService);

		try {
			const { data: heroSectionData, error: fetchError } = await this.supabase
				.from(this.HERO_SECTIONS_TABLE)
				.select("image")
				.eq("id", Number(id))
				.single();

			if (fetchError) {
				throw new ApiError(fetchError.message, Number(fetchError.code) ?? 500, [fetchError.details]);
			}

			const { error } = await this.supabase
				.from(this.HERO_SECTIONS_TABLE)
				.delete()
				.eq("id", Number(id));

			if (error) {
				throw new ApiError(`Failed to delete hero section: ${error.message}`, 500, []);
			}

			// Delete associated image
			if (heroSectionData.image) {
				await mediaSvc.deleteImage(heroSectionData.image);
			}
		} catch (error) {
			throw error instanceof ApiError ? error : new ApiError("Failed to delete hero section", 500, []);
		}
	}
}
