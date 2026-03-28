import { Form, Link, NavLink, useActionData, useNavigation, useRouteLoaderData } from "react-router";
import { Menu, Heart, LogIn, LogOutIcon, Loader2, Info, Star, Calendar, ShoppingCart } from "lucide-react";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTrigger } from "~/components/ui/sheet";
import { Button } from "~/components/ui/button";
import { useFavourites } from "~/utils/favourites.utils";
import { FB_URL, INSTAGRAM_URL } from "@workspace/shared/constants/constants";
import type { FPHighLevelCategory } from "@workspace/shared/types/categories";
import { loader } from "~/root";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useEffect } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import type { GetCartResponse } from "@workspace/shared/types/cart";
import type { FullCurrentUser } from "@workspace/shared/types/user";

const NAV_LINKS = [
	{ label: "Home", to: "/" },
	{ label: "All Tours", to: "/tours" },
	{ label: "About", to: "/about" },
	{ label: "Contact Us", to: "/contact-us" },
	{ label: "FAQs", to: "/faqs" },
	{ label: "Track Booking", to: "/track-booking" },
];

export default function Header({
	categories,
	cart,
}: {
	categories: FPHighLevelCategory[];
	cart: GetCartResponse | null;
}) {
	return (
		<header className="bg-background">
			<div className="mx-auto flex items-center pt-4">
				{/* Mobile menu */}
				<div className="mr-2 flex lg:hidden">
					<Sheet>
						<SheetTrigger asChild>
							<Button variant="ghost" size="icon">
								<Menu className="h-5 w-5" />
							</Button>
						</SheetTrigger>
						<SheetContent side="left" className="w-64 overflow-y-auto">
							<SheetHeader className="mt-5">
								<span className="text-lg font-semibold">WanderNest</span>
							</SheetHeader>

							<nav className="p-4 space-y-4">
								<div className="flex flex-col gap-2">
									{NAV_LINKS.map((link) => (
										<NavLink
											key={link.to}
											to={link.to}
											className={({ isActive }) =>
												`text-sm ${
													isActive
														? "font-medium text-foreground"
														: "text-muted-foreground"
												}`
											}
											viewTransition
											prefetch="viewport"
										>
											{link.label}
										</NavLink>
									))}
								</div>

								<div className="space-y-2">
									<h2 className="text-xs text-muted-foreground font-bold">
										Browse by Category
									</h2>
									<div className="flex flex-col gap-2">
										{categories.map((category) => (
											<NavLink
												key={category.id}
												to={`/tours?categories=${category.id}`}
												viewTransition
												className="text-sm text-muted-foreground"
												prefetch="viewport"
												title={category.name}
											>
												{category.name}
											</NavLink>
										))}
									</div>
								</div>
							</nav>

							<SheetFooter className="space-y-1 border-t-2">
								<h2 className="text-muted-foreground text-sm">Follow Us For More</h2>
								<div className="flex gap-3">
									<Link to={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
										<img
											src="https://cdn.iconscout.com/icon/free/png-256/free-instagram-logo-icon-svg-download-png-1583142.png?f=webp&w=128"
											alt="Instagram"
											className="w-8 h-8"
										/>
									</Link>
									<Link to={FB_URL} target="_blank" rel="noopener noreferrer">
										<img
											src="https://cdn.iconscout.com/icon/free/png-256/free-facebook-logo-icon-svg-download-png-721949.png?f=webp&w=256"
											alt="Facebook"
											className="w-8 h-8 rounded-md"
										/>
									</Link>
								</div>
							</SheetFooter>
						</SheetContent>
					</Sheet>
				</div>

				{/* Logo */}
				<Link to="/" viewTransition prefetch="intent">
					<div className="w-32 h-fit">
						<img src="/logo.png" className="w-32 h-fit" alt="WanderNest" />
					</div>
				</Link>

				{/* Desktop nav */}
				<nav className="ml-12 hidden items-center gap-6 lg:flex">
					{NAV_LINKS.map((link) => (
						<NavLink
							viewTransition
							prefetch="viewport"
							key={link.to}
							to={link.to}
							className={({ isActive }) =>
								`text-sm flex items-center gap-1.5 hover:underline underline-offset-4 ${
									isActive
										? "font-medium text-foreground underline underline-offset-4"
										: "text-muted-foreground hover:text-foreground"
								}`
							}
						>
							{link.label}
						</NavLink>
					))}
				</nav>

				{/* Spacer */}
				<div className="flex-1" />

				<div className="flex gap-4 items-center">
					<HeaderFavouriteButton />
					<HeaderCartButton cart={cart} />
					<UserAccountButton />
				</div>
			</div>
		</header>
	);
}

function HeaderFavouriteButton() {
	const { count } = useFavourites();

	return (
		<Link to={"my-favourites"} viewTransition prefetch="intent">
			<Button
				variant="ghost"
				size="icon"
				className={`${count > 0 ? "bg-destructive/20" : ""} relative`}
			>
				<Heart className={`h-4 w-4 ${count > 0 ? "text-destructive fill-destructive" : ""}`} />
				{count > 0 && (
					<span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-medium">
						{count}
					</span>
				)}
			</Button>
		</Link>
	);
}

function HeaderCartButton({ cart }: { cart: GetCartResponse | null }) {
	const cartCount = cart == null ? 0 : cart.total_items;

	return (
		<Link to="/cart" viewTransition prefetch="intent">
			<Button
				variant="ghost"
				size="icon"
				className={`${cartCount > 0 ? "bg-primary/10" : ""} relative`}
			>
				<ShoppingCart className="h-5 w-5" />
				{cartCount > 0 && (
					<span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-medium">
						{cartCount}
					</span>
				)}
			</Button>
		</Link>
	);
}

function UserAccountButton() {
	const rootLoaderData = useRouteLoaderData<typeof loader>("root");
	const navigation = useNavigation();
	const actionData = useActionData();
	const user = rootLoaderData?.user as FullCurrentUser | null;

	const isLoggingOut =
		navigation.state === "submitting" &&
		navigation.formAction === "/logout" &&
		navigation.formMethod === "POST";

	useEffect(() => {
		if (actionData?.error) {
			toast.error(actionData.error);
		}
	}, [actionData, navigation.formAction]);

	if (!user) {
		return (
			<Link to="/login" prefetch="intent" viewTransition>
				<Button size="sm">
					<LogIn className="mr-2 h-4 w-4" />
					Login
				</Button>
			</Link>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild tabIndex={0} className="cursor-pointer">
				<Avatar className="h-9 w-9 border-2 border-background ring-1 ring-muted/40 select-none">
					<AvatarImage src={user.avatar_url ?? undefined} alt={user.first_name ?? "User"} />
					<AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
						{user.first_name?.charAt(0) ?? "U"}
						{user.last_name?.charAt(0) ?? ""}
					</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
				side="bottom"
				align="end"
				sideOffset={4}
			>
				<DropdownMenuLabel className="p-0 font-normal">
					<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
						<div className="grid flex-1 text-left text-sm gap-1">
							<span className="truncate font-medium">
								👋 Welcome{user ? ", " + user.last_name : ""}
							</span>
						</div>
					</div>
				</DropdownMenuLabel>

				<DropdownMenuSeparator />

				<DropdownMenuGroup>
					<Link to="/account/details" prefetch="intent" viewTransition>
						<DropdownMenuItem>
							<Info />
							Account Details
						</DropdownMenuItem>
					</Link>

					<Link to="/account/bookings" prefetch="intent" viewTransition>
						<DropdownMenuItem>
							<Calendar />
							My Bookings
						</DropdownMenuItem>
					</Link>

					<Link to="/account/reviews" prefetch="intent" viewTransition>
						<DropdownMenuItem>
							<Star />
							Reviews
						</DropdownMenuItem>
					</Link>

					<DropdownMenuSeparator />

					<Form action="/logout" method="POST">
						<button disabled={isLoggingOut} type="submit" className="w-full rounded-sm">
							<DropdownMenuItem variant="destructive" disabled={isLoggingOut}>
								{isLoggingOut ? <Loader2 className="animate-spin" /> : <LogOutIcon />}
								Logout
							</DropdownMenuItem>
						</button>
					</Form>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
