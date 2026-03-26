import { type ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { type HighLevelCollection } from "@workspace/shared/types/collections";
import { Check, Loader2, MoreHorizontal, PlusCircle, Search, TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import {
	Form,
	Link,
	type LoaderFunctionArgs,
	useFetcher,
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
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { highLevelCollectionsQuery } from "~/queries/collections.q";
import { GetPaginationControls } from "~/utils/getPaginationControls";
import { getPaginationQueryPayload } from "~/utils/getPaginationQueryPayload";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const { q, pageIndex, pageSize } = getPaginationQueryPayload({ request });
	const data = await highLevelCollectionsQuery({ request, q, pageIndex, pageSize });
	return { data, query: q, pageIndex, pageSize };
};

export default function CollectionsPage() {
	const loaderData = useLoaderData<typeof loader>();
	const { data, query, pageIndex, pageSize } = loaderData;
	const navigation = useNavigation();
	const location = useLocation();
	const fetcher = useFetcher();

	const pageCount = Math.ceil(data.total / pageSize);
	const isFetchingThisRoute =
		navigation.state === "loading" && navigation.location?.pathname === location.pathname;

	const isDeletingReview = fetcher.state === "submitting";

	useEffect(() => {
		if (data.error != null && data.error.message) {
			toast.error(`${data.error.statusCode} - ${data.error.message}`);
		}
	}, [data.error]);

	useEffect(() => {
		if (fetcher.data) {
			if (fetcher.data.success) {
				toast.success("Collection deleted successfully");
			} else if (fetcher.data.error) {
				toast.error(fetcher.data.error);
			}
		}
	}, [fetcher.data]);

	function handleDeleteClick(collection_id: number) {
		if (collection_id == null) {
			toast.error("Something went wrong!");
			return;
		}
		toast.info("Deleting collection...");
		const formData = new FormData();
		formData.set("collection_id", collection_id.toString());
		fetcher.submit(formData, {
			method: "POST",
			action: "/collections/" + collection_id + "/delete",
			preventScrollReset: true,
		});
	}

	const tableColumns: ColumnDef<HighLevelCollection, unknown>[] = [
		{
			id: "ID",
			cell: (info) => <div hidden>{info.row.original.id}</div>,
			header: () => "",
		},
		{
			id: "Name",
			enableHiding: false,
			accessorKey: "name",
			cell: (info) => info.row.original.name,
			header: () => "Name",
		},
		{
			id: "Visibility",
			accessorKey: "Visibility",
			cell: (info) => (
				<Badge variant={info.row.original.isFeatured ? "default" : "default"}>
					{info.row.original.isFeatured ? <Check className="w-4 h-4 font-bold" /> : null}
					{info.row.original.isFeatured ? "Featured" : "Not Featured"}
				</Badge>
			),
			header: () => "Visibility",
		},
		{
			id: "No. of Tours",
			accessorKey: "No. of Tours",
			cell: (info) => {
				const tours = info.row.original.no_of_tours ?? 0;

				return (
					<div className={`${tours === 0 ? "flex gap-2 items-center" : ""}`}>
						<p className={`${tours === 0 ? "text-destructive" : ""}`}>{tours}</p>
						{tours === 0 && <TriangleAlert className="w-4 h-4 text-destructive mb-auto" />}
					</div>
				);
			},
			header: () => "No. of Tours",
		},
		{
			id: "City Pages",
			accessorKey: "City Pages",
			cell: (info) => {
				const cities = info.row.original.cities ?? [];
				return (
					<div className="flex gap-1">
						{cities.length > 0
							? cities.map((city) => (
									<Badge variant={"outline"} key={city.name}>
										{city.name}
									</Badge>
								))
							: "N/A"}
					</div>
				);
			},
			header: () => "City Pages",
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
				const rowData: HighLevelCollection = row.original;

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
								<Link
									to={`${process.env.VITE_MAIN_APP_URL}/tours?categories=${rowData.id}`}
									viewTransition
									prefetch="intent"
									target="_blank"
								>
									<DropdownMenuItem>View Live</DropdownMenuItem>
								</Link>
								<Link to={`/tours?categories=${rowData.id}`} viewTransition prefetch="intent">
									<DropdownMenuItem>View Details</DropdownMenuItem>
								</Link>
								<Link to={`${rowData.id}/update`} viewTransition prefetch="intent">
									<DropdownMenuItem>Update</DropdownMenuItem>
								</Link>

								<Dialog>
									<DialogTrigger asChild>
										<DropdownMenuItem
											className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
											onSelect={(e) => {
												e.preventDefault();
											}}
										>
											Delete
										</DropdownMenuItem>
									</DialogTrigger>

									<DialogContent>
										<DialogHeader>
											<DialogTitle>Delete Collection</DialogTitle>
											<DialogDescription className="pt-2">
												Are you sure you want to delete{" "}
												<span className="font-semibold text-foreground">
													"{rowData.name}"
												</span>
												?
												<br />
												<span className="text-destructive font-medium mt-3 block">
													This action cannot be undone. All associated tours will be
													unlinked.
												</span>
											</DialogDescription>
										</DialogHeader>

										<div className="flex justify-end gap-3 mt-2">
											<DialogClose asChild>
												<Button variant="outline" size={"sm"} type="button">
													Cancel
												</Button>
											</DialogClose>
											<Button
												type="button"
												size={"sm"}
												variant="destructive"
												disabled={isDeletingReview}
												onClick={() => handleDeleteClick(rowData.id)}
											>
												{isDeletingReview ? (
													<>
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
														Deleting...
													</>
												) : (
													"Delete Collection"
												)}
											</Button>
										</div>
									</DialogContent>
								</Dialog>
							</DropdownMenuContent>
						</DropdownMenu>
					</>
				);
			},
		},
	];

	const { onPageChange, onPageSizeChange } = GetPaginationControls({});

	const table = useReactTable({
		data: (data.collections as HighLevelCollection[]) ?? [],
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
				metaTitle="Tour Collections | Admin Panel"
				metaDescription="Manage your tour collections and bundles here."
				metaKeywords="Collections, Manage"
			/>
			<section className="flex flex-1 flex-col gap-6">
				<div>
					<div className="flex justify-between gap-3 flex-wrap">
						<h1 className="text-2xl font-semibold">Collections</h1>
						<Link to="/collections/add" viewTransition className="ml-auto" prefetch="intent">
							<Button size="sm" className="ml-auto">
								<PlusCircle width={18} />
								<span>Add Collection</span>
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

function DataTableViewOptions({ table, disabled }: DataTableViewOptionsProps<HighLevelCollection>) {
	const [searchParams] = useSearchParams();
	let currentQuery = searchParams.get("q") ?? "";

	return (
		<div className="w-full flex justify-between gap-4 items-center">
			<div>
				<Form method="get" action="/collections">
					<div className="relative">
						<Search
							className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
							width={18}
						/>
						<Input
							placeholder="Search collections"
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
