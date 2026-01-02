import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { SUPABASE_IMAGE_BUCKET_PATH } from "@workspace/shared/constants/constants";
import type { HighLevelTour } from "@workspace/shared/types/tours";
import { queryClient } from "@workspace/shared/utils/query-client";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal, PlusCircle, Search } from "lucide-react";
import {
	Form,
	Link,
	type LoaderFunctionArgs,
	useLoaderData,
	useLocation,
	useNavigation,
	useSearchParams,
} from "react-router";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import {
	DataTable,
	DataTableSkeleton,
	TableColumnsToggle,
	type DataTableViewOptionsProps,
} from "~/components/Table/data-table";
import TableCopyField from "~/components/Table/TableId";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "~/components/ui/hover-card";
import { Input } from "~/components/ui/input";
import StatusBadge from "~/components/ui/status-badge";
import { highLevelToursQuery } from "~/queries/tours.q";
import { GetPaginationControls } from "~/utils/getPaginationControls";
import { getPaginationQueryPayload } from "~/utils/getPaginationQueryPayload";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const { q, pageIndex, pageSize } = getPaginationQueryPayload({
		request,
	});

	const data = await queryClient.fetchQuery(highLevelToursQuery({ request, q, pageIndex, pageSize }));

	return { data, query: q, pageIndex, pageSize };
};

export default function ToursMainPage() {
	const loaderData = useLoaderData<typeof loader>();
	const { data, query, pageIndex, pageSize } = loaderData;

	if (data.tours == null) {
		return (
			<div>
				<p className="text-muted-foreground">Error fetching tours!</p>
			</div>
		);
	}

	const navigation = useNavigation();
	const location = useLocation();

	const pageCount = Math.ceil(data.total / pageSize);
	const isFetchingThisRoute =
		navigation.state === "loading" && navigation.location?.pathname === location.pathname;

	const tableColumns: ColumnDef<HighLevelTour, unknown>[] = [
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
					<>
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
								<Link to={`${rowData.id}/update`} viewTransition prefetch="intent">
									<DropdownMenuItem>Update</DropdownMenuItem>
								</Link>
							</DropdownMenuContent>
						</DropdownMenu>
					</>
				);
			},
		},
	];

	const { onPageChange, onPageSizeChange } = GetPaginationControls({});

	const table = useReactTable({
		data: (data.tours as HighLevelTour[]) ?? [],
		columns: tableColumns,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
		pageCount,
		state: {
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
				<div className="rounded-md flex flex-col gap-4">
					<DataTableViewOptions table={table} disabled={isFetchingThisRoute} />
					{isFetchingThisRoute ? (
						<DataTableSkeleton noOfSkeletons={10} columns={tableColumns} />
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
			</section>
		</>
	);
}

function DataTableViewOptions({ table, disabled }: DataTableViewOptionsProps<HighLevelTour>) {
	const [searchParams] = useSearchParams();
	let currentQuery = searchParams.get("q") ?? "";

	return (
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
							disabled={disabled}
						/>
					</div>
					{/* Invisible submit button: Enter in input triggers submit */}
					<button type="submit" className="hidden">
						Search
					</button>
				</Form>
			</div>
			<TableColumnsToggle table={table} />
		</div>
	);
}
