import { queryOptions } from "@tanstack/react-query";
import { ParticipantTypesService } from "@workspace/shared/services/participant-types.service";
import type { GetAllParticipantTypes } from "@workspace/shared/types/participant-types";

export const participantTypesQuery = ({ request }: { request: Request }) => {
	return queryOptions<GetAllParticipantTypes>({
		queryKey: ["participantTypes"],
		queryFn: async () => {
			const svc = new ParticipantTypesService(request);
			const result = await svc.getParticipantTypes();
			return result;
		},
	});
};
