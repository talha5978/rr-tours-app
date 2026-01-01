import { queryOptions } from "@tanstack/react-query";
import { CancellationPoliciesService } from "@workspace/shared/services/cancellation-policies.service";
import type { GetAllCancellationPolicies } from "@workspace/shared/types/cancellation-policies";

export const cancellationPoliciesQuery = ({ request }: { request: Request }) => {
	return queryOptions<GetAllCancellationPolicies>({
		queryKey: ["cancellationPolicies"],
		queryFn: async () => {
			const svc = new CancellationPoliciesService(request);
			const result = await svc.getCancellationPolicies();
			return result;
		},
	});
};
