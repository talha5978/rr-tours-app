import { SiteHeader } from "~/components/Nav/site-header";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { useIsMobile } from "~/hooks/use-mobile";
import { AlertCircle } from "lucide-react";
import { AppSidebar } from "~/components/Nav/app-sidebar";

const WarningBarForMobile = () => {
	const isMobile = useIsMobile();

	if (isMobile) {
		return (
			<div className="z-50 w-full bg-destructive px-4 py-3 text-center text-sm font-medium text-white">
				<div className="flex items-center justify-center gap-2 max-[435px]:flex-col">
					<span>
						<AlertCircle className="h-4 w-4" />
					</span>
					<span>Please switch to larger screen for a better experience</span>
				</div>
			</div>
		);
	}
};

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider
			style={
				{
					"--sidebar-width": "calc(var(--spacing) * 72)",
					"--header-height": "calc(var(--spacing) * 12)",
				} as React.CSSProperties
			}
		>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<SiteHeader />
				<section className="flex flex-1 flex-col @container/main p-4">{children}</section>
				<WarningBarForMobile />
			</SidebarInset>
		</SidebarProvider>
	);
}
