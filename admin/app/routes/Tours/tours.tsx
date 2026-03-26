import {
	type ColumnDef,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	Table,
	useReactTable,
} from "@tanstack/react-table";
import {
	defaultTourSortByFilter,
	defaultTourSortTypeFilter,
	SUPABASE_IMAGE_BUCKET_PATH,
} from "@workspace/shared/constants/constants";
import type { HighLevelTour } from "@workspace/shared/types/tours";
import { formatDistanceToNow } from "date-fns";
import {
	ArrowDownWideNarrow,
	ArrowUpDown,
	ArrowUpNarrowWide,
	Check,
	LayoutGrid,
	ListFilter,
	Loader2,
	MoreHorizontal,
	PlusCircle,
	RotateCcw,
	Search,
	TableOfContents,
	X,
} from "lucide-react";
import { motion } from "framer-motion";
import { memo, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
	Form,
	Link,
	useFetcher,
	type LoaderFunctionArgs,
	useLoaderData,
	useLocation,
	useNavigation,
	useNavigate,
	useSearchParams,
} from "react-router";
import { toast } from "sonner";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { DataTable, DataTableSkeleton, TableColumnsToggle } from "~/components/Table/data-table";
import TableCopyField from "~/components/Table/TableId";
import ToursPageContex, { ToursPageCtx, type ViewMode } from "~/components/Tour/MainToursContext";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "~/components/ui/hover-card";
import { Input } from "~/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import StatusBadge from "~/components/ui/status-badge";
import { highLevelToursQuery } from "~/queries/tours.q";
import { GetPaginationControls } from "~/utils/getPaginationControls";
import { getPaginationQueryPayload } from "~/utils/getPaginationQueryPayload";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, Controller } from "react-hook-form";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Form as ShadcnForm,
} from "~/components/ui/form";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "~/components/ui/sheet";
import { categoryListQuery } from "~/queries/categories.q";
import { citiesListQuery } from "~/queries/cities.q";
import { allProvidersQuery } from "~/queries/providers.q";
import { allTagsQuery } from "~/queries/tags.q";
import DateRangePicker from "~/components/Custom-Inputs/date-range-picker";
import { getActiveToursFiltersCount } from "~/utils/getActiveToursFiltersCount";
import { getToursFiltersPayload } from "~/utils/getToursFiltersPayload";
import { getToursResetFiltersUrl } from "~/utils/getToursResetFiltersUrl";
import { sortTypeEnums } from "@workspace/shared/constants/constants";
import {
	TourFilterFormSchema,
	type TourFilters,
	type TourFilterFormData,
} from "@workspace/shared/schemas/tours-filter.schema";
import { Separator } from "~/components/ui/separator";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const { q, pageIndex, pageSize } = getPaginationQueryPayload({
		request,
	});

	const tourFilters: TourFilters = getToursFiltersPayload({ request });

	const data = await highLevelToursQuery({
		request,
		q,
		pageIndex,
		pageSize,
		filters: tourFilters,
	});

	const categories = await categoryListQuery({ request });
	const cities = await citiesListQuery({ request });
	const providers = await allProvidersQuery({ request });
	const tags = await allTagsQuery({ request });

	return {
		data,
		query: q,
		pageIndex,
		pageSize,
		categories,
		cities,
		providers,
		tags,
	};
};

export default function ToursMainCtx() {
	return (
		<ToursPageContex>
			<ToursMainPage />
		</ToursPageContex>
	);
}

const getRouteFetchingState = () => {
	const navigation = useNavigation();
	const location = useLocation();

	const isFetchingThisRoute =
		navigation.state === "loading" && navigation.location?.pathname === location.pathname;

	return isFetchingThisRoute;
};

const ToursMainPage = memo(() => {
	const { data, query, pageIndex, pageSize } = useLoaderData<typeof loader>();

	if (data.tours == null) {
		return (
			<div>
				<p className="text-muted-foreground">Error fetching tours!</p>
			</div>
		);
	}

	const pageCount = useMemo(() => Math.ceil(data.total / pageSize), [data.total, pageSize]);

	const [columnVisibility, setColumnVisibility] = useState({});

	const fetcher = useFetcher();

	useEffect(() => {
		if (fetcher.data) {
			if (fetcher.data.success) {
				toast.success(`Tour deleted successfully`);
			} else if (fetcher.data.error) {
				toast.error(fetcher.data.error);
			}
		}
	}, [fetcher.data]);

	// const handleDeleteClick = (tourId: string) => {
	// 	const formData = new FormData();
	// 	formData.append("tourId", tourId.toString());
	// 	fetcher.submit(formData, {
	// 		method: "POST",
	// 		action: `/tours/${tourId}/delete`,
	// 	});
	// };
	// console.log(data);

	const columns: ColumnDef<HighLevelTour, unknown>[] = [
		{
			id: "Tour Id",
			cell: (info) => (
				<TableCopyField id={info.row.original.id.toString()} message={"Tour Id copied"} />
			),
			header: () => "Tour Id",
			accessorKey: "Tour Id",
			enableHiding: true,
		},
		{
			id: "Name",
			enableHiding: false,
			accessorKey: "name",
			cell: (info) => (
				<HoverCard>
					<HoverCardTrigger className="hover:underline-offset-4 hover:underline cursor-pointer decoration-primary">
						{info.row.original.name}
					</HoverCardTrigger>
					<HoverCardContent className="space-y-1">
						<img
							src={SUPABASE_IMAGE_BUCKET_PATH + "/" + info.row.original.cover_image}
							alt="Tour Image"
							className="border border-border rounded-md object-cover"
						/>
						<span className="text-xs text-muted-foreground">{info.row.original.name}</span>
					</HoverCardContent>
				</HoverCard>
			),
			header: () => "Name",
		},
		{
			id: "Featured",
			accessorKey: "isFeatured",
			cell: (info) => {
				const featured = info.row.original.isFeatured;
				return (
					<StatusBadge
						variant={featured ? "success" : "default"}
						icon={featured ? "tick" : "cross"}
					>
						{featured ? "Yes" : "No"}
					</StatusBadge>
				);
			},
			header: () => "Featured",
		},
		{
			id: "Status",
			accessorKey: "status",
			cell: (info) => {
				return (
					<StatusBadge variant={info.row.original.isActive ? "success" : "destructive"} icon="dot">
						{info.row.original.isActive ? "Active" : "Inactive"}
					</StatusBadge>
				);
			},
			header: () => "Status",
		},
		{
			id: "Category",
			accessorKey: "category",
			cell: (info) => info.row.original.category.name,
			header: () => "Category",
		},
		{
			id: "City",
			accessorKey: "city",
			cell: (info) => info.row.original.city.name,
			header: () => "City",
		},
		{
			id: "Last Updated",
			accessorKey: "updated_at",
			cell: (info) => {
				if (info.row.original.updated_at) {
					const date = new Date(info.row.original.updated_at);
					return formatDistanceToNow(date, { addSuffix: true });
				}

				return "N/A";
			},
			header: () => "Last Updated",
		},
		{
			id: "actions",
			cell: ({ row }) => {
				const rowData: HighLevelTour = row.original;

				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="secondary" className="h-8 w-8 p-0 cursor-pointer">
								<span className="sr-only">Open menu</span>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{rowData.isActive ? (
								<a
									href={`${process.env.VITE_MAIN_APP_URL}/tours/tour/${rowData.id}/${rowData.url_key}`}
									target="_blank"
								>
									<DropdownMenuItem>See Live</DropdownMenuItem>
								</a>
							) : (
								<Link
									to={`/tours/tour/${rowData.id}/${rowData.url_key}`}
									viewTransition
									prefetch="intent"
								>
									<DropdownMenuItem>See Preview</DropdownMenuItem>
								</Link>
							)}
							<Link to={`tour/${rowData.id}/update`} viewTransition prefetch="intent">
								<DropdownMenuItem>Update</DropdownMenuItem>
							</Link>
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	];

	const tableColumns = useMemo(() => columns, [columnVisibility, data]);

	const table = useReactTable({
		data: (data.tours as HighLevelTour[]) ?? [],
		columns: tableColumns,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
		onColumnVisibilityChange: setColumnVisibility,
		getPaginationRowModel: getPaginationRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		pageCount,
		state: {
			columnVisibility,
			pagination: {
				pageIndex,
				pageSize,
			},
		},
	});

	return (
		<>
			<MetaDetails metaTitle="Tours | Admin Panel" metaDescription="Manage your tours here." />
			<section className="flex flex-1 flex-col gap-6">
				<div>
					<div className="flex justify-between gap-3 flex-wrap">
						<h1 className="text-2xl font-semibold">Tours</h1>
						<Link to="/tours/add" viewTransition className="ml-auto" prefetch="intent">
							<Button size="sm" className="ml-auto">
								<PlusCircle width={18} />
								<span>Add Tour</span>
							</Button>
						</Link>
					</div>
					{query && (
						<div className="mt-3">
							<p>Showing records for "{query?.trim()}"</p>
						</div>
					)}
				</div>
				<div className="rounded-md flex flex-col gap-2">
					<PageOptions />
					<ToursArea table={table} />
				</div>
			</section>
		</>
	);
});

const ToursTable = ({ table }: { table: Table<HighLevelTour> }) => {
	const { data, pageSize } = useLoaderData<typeof loader>();

	const isFetchingThisRoute = getRouteFetchingState();

	const { onPageChange, onPageSizeChange } = GetPaginationControls({});

	const cols = table.getAllColumns();

	return (
		<div className="flex flex-col gap-4">
			<div className="w-fit self-end">
				<TableColumnsToggle table={table} />
			</div>
			{isFetchingThisRoute ? (
				<DataTableSkeleton noOfSkeletons={9} columns={cols} />
			) : (
				<DataTable
					table={table}
					onPageChange={onPageChange}
					onPageSizeChange={onPageSizeChange}
					pageSize={pageSize}
					total={data.total ?? 0}
				/>
			)}
		</div>
	);
};

const ToursGrid = memo(() => {
	const { data } = useLoaderData<typeof loader>();

	return (
		<motion.ul
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.4, ease: "easeOut" }}
			className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-2"
		>
			{data.tours.map((tour) => (
				<li key={tour.id}>
					<TourCard tour={tour} className="h-full" />
				</li>
			))}
		</motion.ul>
	);
});

const ToursArea = ({ table }: { table: Table<HighLevelTour> }) => {
	const { view_mode } = useContext(ToursPageCtx);

	const isFetchingThisRoute = getRouteFetchingState();

	if (view_mode === "grid") {
		return isFetchingThisRoute ? <TourCardSkeleton className="mt-2" /> : <ToursGrid />;
	} else {
		return <ToursTable table={table} />;
	}
};

const ViewModeChangeButtons = memo(() => {
	const { view_mode, setViewMode } = useContext(ToursPageCtx);

	const onTabChange = useCallback(
		(value: ViewMode) => {
			setViewMode(value);
		},
		[setViewMode],
	);

	const options: { value: ViewMode; label: string; icon: React.ReactNode }[] = useMemo(() => {
		return [
			{
				value: "table",
				label: "Table",
				icon: <TableOfContents />,
			},
			{
				value: "grid",
				label: "Grid",
				icon: <LayoutGrid />,
			},
		];
	}, []);

	return (
		<Tabs value={view_mode} onValueChange={(value) => onTabChange(value as ViewMode)}>
			<TabsList className="h-8 light:bg-muted-dark *:cursor-pointer *:select-none *:dark:hover:bg-muted *:dark:text-secondary-foreground">
				{options.map((option) => (
					<TabsTrigger
						key={option.value}
						value={option.value}
						className="data-[state=active]:shadow-xs"
					>
						{option.icon}
						<span className="sr-only">{option.label}</span>
					</TabsTrigger>
				))}
			</TabsList>
		</Tabs>
	);
});

const PageOptions = memo(() => {
	const [searchParams] = useSearchParams();
	const currentQuery = searchParams.get("q") ?? "";
	const isFetchingThisRoute = getRouteFetchingState();
	const navigate = useNavigate();
	const location = useLocation();

	const activeFiltersCount = getActiveToursFiltersCount(searchParams);
	const [filtersMenuOpen, setFiltersMenuOpen] = useState<boolean>(false);

	function handleFiltersClick() {
		return setFiltersMenuOpen(!filtersMenuOpen);
	}

	function handleResetFilters() {
		navigate(
			getToursResetFiltersUrl({
				defaultPage: "0",
				defaultSize: "10",
				pathname: location.pathname,
				search: location.search,
			}),
			{ replace: true },
		);
	}

	return (
		<>
			<div className="w-full flex-wrap flex justify-between gap-4 items-center">
				<div className="flex gap-2 items-center">
					<Form method="get" action="/tours">
						<div className="relative">
							<Search
								className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
								width={18}
							/>
							<Input
								placeholder="Search tours"
								name="q"
								className="w-full pl-8 md:min-w-75"
								id="search"
								defaultValue={currentQuery}
								disabled={isFetchingThisRoute}
							/>
						</div>
						<button type="submit" className="hidden">
							Search
						</button>
					</Form>
					<SortSelector />
				</div>
				<div className="flex gap-2 items-center ml-auto">
					<div className="sm:inline hidden">
						<Button
							variant="outline"
							className="h-8 flex cursor-pointer select-none dark:hover:bg-muted"
							onClick={handleResetFilters}
							disabled={isFetchingThisRoute || activeFiltersCount === 0}
						>
							<RotateCcw />
						</Button>
					</div>
					<div className="relative">
						<Button
							variant="outline"
							size="sm"
							className="h-8 flex cursor-pointer select-none dark:hover:bg-muted"
							disabled={isFetchingThisRoute}
							onClick={handleFiltersClick}
						>
							<ListFilter />
							<span className="hidden md:inline">Filters</span>
						</Button>
						<span className="filters-count">
							{activeFiltersCount > 0 ? activeFiltersCount : ""}
						</span>
					</div>
					<ViewModeChangeButtons />
				</div>
			</div>
			<FiltersSheet open={filtersMenuOpen} setOpen={setFiltersMenuOpen} />
		</>
	);
});

function SortSelector() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	const navigation = useNavigation();
	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";

	type sortFormData = Pick<TourFilterFormData, "sortBy" | "sortType">;

	const form = useForm<sortFormData>({
		resolver: zodResolver(TourFilterFormSchema),
		defaultValues: {
			sortBy: (searchParams.get("sortBy") as sortFormData["sortBy"]) || defaultTourSortByFilter,
			sortType: (searchParams.get("sortType") as sortFormData["sortType"]) || defaultTourSortTypeFilter,
		},
	});

	const { handleSubmit, control } = form;

	const onSortSubmit = (values: sortFormData) => {
		const currentParams = new URLSearchParams(location.search);

		// Remove old sort params if they exist
		currentParams.delete("sortBy");
		currentParams.delete("sortType");

		// Add new sort params
		if (values.sortBy) currentParams.set("sortBy", values.sortBy);
		if (values.sortType) currentParams.set("sortType", values.sortType);

		navigate(`?${currentParams.toString()}`);
	};

	return (
		<Button
			variant="outline"
			className="h-8 flex cursor-pointer select-none dark:hover:bg-muted"
			disabled={isSubmitting}
			asChild
		>
			<DropdownMenu>
				<DropdownMenuTrigger tabIndex={-1} className="focus:outline-0">
					<Button variant={"outline"} size="sm">
						<ArrowUpDown />
						<span className="hidden md:inline">Sort</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-fit">
					<form onSubmit={handleSubmit(onSortSubmit)} className="space-y-4 flex flex-col p-4">
						<ShadcnForm {...form}>
							<FormField
								control={control}
								name="sortBy"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Sort By</FormLabel>
										<FormControl>
											<Select value={field.value} onValueChange={field.onChange}>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Select field" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="created_at">Date Created</SelectItem>
													<SelectItem value="updated_at">Date Updated</SelectItem>
													<SelectItem value="isFeatured">Featured</SelectItem>
													<SelectItem value="isActive">Active</SelectItem>
												</SelectContent>
											</Select>
										</FormControl>
									</FormItem>
								)}
							/>

							<FormField
								control={control}
								name="sortType"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Sort Direction</FormLabel>
										<FormControl>
											<Select value={field.value} onValueChange={field.onChange}>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="asc / desc" />
												</SelectTrigger>
												<SelectContent>
													{sortTypeEnums.map((sortType) => (
														<SelectItem key={sortType} value={sortType}>
															{sortType === "asc" ? (
																<>
																	<span>Ascending</span>
																	<ArrowUpNarrowWide />
																</>
															) : (
																<>
																	<span>Descending</span>
																	<ArrowDownWideNarrow />
																</>
															)}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormControl>
									</FormItem>
								)}
							/>
							<div className="w-fit ml-auto">
								<Button type="submit" disabled={isSubmitting} size={"sm"}>
									{isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
									Apply
								</Button>
							</div>
						</ShadcnForm>
					</form>
				</DropdownMenuContent>
			</DropdownMenu>
		</Button>
	);
}

function FiltersSheet({ open, setOpen }: { open?: boolean; setOpen: (open: boolean) => void }) {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const location = useLocation();
	const currentQuery = searchParams.get("q") || undefined;

	const currentPageIndex = searchParams.get("page") || "1";
	const currentPageSize = searchParams.get("size") || "10";

	const loaderData = useLoaderData<typeof loader>();

	const categories = loaderData.categories.map((i) => {
		return {
			id: i.id.toString(),
			name: i.name,
		};
	});
	const cities = loaderData.cities.map((i) => {
		return {
			id: i.id.toString(),
			name: i.name,
		};
	});
	const providers = loaderData.providers.map((i) => {
		return {
			id: i.id.toString(),
			name: i.name,
		};
	});
	const tags = loaderData.tags.map((i) => {
		return {
			id: i.id.toString(),
			name: i.name,
		};
	});

	const navigation = useNavigation();
	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";

	type BoolVals = "true" | "false" | "null";
	const createdFromParam = searchParams.get("createdFrom");
	const createdToParam = searchParams.get("createdTo");

	const form = useForm<TourFilterFormData>({
		resolver: zodResolver(TourFilterFormSchema),
		defaultValues: {
			q: currentQuery,
			page: currentPageIndex,
			size: currentPageSize,
			isFeatured: (searchParams.get("isFeatured") as BoolVals) || "null",
			isActive: (searchParams.get("isActive") as BoolVals) || "null",
			categories: searchParams.get("categories")?.split(",") ?? [],
			cities: searchParams.get("cities")?.split(",") ?? [],
			providers: searchParams.get("providers")?.split(",") ?? [],
			tags: searchParams.get("tags")?.split(",") ?? [],
			isOpenDated: (searchParams.get("isOpenDated") as BoolVals) || "null",
			created_at:
				createdFromParam && createdToParam
					? {
							from: new Date(createdFromParam),
							to: new Date(createdToParam),
						}
					: null,
		},
	});

	const { handleSubmit, control, setValue, reset } = form;

	const selectedCategories = useWatch({ control, name: "categories" }) || [];
	const selectedCities = useWatch({ control, name: "cities" }) || [];
	const selectedProviders = useWatch({ control, name: "providers" }) || [];
	const selectedTags = useWatch({ control, name: "tags" }) || [];

	// Handle form submission
	const onFormSubmit = (values: TourFilterFormData) => {
		const params = new URLSearchParams();

		if (values.q) params.set("q", values.q);
		if (values.isFeatured && values.isFeatured !== "null") params.set("isFeatured", values.isFeatured);
		if (values.isActive && values.isActive !== "null") params.set("isActive", values.isActive);
		if (values.categories && values.categories.length > 0) {
			params.set("categories", values.categories.join(","));
		}
		if (values.cities && values.cities.length > 0) {
			params.set("cities", values.cities.join(","));
		}
		if (values.providers && values.providers.length > 0) {
			params.set("providers", values.providers.join(","));
		}
		if (values.tags && values.tags.length > 0) {
			params.set("tags", values.tags.join(","));
		}
		if (values.isOpenDated && values.isOpenDated !== "null")
			params.set("isOpenDated", values.isOpenDated);

		if (values.created_at) {
			params.set("createdFrom", values.created_at.from.toISOString());
			params.set("createdTo", values.created_at.to.toISOString());
		} else {
			params.delete("createdFrom");
			params.delete("createdTo");
		}

		if (currentPageIndex !== "1") {
			params.set("page", String(currentPageIndex));
		}
		if (currentPageSize !== "10") {
			params.set("size", String(currentPageSize));
		}

		const sortBy = searchParams.get("sortBy");
		const sortType = searchParams.get("sortType");
		if (sortBy) params.set("sortBy", sortBy);
		if (sortType) params.set("sortType", sortType);

		navigate(`?${params.toString()}`);
		setOpen(false);
	};

	function handleReset() {
		reset();
		navigate(
			getToursResetFiltersUrl({
				pathname: location.pathname,
				search: location.search,
			}),
			{ replace: true },
		);
	}

	return (
		<Sheet open={!!open} onOpenChange={setOpen}>
			<SheetContent className="overflow-y-auto">
				<SheetHeader>
					<SheetTitle>Tour Filters</SheetTitle>
					<SheetDescription>Filter tours by their fields and values</SheetDescription>
				</SheetHeader>
				<Separator />
				<form
					onSubmit={handleSubmit(onFormSubmit)}
					className="space-y-4 flex flex-col pb-4 px-4 h-full"
				>
					<ShadcnForm {...form}>
						<div className="flex justify-between gap-2 items-center">
							<h2 className="text-xl mt-0 font-bold">Filter</h2>
							<Button variant="link" onClick={handleReset}>
								Reset All
							</Button>
						</div>
						{/* isFeatured Filter */}
						<FormField
							control={control}
							name="isFeatured"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Featured</FormLabel>
									<FormControl>
										<Select value={field.value} onValueChange={field.onChange}>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select featured" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="null">Any</SelectItem>
												<SelectItem value="true">Yes</SelectItem>
												<SelectItem value="false">No</SelectItem>
											</SelectContent>
										</Select>
									</FormControl>
								</FormItem>
							)}
						/>

						{/* isActive Filter */}
						<FormField
							control={control}
							name="isActive"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Active</FormLabel>
									<FormControl>
										<Select value={field.value} onValueChange={field.onChange}>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select active" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="null">Any</SelectItem>
												<SelectItem value="true">Yes</SelectItem>
												<SelectItem value="false">No</SelectItem>
											</SelectContent>
										</Select>
									</FormControl>
								</FormItem>
							)}
						/>

						{/* Categories Filter */}
						<FormItem>
							<FormLabel>Categories</FormLabel>
							<FormControl className="mt-1">
								<div className="max-h-64 overflow-y-auto space-y-2">
									{categories.map((cat) => (
										<div key={cat.id} className="flex items-center gap-2">
											<Checkbox
												id={`cat-${cat.id}`}
												checked={selectedCategories.includes(cat.id)}
												onCheckedChange={(checked) => {
													const newCats = new Set(selectedCategories);
													checked ? newCats.add(cat.id) : newCats.delete(cat.id);
													setValue("categories", Array.from(newCats));
												}}
											/>
											<Label
												htmlFor={`cat-${cat.id}`}
												className="font-medium text-sm cursor-pointer"
											>
												{cat.name}
											</Label>
										</div>
									))}
								</div>
							</FormControl>
						</FormItem>

						{/* Cities Filter */}
						<FormItem>
							<FormLabel>Cities</FormLabel>
							<FormControl className="mt-1">
								<div className="max-h-64 overflow-y-auto space-y-2">
									{cities.map((city) => (
										<div key={city.id} className="flex items-center gap-2">
											<Checkbox
												id={`city-${city.id}`}
												checked={selectedCities.includes(city.id)}
												onCheckedChange={(checked) => {
													const newCities = new Set(selectedCities);
													checked
														? newCities.add(city.id)
														: newCities.delete(city.id);
													setValue("cities", Array.from(newCities));
												}}
											/>
											<Label
												htmlFor={`city-${city.id}`}
												className="font-medium text-sm cursor-pointer"
											>
												{city.name}
											</Label>
										</div>
									))}
								</div>
							</FormControl>
						</FormItem>

						{/* Providers Filter */}
						<FormItem>
							<FormLabel>Providers</FormLabel>
							<FormControl className="mt-1">
								<div className="max-h-64 overflow-y-auto space-y-2">
									{providers.map((provider) => (
										<div key={provider.id} className="flex items-center gap-2">
											<Checkbox
												id={`provider-${provider.id}`}
												checked={selectedProviders.includes(provider.id)}
												onCheckedChange={(checked) => {
													const newProviders = new Set(selectedProviders);
													checked
														? newProviders.add(provider.id)
														: newProviders.delete(provider.id);
													setValue("providers", Array.from(newProviders));
												}}
											/>
											<Label
												htmlFor={`provider-${provider.id}`}
												className="font-medium text-sm cursor-pointer"
											>
												{provider.name}
											</Label>
										</div>
									))}
								</div>
							</FormControl>
						</FormItem>

						{/* Tags Filter */}
						<FormItem>
							<FormLabel>Tags</FormLabel>
							<FormControl className="mt-1">
								<div className="max-h-64 overflow-y-auto space-y-2">
									{tags.map((tag) => (
										<div key={tag.id} className="flex items-center gap-2">
											<Checkbox
												id={`tag-${tag.id}`}
												checked={selectedTags.includes(tag.id)}
												onCheckedChange={(checked) => {
													const newTags = new Set(selectedTags);
													checked ? newTags.add(tag.id) : newTags.delete(tag.id);
													setValue("tags", Array.from(newTags));
												}}
											/>
											<Label
												htmlFor={`tag-${tag.id}`}
												className="font-medium text-sm cursor-pointer"
											>
												{tag.name}
											</Label>
										</div>
									))}
								</div>
							</FormControl>
						</FormItem>

						{/* isOpenDated Filter */}
						<FormField
							control={control}
							name="isOpenDated"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Open Dated</FormLabel>
									<FormControl>
										<Select value={field.value} onValueChange={field.onChange}>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select open dated" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="null">Any</SelectItem>
												<SelectItem value="true">Yes</SelectItem>
												<SelectItem value="false">No</SelectItem>
											</SelectContent>
										</Select>
									</FormControl>
								</FormItem>
							)}
						/>

						{/* Date Created Filter */}
						<Controller
							control={control}
							name="created_at"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Date Created</FormLabel>
									<FormControl>
										<div>
											<DateRangePicker
												className={`w-full`}
												value={field.value ?? null}
												onDateRangeChange={field.onChange}
												numberOfMonths={1}
											/>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Form Actions */}
						<SheetFooter className="px-0 w-full **:w-full">
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
								Apply
							</Button>
							<SheetClose asChild>
								<Button variant="outline">Close</Button>
							</SheetClose>
						</SheetFooter>
					</ShadcnForm>
				</form>
			</SheetContent>
		</Sheet>
	);
}

function TourCard({ tour, className }: { tour: HighLevelTour; className?: string }) {
	return (
		<div className={`overflow-hidden relative bg-card rounded-xl flex flex-col ${className ?? ""}`}>
			<img
				src={`${SUPABASE_IMAGE_BUCKET_PATH}/${tour.cover_image}`}
				alt={tour.name + " cover image"}
				title={tour.name + " cover image"}
				className="w-full h-48 object-cover"
			/>
			<div className="absolute top-2 right-2">
				<Badge variant={tour.isActive ? "default" : "destructive"} className="w-fit px-1">
					{tour.isActive ? <Check /> : <X />}
				</Badge>
			</div>
			<div className="p-4 flex flex-col flex-1">
				<div className="flex justify-between items-start gap-2">
					<h3 className="font-semibold text-md line-clamp-2">{tour.name}</h3>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0">
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{tour.isActive ? (
								<a
									href={`${process.env.VITE_MAIN_APP_URL}/tours/tour/${tour.id}/${tour.url_key}`}
									target="_blank"
								>
									<DropdownMenuItem>See Live</DropdownMenuItem>
								</a>
							) : (
								<Link
									to={`/tours/tour/${tour.id}/${tour.url_key}`}
									viewTransition
									prefetch="intent"
								>
									<DropdownMenuItem>See Preview</DropdownMenuItem>
								</Link>
							)}
							<Link to={`tour/${tour.id}/update`} viewTransition prefetch="intent">
								<DropdownMenuItem>Update</DropdownMenuItem>
							</Link>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
				<div className="mt-2 flex flex-wrap gap-2">
					<Badge variant="outline">{tour.city.name}</Badge>
					<Badge variant="outline">{tour.category.name}</Badge>
					{tour.isFeatured && <Badge variant="default">Featured</Badge>}
				</div>
				<div className="mt-auto pt-4">
					<p className="text-xs text-muted-foreground">
						Updated{" "}
						{tour.updated_at
							? formatDistanceToNow(new Date(tour.updated_at), { addSuffix: true })
							: "N/A"}
					</p>
				</div>
			</div>
		</div>
	);
}

const TourCardSkeleton = memo(({ className }: { className?: string }) => {
	const { pageSize } = useLoaderData<typeof loader>();

	return (
		<div
			className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className ?? ""}`}
		>
			{Array.from({ length: pageSize }).map((_, i) => (
				<Skeleton key={i} className="h-72 w-full rounded-lg" />
			))}
		</div>
	);
});
