import { IconTableExport } from "@tabler/icons-react";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import * as XLSX from "xlsx";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const schema = z
	.object({
		startDate: z.string().min(1, "Start date is required"),
		endDate: z.string().min(1, "End date is required"),
	})
	.refine((data) => data.startDate <= data.endDate, {
		message: "Start date must be before end date",
		path: ["endDate"],
	});

type FormData = z.infer<typeof schema>;

export default function ExportBookingsButton() {
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm<FormData>({
		resolver: zodResolver(schema),
		defaultValues: {
			startDate: "",
			endDate: "",
		},
	});

	const onSubmit = async (data: FormData) => {
		setIsLoading(true);
		try {
			const response = await fetch("/get-export-bookings-data", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				throw new Error(response.statusText || "Failed to fetch bookings data");
			}

			const jsonResp = await response.json();
			const excelData = jsonResp.sheetData as any[];
			console.log("Data received: ", excelData);

			if (excelData.length === 0) {
				throw new Error("No data to export. Please try again.");
			}

			const worksheet = XLSX.utils.json_to_sheet(excelData);
			const workbook = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(workbook, worksheet, `${data.startDate} - ${data.endDate}`);

			const fileName = `report_${data.startDate}_to_${data.endDate}.xlsx`;
			XLSX.writeFile(workbook, fileName);
		} catch (error) {
			console.error(error);
			toast.error(
				error instanceof Error ? error.message : "Failed to export bookings. Please try again.",
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant={"outline"}>
					<IconTableExport />
					<p>Export</p>
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Export Bookings</DialogTitle>
				</DialogHeader>

				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="startDate">Start Date</Label>
							<Input
								id="startDate"
								type="date"
								{...form.register("startDate")}
								disabled={isLoading}
							/>
							{form.formState.errors.startDate && (
								<p className="text-sm text-red-500">
									{form.formState.errors.startDate.message}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="endDate">End Date</Label>
							<Input
								id="endDate"
								type="date"
								{...form.register("endDate")}
								disabled={isLoading}
							/>
							{form.formState.errors.endDate && (
								<p className="text-sm text-red-500">
									{form.formState.errors.endDate.message}
								</p>
							)}
						</div>
					</div>

					<Button type="submit" className="w-full" disabled={isLoading}>
						{isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
						{isLoading ? "Generating Excel..." : "Download Excel (.xlsx)"}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}
