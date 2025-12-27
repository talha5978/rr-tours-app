import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

export default function Home() {
	return (
		<>
			<h1 className="text-5xl font-bold">Dashboard</h1>
			<Input placeholder="Search..." className="max-w-md mt-4" />
			<div className="my-4 w-fit">
				<Button onClick={() => {
					toast.success("This is a success toast!");
				}}>Push</Button>
			</div>
		</>
	);
}
