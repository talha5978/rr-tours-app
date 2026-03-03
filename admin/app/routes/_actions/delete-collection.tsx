import type { ActionFunctionArgs } from "react-router";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { queryClient } from "@workspace/shared/utils/query-client";
import { CollectionsService } from "@workspace/shared/services/collections.service";

export const action = async ({ request, params }: ActionFunctionArgs) => {
	const id = (params.id as string) || "";
	if (!id || id == "") {
		return {
			success: false,
			error: "Collection id is required",
		};
	}

	try {
		const svc = new CollectionsService(request);
		const { error } = await svc.deleteCollection(Number(id));

		await queryClient.invalidateQueries({ queryKey: ["highLvlCollections"] });

		return { success: true, error };
	} catch (error: any) {
		return {
			success: false,
			error: error instanceof ApiError ? error.message : error.message || "Failed to delete collection",
		};
	}
};
