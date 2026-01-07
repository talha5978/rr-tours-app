import { Outlet } from "react-router";
import Footer from "~/components/Footer/Footer";
import Header from "~/components/Header/Header";

export default function AppLayout() {
	return (
		<div className="max-container space-y-8">
			<Header />
			<main>
				<Outlet />
			</main>
			<Footer />
		</div>
	);
}
