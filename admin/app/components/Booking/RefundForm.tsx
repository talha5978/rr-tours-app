import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { useRevalidator } from "react-router";

const refundReasons: Array<{ value: "duplicate" | "fraudulent" | "requested_by_customer"; label: string }> = [
	{ value: "duplicate", label: "Duplicate" },
	{ value: "fraudulent", label: "Fraudulent" },
	{ value: "requested_by_customer", label: "Requested by Customer" },
] as const;

const refundSchema = z.object({
	amount: z.number({ invalid_type_error: "Amount is required" }).positive("Amount must be positive"),
	refund_details: z.string().min(10, "Additional note must be at least 10 characters"),
	reason: z.enum(["duplicate", "fraudulent", "requested_by_customer"], {
		required_error: "Please select a refund reason",
	}),
});

type RefundFormValues = z.infer<typeof refundSchema>;

interface RefundFormProps {
	bookingId: string;
	paidAmount: number;
	onSuccess: () => void;
	onCancel: () => void;
}

export function RefundForm({ bookingId, paidAmount, onSuccess, onCancel }: RefundFormProps) {
	const revalidator = useRevalidator();

	const form = useForm<RefundFormValues>({
		resolver: zodResolver(
			refundSchema.refine((data) => data.amount <= paidAmount, {
				message: `Amount cannot exceed paid amount (${paidAmount.toFixed(2)} AED)`,
				path: ["amount"],
			}),
		),
		defaultValues: {
			amount: paidAmount,
			refund_details: "",
			reason: "requested_by_customer",
		},
	});

	const onSubmit = async (values: RefundFormValues) => {
		try {
			if (values.amount > paidAmount) {
				toast.error("Amount cannot exceed paid amount");
				return;
			}

			const response = await fetch(`/bookings/${bookingId}/refund`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					amount: values.amount,
					reason: values.reason,
					refund_details: values.refund_details.trim(),
				}),
			});

			const data = await response.json();

			if (!data.success) {
				toast.error(data.error || "Refund failed");
				return;
			}

			onSuccess();
		} catch (err: any) {
			toast.error(err.message || "Failed to process refund");
		} finally {
			revalidator.revalidate();
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<FormField
					control={form.control}
					name="amount"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Refund Amount (AED)</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="0.01"
									{...field}
									onChange={(e) => field.onChange(parseFloat(e.target.value))}
									disabled={form.formState.isSubmitting}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="reason"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Refund Reason</FormLabel>
							<Select
								onValueChange={field.onChange}
								defaultValue={field.value}
								disabled={form.formState.isSubmitting}
							>
								<FormControl>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select reason" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{refundReasons.map((r) => (
										<SelectItem key={r.value} value={r.value}>
											{r.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="refund_details"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Note</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Add more details about this refund"
									className="resize-none"
									{...field}
									disabled={form.formState.isSubmitting}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex justify-end gap-3 pt-4">
					<Button
						type="button"
						variant="outline"
						size={"sm"}
						onClick={onCancel}
						disabled={form.formState.isSubmitting}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						variant="destructive"
						size={"sm"}
						disabled={form.formState.isSubmitting}
					>
						{form.formState.isSubmitting ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Processing...
							</>
						) : (
							"Issue Refund"
						)}
					</Button>
				</div>
			</form>
		</Form>
	);
}
