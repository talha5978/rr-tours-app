import { Link, NavLink } from "react-router";
import { Menu, Heart } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from "~/components/ui/sheet";
import { Button } from "~/components/ui/button";
import { useFavourites } from "~/utils/favourites.utils";

const NAV_LINKS = [
	{ label: "Home", to: "/" },
	{ label: "All Tours", to: "/tours" },
	{ label: "About", to: "/about" },
	{ label: "Contact Us", to: "/contact-us" },
	{ label: "Track Booking", to: "/track-booking" },
];

export default function Header() {
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
						<SheetContent side="left" className="w-60">
							<SheetHeader className="mt-5">
								<span className="text-lg font-semibold">Top Attractions Dubai</span>
							</SheetHeader>

							<nav className="flex flex-col gap-4 p-4">
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
							</nav>
						</SheetContent>
					</Sheet>
				</div>

				{/* Logo */}
				<Link to="/" viewTransition prefetch="intent">
					<div className="w-36 h-fit ">
						<img src="/logo.png" className="w-36 h-32" />
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

				{/* Right actions */}
				<HeaderFavouriteButton />
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
