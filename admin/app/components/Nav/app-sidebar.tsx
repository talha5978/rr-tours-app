import { ComponentProps } from "react";
import { NavMain } from "~/components/Nav/nav-main";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuItem,
} from "~/components/ui/sidebar";
import { Link } from "react-router";
import LogoutButton from "~/components/Auth/logout-button";

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar collapsible="offcanvas" {...props}>
			<SidebarHeader className="mb-2">
				<SidebarMenu>
					<SidebarMenuItem className="px-1">
						<Link to="/" viewTransition prefetch="viewport">
							<div className="w-25 h-fit">
								<img src="/logo.png" className="w-25 h-fit" alt="WanderNest" />
							</div>
						</Link>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain />
			</SidebarContent>
			<SidebarFooter className="mt-6">
				<LogoutButton />
			</SidebarFooter>
		</Sidebar>
	);
}
