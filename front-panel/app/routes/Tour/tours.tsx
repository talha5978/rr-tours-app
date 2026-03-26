import { toursQuery } from "~/queries/tours.q";
import { FPhighLevelCitiesQuery } from "~/queries/cities.q";
import { FPhighLevelCategoriesQuery } from "~/queries/categories.q";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { LoaderFunctionArgs, useLoaderData, useNavigate, useSearchParams } from "react-router";
import { allProvidersQuery } from "~/queries/providers.q";
import { allTagsQuery } from "~/queries/tags.q";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
	FPTourFilterFormSchema,
	FPTourFilters,
	type FPTourFilterFormData,
} from "@workspace/shared/schemas/fp-tours-filter.schema";
import {
	Form as ShadcnForm,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Slider } from "~/components/ui/slider";
import { TourCard } from "~/components/Tour/TourCard";
import { useEffect } from "react";
import { Separator } from "~/components/ui/separator";
import { ListFilter, Search } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from "~/components/ui/sheet";
import { TourSort } from "~/components/Tour/TourSort";
import {
	fpDefaultTourSortByFilter,
	fpDefaultTourSortTypeFilter,
} from "@workspace/shared/constants/constants";

const PAGE_SIZE = 12;
const MAX_PRICE = 10000;

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const url = new URL(request.url);
	const q = url.searchParams.get("q") ?? "";
	const page = Number(url.searchParams.get("page") ?? "1");
	const categories = url.searchParams.getAll("categories");
	const cities = url.searchParams.getAll("cities");
	const providers = url.searchParams.getAll("providers");
	const tags = url.searchParams.getAll("tags");

	const sortBy = (url.searchParams.get("sortBy") as FPTourFilters["sortBy"]) || fpDefaultTourSortByFilter;
	const sortType =
		(url.searchParams.get("sortType") as FPTourFilters["sortType"]) || fpDefaultTourSortTypeFilter;

	const price = url.searchParams.getAll("price").map(Number).filter(Boolean); // [min, max]

	const maxPriceParam = url.searchParams.get("max_price");
	const minPriceParam = url.searchParams.get("min_price");

	const filters = {
		categories,
		cities,
		providers,
		tags,
		price,
		sortBy: sortBy != "recommended" ? sortBy : undefined,
		sortType: sortBy != "recommended" ? sortType : undefined,
	};

	if (maxPriceParam || minPriceParam) {
		const maxPrice = maxPriceParam ? Number(maxPriceParam) : MAX_PRICE;
		const minPrice = minPriceParam ? Number(minPriceParam) : 0;
		filters.price = [minPrice, maxPrice];
	}

	const toursResp = await toursQuery({ request, filters, pageIndex: page - 1, pageSize: PAGE_SIZE, q });

	const citiesResp = await FPhighLevelCitiesQuery({ request });
	const categoriesResp = await FPhighLevelCategoriesQuery({ request });
	const providersResp = await allProvidersQuery({ request });
	const tagsResp = await allTagsQuery({ request });

	return { toursResp, citiesResp, categoriesResp, providersResp, tagsResp };
};

export default function ToursPage() {
	const { toursResp } = useLoaderData<typeof loader>();

	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const currentPage = Number(searchParams.get("page") ?? "1");
	const totalPages = Math.ceil((toursResp.total || 0) / PAGE_SIZE);

	return (
		<>
			<MetaDetails
				metaTitle="Explore Tours | WanderNest"
				metaDescription="Explore top destinations, book amazing tours, and enjoy unforgettable travel experiences. Easy booking, trusted operators, and great prices."
				metaKeywords={toursResp.tours.map((i) => i.name).join(", ")}
				canonicalUrl={`${process.env.VITE_MAIN_APP_URL}/tours`}
				ogUrl={`${process.env.VITE_MAIN_APP_URL}/tours`}
				ogImage={toursResp.tours[0]?.cover_image ?? undefined}
			/>
			<div className="lg:px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
				{/* Filters Sidebar */}
				<div className="max-lg:hidden lg:col-span-1">
					<Card>
						<CardHeader>
							<CardTitle>
								<h2>Filter Tours</h2>
							</CardTitle>
						</CardHeader>
						<Separator />
						<CardContent>
							<FiltersForm />
						</CardContent>
					</Card>
				</div>

				{/* Tours Section */}
				<div className="lg:col-span-3 space-y-8">
					<div className="flex gap-4 justify-between items-end flex-wrap">
						<div>
							<h1 className="text-2xl sm:text-3xl font-bold">Explore Tours & Attractions</h1>
						</div>
						<div className="flex justify-end gap-2">
							<div className="w-fit lg:hidden flex">
								<Sheet>
									<SheetTrigger>
										<Button variant="default">
											<ListFilter />
											<span className="hidden md:inline">Filters</span>
										</Button>
									</SheetTrigger>
									<SheetContent side="right" className="sm:w-88 w-[18rem] overflow-y-auto">
										<SheetHeader className="mt-5">
											<h2 className="leading-none font-semibold">Filter Tours</h2>
										</SheetHeader>

										<div className="p-4">
											<FiltersForm />
										</div>
									</SheetContent>
								</Sheet>
							</div>
							<div>
								<TourSort url={`/tours`} />
							</div>
						</div>
					</div>

					{toursResp.tours.length === 0 && (
						<div className="py-28">
							<p className="text-muted-foreground text-center">No Tours Found</p>
						</div>
					)}

					<ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{toursResp.tours.map((tour) => (
							<li key={tour.id}>
								<TourCard tour={tour} />
							</li>
						))}
					</ul>

					{/* Pagination */}
					<div className="flex items-center justify-center gap-2">
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
			</div>
		</>
	);
}

const FiltersForm = () => {
	const { citiesResp, categoriesResp, providersResp, tagsResp } = useLoaderData<typeof loader>();

	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const maxPriceParam = searchParams.get("max_price");
	const minPriceParam = searchParams.get("min_price");

	const form = useForm<FPTourFilterFormData>({
		resolver: zodResolver(FPTourFilterFormSchema),
		defaultValues: {
			q: searchParams.get("q") ?? "",
			page: searchParams.get("page") ?? "1",
			size: PAGE_SIZE.toString(),
			categories: searchParams.getAll("categories"),
			cities: searchParams.getAll("cities"),
			providers: searchParams.getAll("providers"),
			tags: searchParams.getAll("tags"),
			price:
				maxPriceParam && minPriceParam
					? [minPriceParam, maxPriceParam].map((val) => Number(val))
					: [0, MAX_PRICE],
		},
	});

	const { handleSubmit } = form;

	const onSubmit = (data: FPTourFilterFormData) => {
		const params = new URLSearchParams();
		if (data.q) params.set("q", data.q);
		params.set("page", data.page || "1");
		data.categories?.forEach((cat) => params.append("categories", cat));
		data.cities?.forEach((city) => params.append("cities", city));
		data.providers?.forEach((prov) => params.append("providers", prov));
		data.tags?.forEach((tag) => params.append("tags", tag));
		if (data.price && data.price.length === 2) {
			params.set("min_price", String(data.price[0]));
			params.set("max_price", String(data.price[1]));
		}
		navigate(`?${params.toString()}`);
	};

	// Reset form when search params change
	useEffect(() => {
		form.reset({
			q: searchParams.get("q") ?? "",
			page: searchParams.get("page") ?? "1",
			size: PAGE_SIZE.toString(),
			categories: searchParams.getAll("categories"),
			cities: searchParams.getAll("cities"),
			providers: searchParams.getAll("providers"),
			tags: searchParams.getAll("tags"),
			price:
				maxPriceParam && minPriceParam
					? [Number(minPriceParam), Number(maxPriceParam)]
					: [0, MAX_PRICE],
		});
	}, [searchParams, form]);

	return (
		<ShadcnForm {...form}>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
				{/* Search */}
				<FormField
					control={form.control}
					name="q"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Search</FormLabel>
							<FormControl>
								<div className="relative">
									<Search
										className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
										width={18}
									/>
									<Input
										placeholder="Search tours and attractions"
										className="w-full pl-8"
										maxLength={200}
										{...field}
									/>
								</div>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Categories (Checkbox Group) */}
				<FormField
					control={form.control}
					name="categories"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Categories</FormLabel>
							{categoriesResp.data.map((cat) => (
								<div key={cat.id} className="flex items-center space-x-2">
									<Checkbox
										id={`cat-${cat.id}`}
										checked={field.value?.includes(cat.id.toString())}
										onCheckedChange={(checked) => {
											const newValue = checked
												? [...(field.value || []), cat.id.toString()]
												: field.value?.filter((v) => v !== cat.id.toString());
											field.onChange(newValue);
										}}
									/>
									<label htmlFor={`cat-${cat.id}`}>{cat.name}</label>
								</div>
							))}
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Cities */}
				<FormField
					control={form.control}
					name="cities"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Cities</FormLabel>
							{citiesResp.data.map((city) => (
								<div key={city.id} className="flex items-center space-x-2">
									<Checkbox
										id={`city-${city.id}`}
										checked={field.value?.includes(city.id.toString())}
										onCheckedChange={(checked) => {
											const newValue = checked
												? [...(field.value || []), city.id.toString()]
												: field.value?.filter((v) => v !== city.id.toString());
											field.onChange(newValue);
										}}
									/>
									<label htmlFor={`city-${city.id}`}>{city.name}</label>
								</div>
							))}
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Providers */}
				<FormField
					control={form.control}
					name="providers"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Providers</FormLabel>
							{providersResp.map((prov) => (
								<div key={prov.id} className="flex items-center space-x-2">
									<Checkbox
										id={`prov-${prov.id}`}
										checked={field.value?.includes(prov.id.toString())}
										onCheckedChange={(checked) => {
											const newValue = checked
												? [...(field.value || []), prov.id.toString()]
												: field.value?.filter((v) => v !== prov.id.toString());
											field.onChange(newValue);
										}}
									/>
									<label htmlFor={`prov-${prov.id}`}>{prov.name}</label>
								</div>
							))}
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Tags */}
				<FormField
					control={form.control}
					name="tags"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Tags</FormLabel>
							{tagsResp.map((tag) => (
								<div key={tag.id} className="flex items-center space-x-2">
									<Checkbox
										id={`tag-${tag.id}`}
										checked={field.value?.includes(tag.id.toString())}
										onCheckedChange={(checked) => {
											const newValue = checked
												? [...(field.value || []), tag.id.toString()]
												: field.value?.filter((v) => v !== tag.id.toString());
											field.onChange(newValue);
										}}
									/>
									<label htmlFor={`tag-${tag.id}`}>{tag.name}</label>
								</div>
							))}
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Price Range */}
				<FormField
					control={form.control}
					name="price"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Price Range</FormLabel>
							<FormControl>
								<Slider
									value={field.value ?? [0, MAX_PRICE]}
									onValueChange={field.onChange}
									max={MAX_PRICE}
									min={0}
									step={10}
								/>
							</FormControl>
							<div className="flex justify-between text-sm text-muted-foreground">
								<span>{field.value?.[0] ?? 0} AED</span>
								<span>{field.value?.[1] ?? MAX_PRICE} AED</span>
							</div>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button type="submit" className="w-full">
					Apply Filters
				</Button>
			</form>
		</ShadcnForm>
	);
};
