import { queryClient } from "@workspace/shared/utils/query-client";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { LoaderFunctionArgs, useLoaderData, useNavigate, useSearchParams } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
	Form as ShadcnForm,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { TourCard } from "~/components/Tour/TourCard";
import { useEffect } from "react";
import { TourSort } from "~/components/Tour/TourSort";

import { collectionDetailsQuery, collectionToursQuery } from "~/queries/collections.q";

const PAGE_SIZE = 12;
const MAX_PRICE = 10000;

const CollectionFilterSchema = z.object({
	q: z.string().optional(),
	price: z.tuple([z.number(), z.number()]).optional(),
});

type CollectionFilterFormData = z.infer<typeof CollectionFilterSchema>;

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const id = params.id;
	if (!id || isNaN(Number(id))) {
		throw new Response("Invalid collection ID", { status: 400 });
	}
	const collectionId = Number(id);

	const url = new URL(request.url);
	const q = url.searchParams.get("q") ?? "";
	const page = Number(url.searchParams.get("page") ?? "1");
	const sortBy = (url.searchParams.get("sortBy") as any) || undefined;
	const sortType = (url.searchParams.get("sortType") as any) || undefined;
	const minPrice = Number(url.searchParams.get("min_price") ?? "0");
	const maxPrice = Number(url.searchParams.get("max_price") ?? MAX_PRICE.toString());

	const filters = {
		price: minPrice !== 0 || maxPrice !== MAX_PRICE ? [minPrice, maxPrice] : undefined,
		sortBy,
		sortType,
	};

	const collectionResp = await queryClient.fetchQuery(
		collectionDetailsQuery({ request, id: collectionId }),
	);
	const toursResp = await queryClient.fetchQuery(
		collectionToursQuery({ request, collectionId, pageIndex: page - 1, pageSize: PAGE_SIZE, q, filters }),
	);

	return { collectionResp, toursResp };
};

export default function CollectionPage() {
	const { collectionResp: collection, toursResp } = useLoaderData<typeof loader>();

	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const currentPage = Number(searchParams.get("page") ?? "1");
	const totalPages = Math.ceil((toursResp.total || 0) / PAGE_SIZE);

	const maxPriceParam = searchParams.get("max_price");
	const minPriceParam = searchParams.get("min_price");

	const form = useForm<CollectionFilterFormData>({
		resolver: zodResolver(CollectionFilterSchema),
		defaultValues: {
			q: searchParams.get("q") ?? "",
			price:
				minPriceParam && maxPriceParam
					? [Number(minPriceParam), Number(maxPriceParam)]
					: undefined,
		},
	});

	const { handleSubmit } = form;

	const onSubmit = (data: CollectionFilterFormData) => {
		const params = new URLSearchParams(searchParams);
		if (data.q) params.set("q", data.q);
		else params.delete("q");
		params.set("page", "1");
		if (data.price && data.price.length === 2) {
			params.set("min_price", String(data.price[0]));
			params.set("max_price", String(data.price[1]));
		} else {
			params.delete("min_price");
			params.delete("max_price");
		}
		navigate(`?${params.toString()}`);
	};

	useEffect(() => {
		form.reset({
			q: searchParams.get("q") ?? "",
			price:
				minPriceParam && maxPriceParam
					? [Number(minPriceParam), Number(maxPriceParam)]
					: undefined,
		});
	}, [searchParams, form]);

	return (
		<>
			<MetaDetails
				metaTitle={`${collection?.name} | Tours & Attractions`}
				metaDescription={collection?.description || "Explore curated tours and attractions in this collection."}
				metaKeywords={toursResp.tours.map((i) => i.name).join(", ")}
				canonicalUrl={`${process.env.VITE_MAIN_APP_URL}/collection/${collection?.id}`}
				ogUrl={`${process.env.VITE_MAIN_APP_URL}/collection/${collection?.id}`}
				ogImage={toursResp.tours[0]?.cover_image ?? undefined}
			/>
			<div className="container mx-auto lg:px-4 py-8">
				<div className="space-y-4">
					<h1 className="text-2xl sm:text-3xl font-bold">{collection?.name}</h1>
					{collection?.description && (
						<p className="text-muted-foreground">{collection?.description}</p>
					)}
					<div className="flex flex-wrap gap-4 items-end">
						<ShadcnForm {...form}>
							<form onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap gap-4">
								<FormField
									control={form.control}
									name="q"
									render={({ field }) => (
										<FormItem>
											<FormControl>
												<Input placeholder="Search tours" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="price"
									render={({ field }) => (
										<FormItem className="flex gap-2">
											<FormControl>
												<Input
													type="number"
													placeholder="Min Price"
													value={field.value?.[0] ?? ""}
													onChange={(e) =>
														field.onChange([
															Number(e.target.value) || 0,
															field.value?.[1] ?? MAX_PRICE,
														])
													}
												/>
											</FormControl>
											<FormControl>
												<Input
													type="number"
													placeholder="Max Price"
													value={field.value?.[1] ?? ""}
													onChange={(e) =>
														field.onChange([
															field.value?.[0] ?? 0,
															Number(e.target.value) || MAX_PRICE,
														])
													}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<Button type="submit">Apply</Button>
							</form>
						</ShadcnForm>
						<TourSort url={`/collection/${collection?.id}`} />
					</div>
				</div>

				{toursResp.tours.length === 0 && (
					<div className="py-28">
						<p className="text-muted-foreground text-center">No Tours Found</p>
					</div>
				)}

				<ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
					{toursResp.tours.map((tour) => (
						<li key={tour.id}>
							<TourCard tour={tour} />
						</li>
					))}
				</ul>

				<div className="flex items-center justify-center gap-2 mt-8">
					<Button
						variant="outline"
						disabled={currentPage === 1 || totalPages === 0}
						onClick={() => {
							searchParams.set("page", (currentPage - 1).toString());
							navigate(`?${searchParams.toString()}`);
						}}
					>
						Previous
					</Button>
					<Button
						variant="outline"
						disabled={currentPage === totalPages || totalPages === 0}
						onClick={() => {
							searchParams.set("page", (currentPage + 1).toString());
							navigate(`?${searchParams.toString()}`);
						}}
					>
						Next
					</Button>
				</div>
			</div>
		</>
	);
}