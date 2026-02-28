import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { HighLevelBooking } from "@workspace/shared/types/booking";
import { queryClient } from "@workspace/shared/utils/query-client";
import { format } from "date-fns";
import { Loader2, MoreHorizontal, Search } from "lucide-react";
import { useState } from "react";
import {
	Form,
	Link,
	type LoaderFunctionArgs,
	Outlet,
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
import TableCopyField from "~/components/Table/TableId";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { highLevelBookingsQuery } from "~/queries/bookings.q";
import { GetPaginationControls } from "~/utils/getPaginationControls";
import { getPaginationQueryPayload } from "~/utils/getPaginationQueryPayload";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const { q, pageIndex, pageSize } = getPaginationQueryPayload({
		request,
	});

	const data = await queryClient.fetchQuery(highLevelBookingsQuery({ request, q, pageIndex, pageSize }));

	return { data, query: q, pageIndex, pageSize };
};

export default function BookingsPage() {
	const loaderData = useLoaderData<typeof loader>();
	const { data, query, pageIndex, pageSize } = loaderData;
	const navigation = useNavigation();
	const location = useLocation();

	const pageCount = Math.ceil(data.total / pageSize);
	const isFetchingThisRoute =
		navigation.state === "loading" && navigation.location?.pathname === location.pathname;

	const getPaymentLink = (bookingRef: string) => {
		return `${process.env.VITE_MAIN_APP_URL}/payment?booking_ref=${encodeURIComponent(bookingRef)}`;
	};

	const tableColumns: ColumnDef<HighLevelBooking, unknown>[] = [
		{
			id: "Ref",
			accessorKey: "booking_ref",
			cell: (info) => (
				<TableCopyField
					id={info.row.original.booking_ref.toString()}
					message="Booking Reference Copied"
				/>
			),
			header: () => "Reference",
		},
		{
			id: "Customer",
			accessorKey: "customer",
			cell: (info) => (
				<div className="flex flex-col gap-1">
					<span className="font-semibold text-base">{info.row.original.customer_name}</span>
					<span className="hover:text-primary hover:underline underline-offset-4">
						<a
							href={`https://wa.me/${info.row.original.customer_phone}?text=Hi! I am from Top Attractions Dubai.\nThanks for booking with us.\nYour booking reference is ${info.row.original.booking_ref}`}
							target="_blank"
							rel="noopener noreferrer"
						>
							{info.row.original.customer_phone}
						</a>
					</span>
				</div>
			),
			header: () => "Customer",
		},
		{
			id: "Status",
			accessorKey: "Status",
			cell: ({
				row: {
					original: { booking_status, payment_status },
				},
			}) => (
				<div className="flex flex-col gap-2">
					<Tooltip>
						<TooltipTrigger className="mr-auto">
							<Badge
								variant={
									booking_status === "CONFIRMED"
										? "default"
										: booking_status === "CANCELLED"
											? "outline"
											: "secondary"
								}
								className={
									booking_status === "PENDING"
										? "bg-warning/20 dark:text-warning text-yellow-700"
										: booking_status === "CANCELLED"
											? "border-2 border-muted-foreground/20"
											: ""
								}
							>
								{booking_status}
							</Badge>
						</TooltipTrigger>
						<TooltipContent>Booking Status</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger className="mr-auto">
							<Badge
								variant={
									payment_status === "PAID"
										? "default"
										: payment_status === "FAILED"
											? "destructive"
											: "outline"
								}
								className={
									payment_status === "PENDING" || payment_status === "PARTIAL"
										? "bg-warning/20 dark:text-warning text-yellow-700"
										: payment_status === "REFUNDED"
											? "border-2 border-muted-foreground/20"
											: ""
								}
							>
								{payment_status}
							</Badge>
						</TooltipTrigger>
						<TooltipContent side="bottom">Payment Status</TooltipContent>
					</Tooltip>
				</div>
			),
			header: () => "Status",
		},
		{
			id: "Tour",
			accessorKey: "Tour",
			cell: (info) => (
				<div className="flex flex-col gap-1">
					{info.row.original.tour_id ? (
						<Link
							to={`/tours?q=${info.row.original.tour_name}`}
							className="w-fit max-w-40 truncate"
							viewTransition
							target="_blank"
						>
							<span className="font-semibold max-w-40 truncate hover:underline underline-offset-4 hover:text-primary">
								{info.row.original.tour_name}fdf Tldsasd sadha talh a tal
							</span>
						</Link>
					) : (
						<span className="font-semibold text-base">{info.row.original.tour_name}</span>
					)}
					<span className="max-w-40 truncate">{info.row.original.tour_option_name}</span>
				</div>
			),
			header: () => "Selected Tour",
		},
		{
			id: "Temporary D/T",
			accessorKey: "Temporary D/T",
			cell: (info) => (
				<div className="flex flex-col gap-1">
					{info.row.original.preffered_date ? (
						<span>{format(info.row.original.preffered_date, "PPP")}</span>
					) : (
						<span>N/A</span>
					)}
					<span>{info.row.original.preffered_timeslot ?? "N/A"}</span>
				</div>
			),
			header: () => "Temporary D/T",
		},
		{
			id: "Confirmed D/T",
			accessorKey: "Confirmed D/T",
			cell: (info) => (
				<div className="flex flex-col gap-1">
					{info.row.original.confirmed_date ? (
						<span>{format(info.row.original.confirmed_date, "PPP")}</span>
					) : (
						<span>N/A</span>
					)}
					<span>{info.row.original.confirmed_timeslot ?? "N/A"}</span>
				</div>
			),
			header: () => "Confirmed D/T",
		},
		{
			id: "Total",
			accessorKey: "Total",
			cell: (info) => <span>{info.row.original.total.toFixed(2)}</span>,
			header: () => "Total (AED)",
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
				const rowData: HighLevelBooking = row.original;
				const isGoingToEmailDialog =
					navigation.state === "loading" &&
					navigation.location?.pathname === "/bookings/send-confirmation-email/" + rowData.id;

				const paymentLink = getPaymentLink(rowData.booking_ref);

				// Add this state per row (or use row.id as key)
				const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

				return (
					<>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="secondary" className="h-8 w-8 p-0 cursor-pointer">
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								{rowData.booking_status === "CONFIRMED" &&
									rowData.payment_status === "PAID" && (
										<>
											<Link to={`send-confirmation-email/${rowData.id}`} viewTransition>
												<DropdownMenuItem>
													{isGoingToEmailDialog && (
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													)}
													Send Email
												</DropdownMenuItem>
											</Link>
											<DropdownMenuSeparator />
										</>
									)}

								{rowData.tour_id && (
									<>
										<Link
											to={`/tours?q=${rowData.tour_name}`}
											viewTransition
											prefetch="intent"
										>
											<DropdownMenuItem>View Tour</DropdownMenuItem>
										</Link>
										<Link
											to={`${process.env.VITE_MAIN_APP_URL}/tours?q=${rowData.tour_name}`}
											viewTransition
											target="_blank"
										>
											<DropdownMenuItem>View Live Tour</DropdownMenuItem>
										</Link>
									</>
								)}

								{/* Payment Link - controlled open */}
								<DropdownMenuItem
									onSelect={(e) => {
										e.preventDefault(); // ← important: prevent dropdown auto-close
										setIsPaymentDialogOpen(true);
									}}
									className="cursor-pointer"
								>
									Payment Link
								</DropdownMenuItem>

								<Link
									to={`${rowData.id}/${rowData.booking_ref}/update`}
									viewTransition
									prefetch="intent"
								>
									<DropdownMenuItem>Update</DropdownMenuItem>
								</Link>
							</DropdownMenuContent>
						</DropdownMenu>

						{/* Dialog now outside DropdownMenu, controlled by state */}
						<Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
							<DialogContent className="sm:max-w-md">
								<DialogHeader>
									<DialogTitle>Payment Link for #{rowData.booking_ref}</DialogTitle>
									<DialogDescription>{rowData.tour_name}</DialogDescription>
								</DialogHeader>

								<div className="space-y-6 py-4">
									{/* The link itself */}
									<div
										className="cursor-pointer hover:underline hover:underline-offset-4"
										onClick={() => {
											navigator.clipboard.writeText(paymentLink);
											toast.success("Payment link copied to clipboard!");
										}}
									>
										<p className="text-sm font-medium text-muted-foreground break-all">
											{paymentLink}
										</p>
									</div>

									{/* Share buttons */}
									<div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
										{/* WhatsApp */}
										<Button
											variant="outline"
											className="w-full"
											onClick={() => {
												const waText = `Hi! Please complete your payment for booking #${rowData.booking_ref} for ${rowData.tour_name} - ${rowData.tour_option_name}\n\nLink:\n\n${paymentLink}\n\nThank you!\nTop Attractions Dubai`;
												window.open(
													`https://wa.me/?text=${encodeURIComponent(waText)}`,
													"_blank",
													"noopener,noreferrer",
												);
											}}
										>
											Share on WhatsApp
										</Button>

										{/* Email */}
										<Button
											variant="outline"
											className="w-full"
											onClick={() => {
												const subject = `Complete Your Payment - Booking #${rowData.booking_ref} for ${rowData.tour_name}`;
												const body = `Dear Customer!\n\nPlease complete your payment for booking #${rowData.booking_ref} for ${rowData.tour_name} - ${rowData.tour_option_name}\n\nLink: ${paymentLink}\n\nThank you!\nTop Attractions Dubai`;
												window.open(
													`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}&to=${rowData.customer_email ? encodeURIComponent(
														rowData.customer_email,
													) : ""}`,
												);
											}}
										>
											Share via Email
										</Button>
									</div>
								</div>
							</DialogContent>
						</Dialog>
					</>
				);
			},
		},
	];

	const { onPageChange, onPageSizeChange } = GetPaginationControls({});

	const table = useReactTable({
		data: (data.bookings as HighLevelBooking[]) ?? [],
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
				metaTitle="Tour Bookings | Admin Panel"
				metaDescription="Manage your bookings here."
				metaKeywords="bookings, Manage"
			/>
			<section className="flex flex-1 flex-col gap-6">
				<div>
					<h1 className="text-2xl font-semibold">Bookings</h1>

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
			<Outlet />
		</>
	);
}

function DataTableViewOptions({ table, disabled }: DataTableViewOptionsProps<HighLevelBooking>) {
	const [searchParams] = useSearchParams();
	let currentQuery = searchParams.get("q") ?? "";

	return (
		<div className="w-full flex justify-between gap-4 items-center">
			<div>
				<Form method="get" action="/bookings">
					<div className="relative">
						<Search
							className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
							width={18}
						/>
						<Input
							placeholder="Search by reference id"
							name="q"
							className="w-full pl-8 md:min-w-75"
							id="search"
							defaultValue={currentQuery}
							disabled={disabled}
							maxLength={10}
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
