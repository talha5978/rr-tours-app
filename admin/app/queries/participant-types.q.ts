import { cacheService } from "@workspace/shared/services/cache.service";
import { ParticipantTypesService } from "@workspace/shared/services/participant-types.service";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";

export const participantTypesQuery = async ({ request }: { request: Request }) => {
	const queryFn = async () => {
		const svc = new ParticipantTypesService(request);
		const resp = await svc.getParticipantTypes();
		return resp;
	};

	const result = await cacheService.get(CACHE_KEYS.participantTypes.list(), queryFn);
	return result;
};
