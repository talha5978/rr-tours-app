import { Link, useLoaderData, useSearchParams, redirect, type LoaderFunctionArgs } from "react-router";
import { format } from "date-fns";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ArrowRight, ChevronLeft, ChevronRight, Clock, Ticket } from "lucide-react";
import { genAuthSecurity } from "@workspace/shared/utils/auth-utils.server";
import { currentFullUserQuery } from "~/queries/auth.q";
import { queryClient } from "@workspace/shared/utils/query-client";
import type { Database } from "@workspace/shared/types/supabase";
import { myBookingsQuery } from "~/queries/bookings.q";
import { MetaDetails } from "~/components/SEO/MetaDetails";

const PAGE_SIZE = 10;

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const { authId, headers } = genAuthSecurity(request);
	let userId: string | null = null;

	if (authId) {
		const resp = await queryClient.fetchQuery(currentFullUserQuery({ request, authId, headers }));
		userId = resp?.user?.id ?? null;
		if (userId === null) {
			return redirect("/login");
		}
	} else {
		return redirect("/login");
	}

	const url = new URL(request.url);
	const pageParam = url.searchParams.get("page");

	const currentPage = Number(pageParam) || 1;
	const pageIndex = Math.max(0, currentPage - 1);

	try {
		const result = await queryClient.fetchQuery(
			myBookingsQuery({ pageIndex, pageSize: PAGE_SIZE, request, userId }),
		);

		return {
			bookingsData: result,
			currentPage,
		};
	} catch (error) {
		console.error(error);
		return {
			bookingsData: { bookings: [], total: 0, error: null },
			currentPage,
			errorMessage: "Failed to load bookings. Please try again.",
		};
	}
};

export default function MyBookingsPage() {
	const { bookingsData, currentPage, errorMessage } = useLoaderData<typeof loader>();

	const { bookings, total } = bookingsData;
	const totalPages = Math.ceil(total / PAGE_SIZE);

	const [_, setSearchParams] = useSearchParams();

	const handlePageChange = (newPage: number) => {
		setSearchParams(
			(prev) => {
				const newParams = new URLSearchParams(prev);
				newParams.set("page", String(newPage));
				return newParams;
			},
			{ viewTransition: true, preventScrollReset: true, replace: true },
		);
	};

	if (errorMessage) {
		return (
			<>
				<MetaDetails
					metaTitle="My Bookings | Top Attractions Dubai"
					metaDescription="See your bookings with us"
					metaKeywords="Top Attractions Dubai"
				/>
				<div className="container mx-auto py-12 max-w-4xl">
					<Card>
						<CardHeader>
							<CardTitle>Something went wrong</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground">{errorMessage}</p>
							<Button asChild className="mt-4">
								<Link to="/account/bookings" viewTransition prefetch="intent">
									Refresh
								</Link>
							</Button>
						</CardContent>
					</Card>
				</div>
			</>
		);
	}

	if (bookings.length === 0) {
		return (
			<>
				<MetaDetails
					metaTitle="My Bookings | Top Attractions Dubai"
					metaDescription="See your bookings with us"
					metaKeywords="Top Attractions Dubai"
				/>
				<div className="container mx-auto py-12 max-w-4xl">
					<Card>
						<CardHeader>
							<CardTitle>No bookings found</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground">You haven't made any bookings yet.</p>
						</CardContent>
					</Card>
				</div>
			</>
		);
	}

	return (
		<>
			<MetaDetails
				metaTitle="My Bookings | Top Attractions Dubai"
				metaDescription="See your bookings with us"
				metaKeywords="Top Attractions Dubai"
			/>
			<div className="container mx-auto max-w-5xl">
				<div className="mb-8">
					<h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
					<p className="text-muted-foreground mt-1">View and manage your tour reservations</p>
				</div>

				<div className="space-y-5">
					{bookings.map((booking) => (
						<Card
							key={booking.id}
							className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow duration-200"
						>
							<div className="px-4 xs:px-5 sm:px-6 pb-4 border-b">
								<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
									<div className="flex flex-col gap-2 min-w-0">
										<div className="flex flex-wrap items-center gap-2.5">
											<Badge
												variant="outline"
												className="font-mono text-xs tracking-wide px-2.5 py-0.5 bg-background border shadow-xs"
											>
												{booking.booking_ref}
											</Badge>

											<BookingStatusBadge status={booking.booking_status} />
										</div>

										{booking.customer_name && (
											<div className="text-xs text-muted-foreground pl-0.5">
												for{" "}
												<span className="font-medium text-foreground/90">
													{booking.customer_name}
												</span>
											</div>
										)}
									</div>

									<div className="flex flex-col items-start sm:items-end gap-0.5 whitespace-nowrap">
										<span className="text-xs text-muted-foreground">Total</span>
										<span className="text-xl sm:text-2xl font-semibold tabular-nums tracking-tight">
											{booking.total.toLocaleString()} AED
										</span>
									</div>
								</div>
							</div>

							<div className="px-5 sm:px-6 pb-2 space-y-5 text-sm">
								<div>
									<div className="font-medium text-base leading-snug">
										{booking.tour_name || "Untitled Tour"}
									</div>
									{booking.tour_option_name && (
										<div className="text-muted-foreground mt-0.5">
											{booking.tour_option_name}
										</div>
									)}
								</div>

								<div className="grid sm:grid-cols-2 gap-6 lg:gap-8">
									<div className="flex gap-3">
										<Clock className="h-4.5 w-4.5 text-muted-foreground mt-0.5 shrink-0" />
										<div className="space-y-1">
											<div className="font-medium">Date/Timeslot</div>

											<div className="space-y-0.5 text-muted-foreground">
												{booking.confirmed_date ? (
													<>
														<div>
															<span className="font-medium text-foreground">
																Confirmed:
															</span>{" "}
															{format(new Date(booking.confirmed_date), "PPP")}
															{booking.confirmed_timeslot && (
																<> • {booking.confirmed_timeslot}</>
															)}
														</div>
													</>
												) : booking.preffered_date ? (
													<>
														<div>
															<span className="font-medium text-foreground">
																Preferred:
															</span>{" "}
															{format(new Date(booking.preffered_date), "PPP")}
															{booking.preffered_timeslot && (
																<> • {booking.preffered_timeslot}</>
															)}
														</div>
														<div className="text-xs">(Awaiting confirmation)</div>
													</>
												) : (
													<div className="italic">Date not specified</div>
												)}
											</div>
										</div>
									</div>

									<div className="flex gap-3">
										<Ticket className="h-4.5 w-4.5 text-muted-foreground mt-0.5 shrink-0" />
										<div className="space-y-1 flex-1">
											<div className="font-medium">Payment & Status</div>

											<div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
												<PaymentStatusBadge status={booking.payment_status} />

												{booking.confirmed_at ? (
													<div className="text-xs text-muted-foreground">
														Confirmed on{" "}
														{format(new Date(booking.confirmed_at), "PPp")}
													</div>
												) : (
													<div className="text-xs text-muted-foreground italic">
														Not yet confirmed
													</div>
												)}
											</div>
										</div>
									</div>
								</div>

								<div className="flex justify-end pt-2">
									<Link to={`/track-booking?ref=${booking.booking_ref}`} viewTransition>
										<Button variant="outline" size="sm">
											View Details
											<ArrowRight />
										</Button>
									</Link>
								</div>
							</div>
						</Card>
					))}
				</div>

				{totalPages > 1 && (
					<div className="mt-10 flex justify-center items-center gap-4">
						<Button
							variant="outline"
							size="sm"
							disabled={currentPage === 1}
							onClick={() => handlePageChange(currentPage - 1)}
						>
							<ChevronLeft className="mr-1 h-4 w-4" />
							Previous
						</Button>

						<span className="text-sm text-muted-foreground">
							Page {currentPage} of {totalPages}
						</span>

						<Button
							variant="outline"
							size="sm"
							disabled={currentPage >= totalPages}
							onClick={() => handlePageChange(currentPage + 1)}
						>
							Next
							<ChevronRight className="ml-1 h-4 w-4" />
						</Button>
					</div>
				)}
			</div>
		</>
	);
}

// Helper components remain unchanged
function BookingStatusBadge({ status }: { status: Database["public"]["Enums"]["booking_status_enum"] }) {
	const variants: Record<string, "default" | "secondary" | "destructive" | "warning"> = {
		CONFIRMED: "default",
		PENDING: "warning",
		CANCELLED: "destructive",
	};

	return (
		<Badge variant={variants[status] || "outline"} className="capitalize">
			{status.toLowerCase()}
		</Badge>
	);
}

function PaymentStatusBadge({ status }: { status: Database["public"]["Enums"]["payment_status_enum"] }) {
	const variants: Record<string, "default" | "secondary" | "destructive" | "warning"> = {
		PAID: "default",
		UNPAID: "warning",
		REFUNDED: "destructive",
		PENDING: "warning",
		PARTIAL: "warning",
	};

	return (
		<Badge variant={variants[status] || "outline"} className="capitalize text-xs">
			{status.toLowerCase()}
		</Badge>
	);
}
