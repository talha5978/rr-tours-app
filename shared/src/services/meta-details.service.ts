import { ApiError } from "@workspace/shared/utils/ApiError";
import type { MetaUpdationPayload } from "@workspace/shared/types/meta_details.d";
import type { MetaDetailsActionData } from "@workspace/shared/schemas/meta-details.schema";
import { Service } from "@workspace/shared/services/service.base";
import { UseClassMiddleware } from "@workspace/shared/decorators/useClassMiddleware";
import { loggerMiddleware } from "@workspace/shared/middlewares/logger.middleware";
import { verifyUser } from "@workspace/shared/middlewares/auth.middleware";
import { asServiceMiddleware } from "@workspace/shared/middlewares/utils";

@UseClassMiddleware(loggerMiddleware, asServiceMiddleware<MetaDetailsService>(verifyUser))
export class MetaDetailsService extends Service {
	/** Create meta details row */
	async createMetaDetails(input: MetaDetailsActionData): Promise<string> {
		const { meta_description, meta_title, url_key, meta_keywords } = input;

		const { data: metaData, error: metaError } = await this.supabase
			.from(this.META_DETAILS_TABLE)
			.insert({
				meta_title,
				meta_description,
				url_key,
				meta_keywords: meta_keywords || null, // convert empty string to null
			})
			.select("id")
			.single();

		if (metaError || !metaData) {
			throw new ApiError(
				`Failed to create meta details: ${metaError?.message || "Unknown error"}`,
				500,
				[metaError?.details],
			);
		}

		return metaData.id;
	}

	/** Update meta details row */
	async updateMetaDetails({
		meta_details,
		metaDetailsId,
	}: {
		meta_details: MetaUpdationPayload;
		metaDetailsId: string;
	}): Promise<void> {
		const metaUpdate: Partial<MetaUpdationPayload> = {};
		if (meta_details.meta_title) metaUpdate.meta_title = meta_details.meta_title;
		if (meta_details.meta_description) metaUpdate.meta_description = meta_details.meta_description;
		if (meta_details.url_key) metaUpdate.url_key = meta_details.url_key;
		if (meta_details.meta_keywords || meta_details.meta_keywords === "")
			metaUpdate.meta_keywords = meta_details.meta_keywords;

		if (Object.keys(metaUpdate).length > 0) {
			const { error: metaError } = await this.supabase
				.from(this.META_DETAILS_TABLE)
				.update(metaUpdate)
				.eq("id", metaDetailsId);

			if (metaError) {
				throw new ApiError(`Failed to update meta details: ${metaError.message}`, 500, []);
			}
		}
	}

	/** Delete meta details row */
	async deleteMetaDetails(metaDetailsId: string): Promise<void> {
		const { error: metaError } = await this.supabase
			.from(this.META_DETAILS_TABLE)
			.delete()
			.eq("id", metaDetailsId);

		if (metaError) {
			throw new ApiError(`Failed to delete meta details: ${metaError.message}`, 500, []);
		}
	}
}
