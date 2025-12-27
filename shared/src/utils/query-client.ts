import { QueryClient } from "@tanstack/react-query";

function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 25 * 60 * 1000,
				gcTime: 30 * 60 * 1000,
				refetchOnWindowFocus: "always",
				refetchOnMount: false,
				retry: false,
			},
		},
	});
}

export const queryClient = createQueryClient();
