import { Link, useLoaderData, useSearchParams, redirect, type LoaderFunctionArgs } from "react-router";
import { format } from "date-fns";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ChevronLeft, ChevronRight, CircleAlert, Loader2 } from "lucide-react";
import { genAuthSecurity } from "@workspace/shared/utils/auth-utils.server";
import { currentFullUserQuery } from "~/queries/auth.q";
import { queryClient } from "@workspace/shared/utils/query-client";
import type { Database } from "@workspace/shared/types/supabase";
import { myBookingsQuery } from "~/queries/bookings.q";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { toast } from "sonner";
import { useState } from "react";

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

	const [fetchingPaymentLink, setFetchingPaymentLink] = useState(false);

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
					metaTitle="My Bookings | WanderNest"
					metaDescription="See your bookings with us"
					metaKeywords="WanderNest"
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
					metaTitle="My Bookings | WanderNest"
					metaDescription="See your bookings with us"
					metaKeywords="WanderNest"
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

	const getPaymentLink = async (bookingRef: string) => {
		if (bookingRef == null) {
			toast.warning("No booking reference found");
			return;
		}

		console.log("Getting payment link....");
		setFetchingPaymentLink(true);

		try {
			const resp = await fetch("/retry-stripe-checkout", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ bookingRef }),
			});

			if (!resp.ok) {
				toast.error("Failed to create payment session", {
					description: "Please try again or contact support",
				});
				return;
			}

			const data = await resp.json();

			if (data.success) {
				if (data.url) {
					window.location.href = data.url;
				} else {
					toast.error("Failed to get payment link", {
						description: "Please try again or contact support",
					});
				}
			} else {
				toast.error("Failed to create payment session", {
					description: "Please try again or contact support",
				});
			}
		} catch (err: any) {
			console.error("Fetch error:", err);
			toast.error("Failed to create payment session", {
				description: "Please try again or contact support",
			});
		} finally {
			setFetchingPaymentLink(false);
		}
	};

	return (
		<>
			<MetaDetails
				metaTitle="My Bookings | WanderNest"
				metaDescription="See your bookings with us"
				metaKeywords="WanderNest"
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
												className="font-mono text-xs tracking-wide px-2.5 py-0.5 bg-background border shadow-xs cursor-pointer"
												onClick={() => {
													navigator.clipboard.writeText(booking.booking_ref);
													toast.success(
														`Booking reference #${booking.booking_ref} copied`,
													);
												}}
											>
												{booking.booking_ref}
											</Badge>

											<BookingStatusBadge status={booking.booking_status} />
											{booking.payment_status === "PENDING" ? (
												<Button
													size="sm"
													disabled={fetchingPaymentLink}
													onClick={() => getPaymentLink(booking.booking_ref)}
													className="bg-destructive hover:bg-destructive/90 text-xs py-0! h-7 px-3"
												>
													{fetchingPaymentLink ? (
														<Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
													) : (
														<CircleAlert className="h-3.5 w-3.5 mr-1" />
													)}
													Pay Now
												</Button>
											) : (
												<PaymentStatusBadge status={booking.payment_status} />
											)}
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

							<div className="px-5 sm:px-6 pb-2 space-y-5">
								<h3 className="font-medium text-base">Booked Tours</h3>

								{booking.items.length === 0 ? (
									<p className="text-sm text-muted-foreground italic">
										No tour details available
									</p>
								) : (
									<div className="space-y-3">
										{booking.items.map((item, idx) => (
											<div key={idx} className="border-l-2 border-primary/30 pl-3">
												<div className="font-medium">{item.tour_name}</div>
												{item.tour_option_name && (
													<div className="text-sm text-muted-foreground">
														{item.tour_option_name}
													</div>
												)}
												<div className="text-xs text-muted-foreground mt-1">
													{item.confirmed_date ? (
														<>
															Confirmed:{" "}
															{format(new Date(item.confirmed_date), "PPP")}
															{item.confirmed_timeslot && (
																<> • {item.confirmed_timeslot}</>
															)}
														</>
													) : item.preffered_date ? (
														<>
															Preferred:{" "}
															{format(new Date(item.preffered_date), "PPP")}
															{item.preffered_timeslot && (
																<> • {item.preffered_timeslot}</>
															)}
														</>
													) : (
														"Date not specified"
													)}
												</div>
											</div>
										))}
									</div>
								)}
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
