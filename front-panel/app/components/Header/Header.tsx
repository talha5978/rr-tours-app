import { Form, Link, NavLink, useActionData, useNavigation, useRouteLoaderData } from "react-router";
import { Menu, Heart, User, LogIn, LogOutIcon, Loader2, Info, Star, Calendar } from "lucide-react";
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

const NAV_LINKS = [
	{ label: "Home", to: "/" },
	{ label: "All Tours", to: "/tours" },
	{ label: "About", to: "/about" },
	{ label: "Contact Us", to: "/contact-us" },
	{ label: "Track Booking", to: "/track-booking" },
];

export default function Header({ categories }: { categories: FPHighLevelCategory[] }) {
	return (
		<header className="bg-background">
			<div className="mx-auto flex items-center py-0">
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
								<span className="text-lg font-semibold">Top Attractions Dubai</span>
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
										{categories.slice(0, 5).map((category) => (
											<NavLink
												key={category.id}
												to={`/tours?categories=${category.id}`}
												viewTransition
												className="text-sm text-muted-foreground"
												prefetch="intent"
												title={category.name}
											>
												{category.name}
											</NavLink>
										))}
										{categories.length > 5 && (
											<NavLink
												to={`/tours`}
												title="See More"
												prefetch="intent"
												viewTransition
												className="text-sm text-muted-foreground"
											>
												See More
											</NavLink>
										)}
									</div>
								</div>
							</nav>

							<SheetFooter className="space-y-1 border-t-2">
								<h2 className="text-muted-foreground text-sm">Follow Us For More</h2>
								<div className="flex gap-3">
									<Link to={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
										<div>
											<img
												src="https://cdn.iconscout.com/icon/free/png-256/free-instagram-logo-icon-svg-download-png-1583142.png?f=webp&amp;w=128"
												alt="Instagram"
												className="w-8 h-8"
											/>
										</div>
									</Link>
									<Link to={FB_URL} target="_blank" rel="noopener noreferrer">
										<div>
											<img
												src="https://cdn.iconscout.com/icon/free/png-256/free-facebook-logo-icon-svg-download-png-721949.png?f=webp&w=256"
												alt="Facebook"
												className="w-8 h-8 rounded-md"
											/>
										</div>
									</Link>
								</div>
							</SheetFooter>
						</SheetContent>
					</Sheet>
				</div>

				{/* Logo */}
				<Link to="/" viewTransition prefetch="intent">
					<div className="w-36 h-fit ">
						<img src="/logo.png" className="w-36 h-32" alt="Top Attractions Dubai" />
					</div>
				</Link>

				{/* Desktop nav */}
				<nav className="ml-12 hidden items-center gap-6 lg:flex">
					{NAV_LINKS.map((link) => (
						<NavLink
							key={link.to}
							to={link.to}
							className={({ isActive }) =>
								`text-sm hover:underline underline-offset-4 ${
									isActive
										? "font-medium text-foreground"
										: "text-muted-foreground hover:text-foreground"
								} ${isActive ? "underline underline-offset-4" : ""}`
							}
						>
							{link.label}
						</NavLink>
					))}
				</nav>

				{/* Spacer */}
				<div className="flex-1" />

				<div className="flex gap-4 items-center">
					<div className="hidden lg:flex gap-2">
						<Link to={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
							<div>
								<img
									src="https://cdn.iconscout.com/icon/free/png-256/free-instagram-logo-icon-svg-download-png-1583142.png?f=webp&amp;w=128"
									alt="Instagram"
									className="w-8 h-8"
								/>
							</div>
						</Link>
						<Link to={FB_URL} target="_blank" rel="noopener noreferrer">
							<div>
								<img
									src="https://cdn.iconscout.com/icon/free/png-256/free-facebook-logo-icon-svg-download-png-721949.png?f=webp&w=256"
									alt="Facebook"
									className="w-8 h-8 rounded-md"
								/>
							</div>
						</Link>
					</div>
					<HeaderFavouriteButton />
					<UserAccountButton />
				</div>
				{/* Right actions */}
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

function UserAccountButton() {
	const rootLoaderData = useRouteLoaderData<typeof loader>("root");
	const navigation = useNavigation();
	const actionData = useActionData();

	const isLoggingOut =
		navigation.state === "submitting" &&
		navigation.formAction === "/logout" &&
		navigation.formMethod === "POST";

	useEffect(() => {
		if (actionData?.error) {
			toast.error(actionData.error);
		} else if (actionData == undefined && navigation.formAction === "/logout") {
			toast.success("Logged out successfully");
		}
	}, [actionData]);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild tabIndex={0} className="cursor-pointer">
				<Button variant={"outline"} size={"icon"}>
					<User className="w-6 h-6" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
				side={"bottom"}
				align="end"
				sideOffset={4}
			>
				{rootLoaderData?.user && (
					<>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
								<div className="grid flex-1 text-left text-sm gap-1">
									<span className="truncate font-medium">
										👋 Welcome
										{rootLoaderData?.user ? ", " + rootLoaderData.user.last_name : ""}
									</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
					</>
				)}
				<DropdownMenuGroup>
					<Link to={"account-details"} prefetch="intent" viewTransition>
						<DropdownMenuItem>
							<Info />
							Account Details
						</DropdownMenuItem>
					</Link>
					<DropdownMenuItem>
						<Calendar />
						My Bookings
					</DropdownMenuItem>
					<DropdownMenuItem>
						<Star />
						Reviews
					</DropdownMenuItem>
					{!rootLoaderData?.user ? (
						<Link to={"/login"}>
							<DropdownMenuItem>
								<LogIn />
								Login
							</DropdownMenuItem>
						</Link>
					) : (
						<>
							<DropdownMenuSeparator />
							<Form action="/logout" method="POST">
								<button disabled={isLoggingOut} type="submit" className="w-full rounded-sm">
									<DropdownMenuItem variant="destructive" disabled={isLoggingOut}>
										{isLoggingOut ? <Loader2 className="animate-spin" /> : <LogOutIcon />}
										Logout
									</DropdownMenuItem>
								</button>
							</Form>
						</>
					)}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
