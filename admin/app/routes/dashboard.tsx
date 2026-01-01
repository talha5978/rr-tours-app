import { useRouteLoaderData } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

export default function Home() {
	const rootLoaderData = useRouteLoaderData("root");
	// console.log(rootLoaderData);

	return (
		<>
			<h1 className="text-5xl font-bold">Welcome {rootLoaderData?.user?.last_name ?? "User"}!</h1>
			<Input placeholder="Search..." className="max-w-md mt-4" />
			<div className="my-4 w-fit">
				<Button
					onClick={() => {
						toast.success("This is a success toast!");
					}}
				>
					Push
				</Button>
			</div>
		</>
	);
}
