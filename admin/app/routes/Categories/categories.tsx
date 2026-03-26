import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { SUPABASE_IMAGE_BUCKET_PATH } from "@workspace/shared/constants/constants";
import { HighLevelCategory } from "@workspace/shared/types/categories";
import { MoreHorizontal, PlusCircle, Search, TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import {
	Form,
	Link,
	type LoaderFunctionArgs,
	useLoaderData,
	useLocation,
	useNavigation,
	useSearchParams,
} from "react-router";
import { toast } from "sonner";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import {
	DataTable,
	DataTableSkeleton,
	TableColumnsToggle,
	type DataTableViewOptionsProps,
} from "~/components/Table/data-table";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "~/components/ui/hover-card";
import { Input } from "~/components/ui/input";
import { highLevelCategoriesQuery } from "~/queries/categories.q";
import { GetPaginationControls } from "~/utils/getPaginationControls";
import { getPaginationQueryPayload } from "~/utils/getPaginationQueryPayload";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const { q, pageIndex, pageSize } = getPaginationQueryPayload({
		request,
	});

	const data = await highLevelCategoriesQuery({ request, q, pageIndex, pageSize });

	return { data, query: q, pageIndex, pageSize };
};

export default function CategoriesPage() {
	const loaderData = useLoaderData<typeof loader>();
	const { data, query, pageIndex, pageSize } = loaderData;
	const navigation = useNavigation();
	const location = useLocation();

	const pageCount = Math.ceil(data.total / pageSize);
	const isFetchingThisRoute =
		navigation.state === "loading" && navigation.location?.pathname === location.pathname;

	useEffect(() => {
		if (data.error != null && data.error.message) {
			toast.error(`${data.error.statusCode} - ${data.error.message}`);
		}
	}, [data.error]);

	const tableColumns: ColumnDef<HighLevelCategory, unknown>[] = [
		{
			id: "ID",
			cell: (info) => <div hidden>{info.row.original.id}</div>,
			header: () => "",
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
							src={SUPABASE_IMAGE_BUCKET_PATH + "/" + info.row.original.image}
							alt="Category Image"
							className="border border-border rounded-md object-cover"
						/>
						<span className="text-xs text-muted-foreground">{info.row.original.name}</span>
					</HoverCardContent>
				</HoverCard>
			),
			header: () => "Name",
		},
		{
			id: "Tours",
			accessorKey: "tours",
			cell: (info) => {
				const tours = info.row.original.tours ?? 0;

				return (
					<div className={`${tours === 0 ? "flex gap-2 items-center" : ""}`}>
						<p className={`${tours === 0 ? "text-destructive" : ""}`}>{tours}</p>
						{tours === 0 && <TriangleAlert className="w-4 h-4 text-destructive mb-auto" />}
					</div>
				);
			},
			header: () => "Tours",
		},
		{
			id: "Url Key",
			accessorKey: "url_key",
			cell: (info) => "/" + info.row.original.url_key,
			header: () => "Url Key",
		},
		{
			id: "Created At",
			accessorKey: "created_at",
			cell: (info) => {
				if (info.row.original.created_at) {
					const date = new Date(info.row.original.created_at);
					return date.toLocaleDateString();
				}

				return "N/A";
			},
			header: () => "Created At",
		},
		{
			id: "actions",
			cell: ({ row }) => {
				const rowData: HighLevelCategory = row.original;

				const handleCopy = () => {
					try {
						navigator.clipboard.writeText(rowData.id.toString());
					} catch (error) {
						console.error("Error copying to clipboard:", error);
					}

					toast.success("Category Id copied to clipboard");
				};

				return (
					<>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="secondary" className="h-8 w-8 p-0 cursor-pointer">
									<span className="sr-only">Open menu</span>
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={handleCopy}>Copy Id</DropdownMenuItem>
								<Link
									to={`${process.env.VITE_MAIN_APP_URL}/tours?categories=${rowData.id}`}
									viewTransition
									prefetch="intent"
									target="_blank"
								>
									<DropdownMenuItem>View Live</DropdownMenuItem>
								</Link>
								<Link to={`/tours?categories=${rowData.id}`} viewTransition prefetch="intent">
									<DropdownMenuItem>View Tours</DropdownMenuItem>
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
		data: (data.data as HighLevelCategory[]) ?? [],
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
			<MetaDetails
				metaTitle="Tour Categories | Admin Panel"
				metaDescription="Manage your categories here."
				metaKeywords="Categories, Manage"
			/>
			<section className="flex flex-1 flex-col gap-6">
				<div>
					<div className="flex justify-between gap-3 flex-wrap">
						<h1 className="text-2xl font-semibold">Categories</h1>
						<Link to="/categories/add" viewTransition className="ml-auto" prefetch="intent">
							<Button size="sm" className="ml-auto">
								<PlusCircle width={18} />
								<span>Add Category</span>
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
						<DataTableSkeleton noOfSkeletons={4} columns={tableColumns} />
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

function DataTableViewOptions({ table, disabled }: DataTableViewOptionsProps<HighLevelCategory>) {
	const [searchParams] = useSearchParams();
	let currentQuery = searchParams.get("q") ?? "";

	return (
		<div className="w-full flex justify-between gap-4 items-center">
			<div>
				<Form method="get" action="/categories">
					<div className="relative">
						<Search
							className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
							width={18}
						/>
						<Input
							placeholder="Search categories"
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
