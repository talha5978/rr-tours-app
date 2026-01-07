import type { ActionFunctionArgs } from "react-router";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { HeroSectionsService } from "@workspace/shared/services/hero-sections.service";
import { queryClient } from "@workspace/shared/utils/query-client";

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

		await queryClient.invalidateQueries({ queryKey: ["hero_sections"] });
		await queryClient.invalidateQueries({ queryKey: ["hero_section", Number(id)] });

		return { success: true };
	} catch (error: any) {
		return {
			success: false,
			error:
				error instanceof ApiError ? error.message : error.message || "Failed to delete hero section",
		};
	}
};
