import { Trash2, ShoppingCart, ArrowRight, Loader2, Calendar } from "lucide-react";
import {
	Link,
	LoaderFunctionArgs,
	useLoaderData,
	useNavigation,
	useRevalidator,
	useSearchParams,
} from "react-router";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { Badge } from "~/components/ui/badge";
import { myCartQuery } from "~/queries/cart.q";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { getCurrentUser } from "@workspace/shared/queries/auth.q";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const userData = await getCurrentUser(request);

	const url = new URL(request.url);
	const page = Number(url.searchParams.get("page")) || 1;

	let myCart = null;

	if (userData && userData.user) {
		myCart = await myCartQuery({ request, user_id: userData.user?.id, page });
	}

	return { myCart, userData };
};

export default function CartPage() {
	const { myCart, userData } = useLoaderData<typeof loader>();
	const navigation = useNavigation();
	const revalidator = useRevalidator();
	const isLoading = navigation.state !== "idle";
	const [searchParams, setSearchParams] = useSearchParams();
	const [deletedItem, setDeletedItem] = useState<{ id: number | null; isDeleting: boolean }>({
		id: null,
		isDeleting: false,
	});
	const [isClearingCart, setIsClearingCart] = useState(false);

	if (isLoading) {
		return (
			<>
				<MetaDetails
					metaTitle="My Cart | WanderNest"
					metaDescription="Review and manage the tours you've added to your cart"
					metaKeywords="cart, booking, tours, WanderNest"
				/>
				<div className="flex items-center justify-center min-h-[60vh]">
					<Loader2 className="h-12 w-12 animate-spin text-primary" />
				</div>
			</>
		);
	}

	if (!userData?.user) {
		return (
			<>
				<MetaDetails
					metaTitle="My Cart | WanderNest"
					metaDescription="Review and manage the tours you've added to your cart"
					metaKeywords="cart, booking, tours, WanderNest"
				/>
				<div className="min-h-[60vh] flex flex-col items-center justify-center py-20 px-4 text-center space-y-8">
					<div className="relative">
						<div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl -z-10" />
						<div className="bg-linear-to-br from-primary/10 to-primary/5 p-4 rounded-full border border-primary/20 shadow-sm">
							<ShoppingCart className="h-10 w-10 text-primary/80" strokeWidth={1.3} />
						</div>
					</div>

					{/* Heading */}
					<div className="space-y-3 max-w-md">
						<h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
							Your Cart is Waiting
						</h2>
						<p className="text-lg text-muted-foreground leading-relaxed">
							Login to view or add tours to your cart — your dream adventure is just a few
							clicks away.
						</p>
					</div>

					{/* Action buttons */}
					<div className="flex flex-col sm:flex-row gap-4 mt-6">
						<Link to="/tours" viewTransition prefetch="intent">
							<Button size="lg" variant="outline" className="min-w-45">
								Browse Tours
							</Button>
						</Link>
						<Link to="/login" viewTransition prefetch="intent">
							<Button size="lg" className="min-w-45 group gap-2">
								Log In
								<ArrowRight className="h-4 w-4 group-hover:transform group-hover:translate-x-1 transition ease-in-out duration-150" />
							</Button>
						</Link>
					</div>

					{/* Optional trust signals / small text */}
					<div className="mt-10 text-sm text-muted-foreground/80 space-y-2">
						<p>Secure checkout • No account needed to browse</p>
						<p className="text-xs">
							Thousands of happy travelers have already booked unforgettable experiences with us
						</p>
					</div>
				</div>
			</>
		);
	}

	if (!myCart?.success || !myCart?.cart_id || myCart?.total_items === 0) {
		return (
			<>
				<MetaDetails
					metaTitle="My Cart | WanderNest"
					metaDescription="Review and manage the tours you've added to your cart"
					metaKeywords="cart, booking, tours, WanderNest"
				/>
				<div className="py-20 flex flex-col items-center justify-center space-y-4 px-4 text-center">
					<div className="relative">
						<div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl -z-10" />
						<div className="bg-linear-to-br from-primary/10 to-primary/5 p-4 rounded-full border border-muted-foreground/20 shadow-sm">
							<ShoppingCart className="h-10 w-10 text-muted-foreground/80" strokeWidth={1.3} />
						</div>
					</div>
					<h2 className="text-2xl font-semibold">Your cart is empty</h2>
					<p className="text-muted-foreground max-w-md mx-auto">
						Looks like you haven't added any tours yet. Start exploring our tours!
					</p>
					<Button asChild size="lg">
						<Link to="/tours">Browse Tours</Link>
					</Button>
				</div>
			</>
		);
	}

	const subtotal = myCart.items.reduce((sum, item) => {
		const itemTotal = item.quantities.reduce((acc, q) => {
			return acc + q.quantity * (q?.price ?? 0);
		}, 0);
		return sum + itemTotal;
	}, 0);

	function loadMoreItems() {
		const page = Number(searchParams.get("page")) || 1;
		setSearchParams({ page: (page + 1).toString() }, { replace: true, preventScrollReset: true });
	}

	async function removeItem(cart_item_id: number) {
		setDeletedItem({ id: cart_item_id, isDeleting: true });
		if (userData.user == null || userData.error) {
			toast.error("User not found", {
				description: "Please login to add to cart.",
			});
			return;
		}

		try {
			const res = await fetch(`/remove-from-cart/${cart_item_id}/${userData.user?.id}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			});

			const json = await res.json();

			if (json.success) {
				toast.success("Removed from cart successfully!");
			} else {
				toast.error(json.error || "Failed to remove from cart");
			}
		} catch (error) {
			toast.error("Failed to remove from cart");
			console.error(error);
		} finally {
			setDeletedItem({ id: null, isDeleting: false });
			revalidator.revalidate();
		}
	}

	async function clearCart() {
		if (userData.user == null || userData.error) {
			toast.error("User not found", {
				description: "Please login first to use cart.",
			});
			return;
		}

		setIsClearingCart(true);

		try {
			const res = await fetch(`/clear-cart/${userData.user?.id}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			});

			const json = await res.json();

			if (json.success) {
				toast.success("Cart cleared successfully!");
			} else {
				toast.error(json.error || "Failed to clear cart");
			}
		} catch (error) {
			toast.error("Failed to clear cart");
		} finally {
			setIsClearingCart(false);
			revalidator.revalidate();
		}
	}

	return (
		<>
			<MetaDetails
				metaTitle="My Cart | WanderNest"
				metaDescription="Review and manage the tours you've added to your cart"
				metaKeywords="cart, booking, tours, WanderNest"
			/>

			<section className="space-y-8 pt-5 pb-20">
				<div className="flex flex-wrap gap-4 justify-between items-center">
					<h1 className="section-heading">My Cart ({myCart.total_items})</h1>

					<div className="flex gap-3">
						<Button variant="outline" size="sm" className="gap-2" onClick={clearCart}>
							{isClearingCart ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Trash2 className="h-4 w-4" />
							)}
							Clear Cart
						</Button>
					</div>
				</div>

				<div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
					{/* Cart Items */}
					<div className="space-y-4">
						{myCart.items.map((item) => (
							<Card key={item.cart_item_id} className="overflow-hidden">
								<CardHeader className="bg-muted/40 py-3">
									<CardTitle className="flex flex-col gap-2">
										<span>{item.tour_name}</span>
										<Badge variant="outline">{item.tour_option_name}</Badge>
									</CardTitle>
								</CardHeader>

								<CardContent className="pt-4 space-y-4">
									<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
										<div className="flex items-center gap-2 text-sm text-muted-foreground">
											<Calendar className="h-4 w-4" />
											<span>{format(new Date(item.preferred_date!), "PPP")}</span>
											<span>•</span>
											<span>{item.preferred_timeslot}</span>
										</div>
										<Button
											variant="ghost"
											size="sm"
											className="text-destructive hover:text-destructive/90"
											onClick={() => removeItem(item.cart_item_id)}
										>
											{deletedItem.id === item.cart_item_id &&
											deletedItem.isDeleting ? (
												<Loader2 className="h-4 w-4 animate-spin" />
											) : (
												<Trash2 className="h-4 w-4" />
											)}
											<p>Remove</p>
										</Button>
									</div>

									<Separator />

									<div className="space-y-2">
										<p className="text-sm font-medium">Participants:</p>
										<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
											{item.quantities.map((q) => (
												<div
													key={q.participant_type_id}
													className="text-sm bg-muted/50 rounded px-3 py-1.5"
												>
													{q.participant_type_name ||
														`Type ${q.participant_type_id}`}
													{" ("}
													{q.participant_age_group}
													{")"}
													{"  x"}
													<span className="font-medium">{q.quantity}</span>
												</div>
											))}
										</div>
									</div>
								</CardContent>
							</Card>
						))}
						<div className="mt-4 w-full flex items-center justify-center">
							{myCart.pagination.hasMore && (
								<Button type="submit" size="lg" className="gap-2" onClick={loadMoreItems}>
									{isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
									Load More
								</Button>
							)}
						</div>
					</div>

					{/* Summary */}
					<div className="space-y-6">
						<Card className="sticky top-20">
							<CardHeader>
								<CardTitle>Cart Summary</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex justify-between font-medium text-lg">
									<span>Sub Total</span>
									<span>AED {subtotal.toFixed(2)}</span>
								</div>

								<Button className="w-full gap-2 group" size="lg" asChild>
									<Link to="/booking" viewTransition prefetch="viewport">
										Proceed to Checkout
										<ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition duration-200" />
									</Link>
								</Button>

								<p className="text-xs text-center text-muted-foreground">
									Prices and discounts are final at checkout and taxes may apply.
								</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>
		</>
	);
}
