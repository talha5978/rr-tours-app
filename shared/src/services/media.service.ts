import { ApiError } from "@workspace/shared/utils/ApiError";
import type { UploadMediaResponse } from "@workspace/shared/types/media";
import { Service } from "@workspace/shared/services/service.base";
import { compressImage } from "@workspace/shared/utils/ImageCompression";
import { generateFilePath } from "@workspace/shared/utils/generateSlug";
import { UseClassMiddleware } from "@workspace/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@workspace/shared/middlewares/logger.middleware";
import { verifyUser } from "@workspace/shared/middlewares/auth.middleware";
import { asServiceMiddleware } from "@workspace/shared/middlewares/utils";

@UseClassMiddleware(loggerMiddleware, asServiceMiddleware<MediaService>(verifyUser))
export class MediaService extends Service {
	/** Uploads image to supabase storage */
	async uploadImage(file: File): Promise<UploadMediaResponse> {
		const compressedBuffer = await compressImage(file);
		const filePath = generateFilePath(file);
		const { data, error: uploadError } = await this.supabase.storage
			.from(this.IMAGES_BUCKET)
			.upload(filePath, compressedBuffer, {
				contentType: "image/webp",
				upsert: true,
			});

		if (uploadError) {
			throw new ApiError(`Failed to upload image: ${uploadError.message}`, 500, []);
		}

		return {
			data,
		};
	}

	/** Deletes image from supabase storage */
	async deleteImage(imagePath: string): Promise<void> {
		const { error: deleteError } = await this.supabase.storage
			.from(this.IMAGES_BUCKET)
			.remove([imagePath]);

		if (deleteError) {
			throw new ApiError(`Failed to delete image: ${deleteError.message}`, 500, []);
		}
	}
}
