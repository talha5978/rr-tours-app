import { ApiError } from "@workspace/shared/utils/ApiError";
import { MediaService } from "@workspace/shared/services/media.service";
import { Service } from "@workspace/shared/services/service.base";
import { UseClassMiddleware } from "@workspace/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@workspace/shared/middlewares/logger.middleware";
import { verifyUser } from "@workspace/shared/middlewares/auth.middleware";
import { asServiceMiddleware } from "@workspace/shared/middlewares/utils";
import type {
	AddCategoryActionData,
	UpdateCategoryActionData,
} from "@workspace/shared/schemas/category.schema";
import { MetaDetailsService } from "@workspace/shared/services/meta-details.service";
import type {
	CategoryUpdationPayload,
	GetCategoryDetailsForUpdateResponse,
	GetCategoryList,
	GetFPHighLevelCategories,
	GetHighLevelCategoriesResponse,
} from "@workspace/shared/types/categories";
import { UseMiddleware } from "@workspace/shared/decorators/useMiddleware";

@UseClassMiddleware(loggerMiddleware)
export class CategoryService extends Service {
	/** Add category */
	@UseMiddleware(asServiceMiddleware<CategoryService>(verifyUser))
	async addCategory(input: AddCategoryActionData): Promise<void> {
		const { image, meta_details, name, sort_order } = input;
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

			const metaDetailsService = await this.createSubService(MetaDetailsService);
			const metaDetailsId = await metaDetailsService.createMetaDetails(meta_details);

			if (!metaDetailsId) {
				throw new ApiError("Failed to create meta details", 500, []);
			}

			const { error } = await this.supabase.from(this.CATEGORIES_TABLE).insert({
				name,
				image: uploaded_img_url,
				sort_order: Number(sort_order || "1"),
				meta_details_id: metaDetailsId,
			});

			if (error) {
				throw new ApiError(`${error.message}`, 500, [error.details || []]);
			}
		} catch (error) {
			if (uploaded_img_url) {
				await mediaSvc.deleteImage(uploaded_img_url);
			}
			throw error instanceof ApiError ? error : new ApiError("Failed to add category", 500, []);
		}
	}

	/** Get all high level categories */
	@UseMiddleware(asServiceMiddleware<CategoryService>(verifyUser))
	async getHighLevelCategories(
		q = "",
		pageIndex = 0,
		pageSize = 10,
	): Promise<GetHighLevelCategoriesResponse> {
		const from = pageIndex * pageSize;
		const to = from + pageSize - 1;

		let query = this.supabase
			.from(this.CATEGORIES_TABLE)
			.select(
				`
				id, name, image, created_at,
				${this.META_DETAILS_TABLE}(url_key),
				${this.TOURS_TABLE}(id)
			`,
				{ count: "exact" },
			)
			.range(from, to)
			.order("sort_order", { ascending: true });

		if (q.length > 0) {
			query = query.ilike("name", `%${q}%`);
		}

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
					image: i.image,
					created_at: i.created_at,
					url_key: i.meta_details.url_key,
					tours: i.tours.length ?? 0,
				})) || [],
			total: count ?? 0,
			error,
		};
	}

	/** Get all high level categories for front panel */
	async getFPHighLevelCategories(): Promise<GetFPHighLevelCategories> {
		const { data, error: dbError } = await this.supabase
			.from(this.CATEGORIES_TABLE)
			.select(
				`
				id, name, image,
				${this.META_DETAILS_TABLE}(url_key)
			`,
			)
			.range(0, 20)
			.order("sort_order", { ascending: true });

		let error: ApiError | null = null;

		if (dbError) {
			error = new ApiError(dbError.message, 500, [dbError.details || ""]);
		}

		return {
			data:
				data?.map((i) => ({
					id: i.id,
					name: i.name,
					image: i.image,
					url_key: i.meta_details.url_key,
				})) || [],
			error,
		};
	}

	/** Get full categories list */
	@UseMiddleware(asServiceMiddleware<CategoryService>(verifyUser))
	async getCategoryList(): Promise<GetCategoryList> {
		const { data, error: dbError } = await this.supabase
			.from(this.CATEGORIES_TABLE)
			.select("id, name")
			.limit(100)
			.order("sort_order", { ascending: true });

		if (dbError) {
			throw new ApiError(dbError.message, 500, [dbError.details || ""]);
		}

		return data ?? [];
	}

	/** Get full details of a category to update */
	@UseMiddleware(asServiceMiddleware<CategoryService>(verifyUser))
	async getCategoryDetails(categoryId: number): Promise<GetCategoryDetailsForUpdateResponse> {
		const { data, error: dbError } = await this.supabase
			.from(this.CATEGORIES_TABLE)
			.select(
				`
					id, name, image, sort_order,
					${this.META_DETAILS_TABLE}(*)
				`,
			)
			.eq("id", categoryId)
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

	/** Update category */
	@UseMiddleware(asServiceMiddleware<CategoryService>(verifyUser))
	async updateCategory(
		categoryId: number | string,
		input: Partial<UpdateCategoryActionData>,
	): Promise<{ error: ApiError | null }> {
		const { image, removed_image, meta_details, name, sort_order } = input;

		if (typeof image === "string") {
			throw new ApiError("Inavalid image input provided.", 400, []);
		}

		let newImagePath: string | null = null;
		const mediaSvc = await this.createSubService(MediaService);

		try {
			const { data: categoryData, error: fetchError } = await this.supabase
				.from(this.CATEGORIES_TABLE)
				.select("image, meta_details_id")
				.eq("id", Number(categoryId))
				.single();

			if (fetchError) {
				throw new ApiError(fetchError.message, Number(fetchError.code) ?? 500, [fetchError.details]);
			}

			const metaDetailsId = categoryData.meta_details_id;

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

			const categoryUpdate: Partial<CategoryUpdationPayload> = {};
			if (name) categoryUpdate.name = name;
			if (sort_order !== undefined) categoryUpdate.sort_order = Number(sort_order);
			if (newImagePath && newImagePath !== categoryData.image) categoryUpdate.image = newImagePath;

			let error: ApiError | null = null;

			// Update category if any fields provided
			if (Object.keys(categoryUpdate).length > 0) {
				const { error: categoryError } = await this.supabase
					.from(this.CATEGORIES_TABLE)
					.update(categoryUpdate)
					.eq("id", Number(categoryId));

				if (categoryError) {
					if (newImagePath) {
						await mediaSvc.deleteImage(newImagePath);
					}

					error = new ApiError(`Failed to update category: ${categoryError.message}`, 500, []);

					return { error };
				}
			}

			if (meta_details) {
				const metaDetailsService = await this.createSubService(MetaDetailsService);
				await metaDetailsService.updateMetaDetails({ meta_details, metaDetailsId });
			}

			// Delete old image if a new one was uploaded
			if (newImagePath && categoryData.image && categoryData.image !== newImagePath) {
				await mediaSvc.deleteImage(categoryData.image);
			}

			return { error };
		} catch (error) {
			return {
				error: error instanceof ApiError ? error : new ApiError("Failed to update category", 500, []),
			};
		}
	}
}
