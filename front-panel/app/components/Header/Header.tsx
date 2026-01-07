import { Link, NavLink } from "react-router";
import { Menu, Heart } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from "~/components/ui/sheet";
import { Button } from "~/components/ui/button";

const NAV_LINKS = [
	{ label: "Home", to: "/" },
	{ label: "Tours", to: "/tours" },
	{ label: "Destinations", to: "/destinations" },
	{ label: "About", to: "/about" },
];

export default function Header() {
	return (
		<header className="bg-background">
			<div className="mx-auto flex items-center py-6">
				{/* Mobile menu */}
				<div className="mr-2 flex lg:hidden">
					<Sheet>
						<SheetTrigger asChild>
							<Button variant="ghost" size="icon">
								<Menu className="h-5 w-5" />
							</Button>
						</SheetTrigger>
						<SheetContent side="left" className="w-72">
							<SheetHeader className="mt-5">
								<div className="flex items-center gap-2">
									<div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
										TA
									</div>
									<span className="text-lg font-semibold">Top Attractions Dubai</span>
								</div>
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
				<Link to="/" className="flex items-center gap-2">
					<div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
						TA
					</div>
					<span className="hidden text-lg font-semibold sm:inline">Top Attractions Dubai</span>
				</Link>

				{/* Desktop nav */}
				<nav className="ml-12 hidden items-center gap-6 lg:flex">
					{NAV_LINKS.map((link) => (
						<NavLink
							key={link.to}
							to={link.to}
							className={({ isActive }) =>
								`text-sm ${
									isActive
										? "font-medium text-foreground"
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

				{/* Right actions */}
				<Button variant="ghost" size="icon">
					<Heart className="h-5 w-5" />
				</Button>
			</div>
		</header>
	);
}
