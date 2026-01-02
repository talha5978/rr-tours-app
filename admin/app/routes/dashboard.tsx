import { useRouteLoaderData } from "react-router";

export default function Home() {
	const rootLoaderData = useRouteLoaderData("root");

	return (
		<>
			<h1 className="text-5xl font-bold">Welcome {rootLoaderData?.user?.last_name ?? "Admin"}!</h1>
		</>
	);
}
