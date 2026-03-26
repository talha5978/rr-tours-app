import type { ActionFunctionArgs } from "react-router";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { HeroSectionsService } from "@workspace/shared/services/hero-sections.service";
import { cacheService } from "@workspace/shared/services/cache.service";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";

export const action = async ({ request, params }: ActionFunctionArgs) => {
	const id = (params.id as string) || "";
	if (!id || id == "") {
		return {
			success: false,
			error: "Hero section ID is required",
		};
	}

	try {
		const svc = new HeroSectionsService(request);
		await svc.deleteHeroSection(Number(id));

		await cacheService.invalidate(CACHE_KEYS.heroSections.list("AD"));
		await cacheService.invalidate(CACHE_KEYS.heroSections.list("FP"));
		await cacheService.invalidate(CACHE_KEYS.heroSections.details(id));

		return { success: true };
	} catch (error: any) {
		return {
			success: false,
			error:
				error instanceof ApiError ? error.message : error.message || "Failed to delete hero section",
		};
	}
};
