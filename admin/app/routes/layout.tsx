import { Outlet } from "react-router";
import SidebarLayout from "~/components/Nav/nav-layout";

export default function LayoutRoute() {
	return (
		<SidebarLayout>
			<Outlet />
		</SidebarLayout>
	);
}
