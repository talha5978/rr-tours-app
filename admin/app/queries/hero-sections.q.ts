import { queryOptions } from "@tanstack/react-query";
import { HeroSectionsService } from "@workspace/shared/services/hero-sections.service";
import type { GetHeroSection } from "@workspace/shared/types/hero-sections";

export const heroSectionQuery = ({ request, id }: { request: Request; id: number }) => {
	return queryOptions<GetHeroSection>({
		queryKey: ["hero_section", id],
		queryFn: async () => {
			const svc = new HeroSectionsService(request);
			const result = await svc.getHeroSectionById(id);
			return result;
		},
	});
};
