import {
	ColumnDef,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	Table,
	useReactTable,
} from "@tanstack/react-table";
import { SUPABASE_IMAGE_BUCKET_PATH } from "@workspace/shared/constants/constants";
import type { HighLevelTour } from "@workspace/shared/types/tours";
import { queryClient } from "@workspace/shared/utils/query-client";
import { formatDistanceToNow } from "date-fns";
import {
	Check,
	Flame,
	LayoutGrid,
	Loader2,
	MoreHorizontal,
	PlusCircle,
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
	DropdownMenuSeparator,
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
import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const { q, pageIndex, pageSize } = getPaginationQueryPayload({
		request,
	});

	const data = await queryClient.fetchQuery(highLevelToursQuery({ request, q, pageIndex, pageSize }));

	return { data, query: q, pageIndex, pageSize };
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

	const handleDeleteClick = (tourId: string) => {
		const formData = new FormData();
		formData.append("tourId", tourId.toString());
		fetcher.submit(formData, {
			method: "POST",
			action: `/tours/${tourId}/delete`,
		});
	};

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
			id: "Url Key",
			accessorKey: "url_key",
			cell: (info) => "/" + info.row.original.url_key,
			header: () => "Url Key",
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
							<Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
								<span className="sr-only">Open menu</span>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<Link
								to={`/tours/tour/${rowData.id}/${rowData.url_key}`}
								viewTransition
								prefetch="intent"
							>
								<DropdownMenuItem>See Preview</DropdownMenuItem>
							</Link>
							<Link
								to={`/LIVE/tours/tour/${rowData.id}/${rowData.url_key}`}
								viewTransition
								prefetch="intent"
							>
								<DropdownMenuItem>See Live</DropdownMenuItem>
							</Link>
							<Link to={`tour/${rowData.id}/update`} viewTransition prefetch="intent">
								<DropdownMenuItem>Update</DropdownMenuItem>
							</Link>
							<DropdownMenuItem
								disabled={fetcher.state === "submitting"}
								variant="destructive"
								onClick={() => handleDeleteClick(rowData.id)}
							>
								{fetcher.state === "submitting" ? (
									<Loader2 className="animate-spin" color="white" />
								) : null}
								Delete
							</DropdownMenuItem>
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
			<li key={"create-new-tour"}>
				<CreateNewTourCard />
			</li>
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

	return (
		<>
			<div className="w-full flex justify-between gap-4 items-center">
				<div>
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
				</div>
				<ViewModeChangeButtons />
			</div>
		</>
	);
});

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
							<Link
								to={`/tours/tour/${tour.id}/${tour.url_key}`}
								viewTransition
								prefetch="intent"
							>
								<DropdownMenuItem>See Preview</DropdownMenuItem>
							</Link>
							<Link
								to={`/LIVE/tours/tour/${tour.id}/${tour.url_key}`}
								viewTransition
								prefetch="intent"
							>
								<DropdownMenuItem>See Live</DropdownMenuItem>
							</Link>
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
				{tour.toBeSoldOutScore >= 0.7 && (
					<div className="my-3">
						<Badge variant="destructive">
							<Flame />
							<span>Likely to Sell Out</span>
						</Badge>
					</div>
				)}
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

const CreateNewTourCard = memo(() => {
	return (
		<Link to="/tours/add" viewTransition prefetch="intent">
			<div className="h-full flex border-2 border-transparent transition-colors duration-200 ease-in-out items-center justify-center bg-card cursor-pointer hover:bg-accent/50 hover:border-primary rounded-xl">
				<div className="flex flex-col items-center gap-2 p-6">
					<PlusCircle className="h-6 w-6 text-muted-foreground" />
					<p className="text-md font-semibold">Add New Tour</p>
				</div>
			</div>
		</Link>
	);
});

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
