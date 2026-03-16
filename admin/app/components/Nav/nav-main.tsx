import { memo } from "react";
import { NavLink, useLocation, useResolvedPath } from "react-router";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubItem,
} from "~/components/ui/sidebar";
import type { NavSubItem } from "~/types/nav";
import { mainNavItems } from "~/constants/nav";

const SubItem = memo(({ url, icon, title }: NavSubItem) => {
	const location = useLocation();
	const resolved = useResolvedPath(url);

	const isActive = location.pathname === resolved.pathname;

	return (
		<SidebarMenuSubItem key={title} className={isActive ? "pointer-events-none" : ""}>
			<SidebarMenuButton tooltip={title} asChild>
				<NavLink
					to={url}
					className={isActive ? "bg-sidebar-accent" : ""}
					prefetch="viewport"
					viewTransition
				>
					{icon && <>{icon}</>}
					<span className="my-auto">{title}</span>
				</NavLink>
			</SidebarMenuButton>
		</SidebarMenuSubItem>
	);
});

export function NavMain() {
	return (
		<SidebarGroup>
			<SidebarGroupContent className="flex flex-col gap-2">
				<SidebarMenu>
					{mainNavItems.map((item) => (
						<SidebarMenuItem key={item.title}>
							<span className="font-medium text-muted-foreground">{item.title}</span>
							<SidebarMenuSub className="mt-1">
								{Array.isArray(item.items) &&
									item.items?.map((subItem, index) => (
										<SubItem
											key={(subItem.title + index).toString()}
											url={subItem.url}
											icon={subItem.icon}
											title={subItem.title}
										/>
									))}
							</SidebarMenuSub>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
