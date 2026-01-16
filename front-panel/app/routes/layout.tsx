import { queryClient } from "@workspace/shared/utils/query-client";
import { LoaderFunctionArgs, Outlet, useLoaderData } from "react-router";
import Footer from "~/components/Footer/Footer";
import Header from "~/components/Header/Header";
import { FPhighLevelCategoriesQuery } from "~/queries/categories.q";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const categoriesResp = await queryClient.fetchQuery(FPhighLevelCategoriesQuery({ request }));
	return categoriesResp;
};

export default function AppLayout() {
	const categoriesResp = useLoaderData<typeof loader>();

	return (
		<div className="max-container space-y-8">
			<Header categories={categoriesResp.data ?? []} />
			<main>
				<Outlet />
			</main>
			<Footer categories={categoriesResp.data ?? []} />
		</div>
	);
}
