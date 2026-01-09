import { Service } from "@workspace/shared/services/service.base";
import { UseClassMiddleware } from "@workspace/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@workspace/shared/middlewares/logger.middleware";
import { verifyUser } from "@workspace/shared/middlewares/auth.middleware";
import { asServiceMiddleware } from "@workspace/shared/middlewares/utils";
import { ApiError } from "@workspace/shared/utils/ApiError";
import type { GetAllTourTags, GetTag, TagUpdationPayload } from "@workspace/shared/types/tour-tags";
import type { AddTagInput, UpdateTagActionData } from "@workspace/shared/schemas/tag.schema";
import { MediaService } from "@workspace/shared/services/media.service";
import { UseMiddleware } from "@workspace/shared/decorators/useMiddleware";

@UseClassMiddleware(loggerMiddleware)
export class TourTagsService extends Service {
	/** Get All Participant Types */
	@UseMiddleware(asServiceMiddleware<TourTagsService>(verifyUser))
	async getAllTags(): Promise<GetAllTourTags> {
		const { data, error } = await this.supabase
			.from(this.TOUR_TAGS_TABLE)
			.select("id, name, image")
			.limit(100);

		if (error) {
			throw new ApiError(error.message, 500, []);
		}

		return data ?? [];
	}

	/** Get single tag details */
	@UseMiddleware(asServiceMiddleware<TourTagsService>(verifyUser))
	async getTagById(tagId: number): Promise<GetTag> {
		const { data, error } = await this.supabase
			.from(this.TOUR_TAGS_TABLE)
			.select("id, name, image")
			.eq("id", tagId)
			.single();

		if (error) {
			throw new ApiError(error.message, 500, []);
		}

		return data ?? [];
	}

	/** Add tag */
	@UseMiddleware(asServiceMiddleware<TourTagsService>(verifyUser))
	async addTag(input: AddTagInput): Promise<void> {
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

			const { error } = await this.supabase.from(this.TOUR_TAGS_TABLE).insert({
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
			throw error instanceof ApiError ? error : new ApiError("Failed to add tag", 500, []);
		}
	}

	/** Update tag */
	@UseMiddleware(asServiceMiddleware<TourTagsService>(verifyUser))
	async updateTag(tagId: number, input: Partial<UpdateTagActionData>): Promise<{ error: ApiError | null }> {
		const { image, removed_image, name } = input;

		if (typeof image === "string") {
			throw new ApiError("Inavalid image input provided.", 400, []);
		}

		let newImagePath: string | null = null;
		const mediaSvc = await this.createSubService(MediaService);

		try {
			const { data: tagData, error: fetchError } = await this.supabase
				.from(this.TOUR_TAGS_TABLE)
				.select("image")
				.eq("id", Number(tagId))
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

			const tagUpdate: Partial<TagUpdationPayload> = {};
			if (name) tagUpdate.name = name;
			if (newImagePath && newImagePath !== tagData.image) tagUpdate.image = newImagePath;

			let error: ApiError | null = null;

			// Update tag if any fields provided
			if (Object.keys(tagUpdate).length > 0) {
				const { error: tagErr } = await this.supabase
					.from(this.TOUR_TAGS_TABLE)
					.update(tagUpdate)
					.eq("id", Number(tagId));

				if (tagErr) {
					if (newImagePath) {
						await mediaSvc.deleteImage(newImagePath);
					}

					error = new ApiError(`Failed to update tag: ${tagErr.message}`, 500, []);

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
				error: error instanceof ApiError ? error : new ApiError("Failed to update tag", 500, []),
			};
		}
	}

	/** Get All tags for front panel */
	async getAllTagsForFrontPanel(): Promise<GetAllTourTags> {
		const { data, error } = await this.supabase
			.from(this.TOUR_TAGS_TABLE)
			.select("id, name, image")
			.limit(100);

		if (error) {
			throw new ApiError(error.message, 500, []);
		}

		return data ?? [];
	}

	/** Get All tags related to a city for city page in front panel */
	async getAllTagsForCity(cityId: number): Promise<GetAllTourTags> {
		const { data, error } = await this.supabase
			.from(this.TOURS_TABLE)
			.select(
				`
				join: ${this.TOURS_TAGS_LINK_TABLE} (
					${this.TOUR_TAGS_TABLE} (id, name, image)
				)	
			`,
			)
			.limit(100)
			.eq("city_id", cityId);

		if (error) {
			throw new ApiError(error.message, 500, []);
		}
		const tags =
			data?.flatMap((tour) =>
				tour.join.map((link) => ({
					id: link.tour_tags.id,
					name: link.tour_tags.name,
					image: link.tour_tags.image,
				})),
			) ?? [];

		return Array.from(new Map(tags.map((tag) => [tag.id, tag])).values()).sort((a, b) => a.id - b.id);
	}
}
