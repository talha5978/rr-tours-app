import { SidebarTrigger } from "~/components/ui/sidebar";
import { ThemeToggleButton } from "~/components/Theme/theme-toggle";
// import { UserButton } from "~/components/Nav/nav-user";
// import GlobalSearch from "~/components/Nav/global-search";

export function SiteHeader() {
	return (
		<header className="flex h-(--header-spacing) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-spacing)">
			<div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
				<SidebarTrigger className="-ml-1 cursor-pointer" />
				<div className="ml-auto flex items-center gap-2">
					<ThemeToggleButton />
					{/* <UserButton /> */}
				</div>
			</div>
		</header>
	);
}
