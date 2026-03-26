import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	useActionData,
	useLoaderData,
	useNavigate,
	useNavigation,
	useSubmit,
} from "react-router";
import z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { getBookingForConfirmation } from "~/queries/bookings.q";
import { BookingConfirmationPayload } from "@workspace/shared/types/emails";
import { useEffect } from "react";
import { toast } from "sonner";
import type { ActionResponse } from "@workspace/shared/types/action-data";
import { emailService } from "@workspace/shared/services/emails.service";
import { format } from "date-fns";

const fileToBase64 = (file: File): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => resolve((reader.result as string).split(",")[1]);
		reader.onerror = (error) => reject(error);
	});

const MAX_SIZE = 35 * 1024 * 1024;

const emailSchema = z.object({
	customer_name: z.string(),
	customer_email: z.string().email(),
	meeting_point: z.string().optional().nullable(),
	important_notes: z.string().optional().nullable(),
	attachments: z
		.array(
			z
				.instanceof(File, { message: "Invalid file selected" })
				.refine((file) => file.size <= MAX_SIZE, "Each file must be ≤ 35MB")
				.refine((file) => file.type === "application/pdf", "Only PDF files are allowed"),
		)
		.max(5, "Maximum 5 PDF files allowed")
		.refine(
			(files) => {
				const totalSize = files.reduce((sum, file) => sum + (file?.size ?? 0), 0);
				return totalSize <= MAX_SIZE;
			},
			{ message: "Total size of all files must be ≤ 35MB" },
		)
		.optional()
		.default([]),
});

type emailFormData = z.input<typeof emailSchema>;

export const action = async ({ request }: ActionFunctionArgs) => {
	try {
		const formData = await request.formData();
		let payload = formData.get("payload") as string;
		await emailService.sendBookingConfirmation(JSON.parse(payload));

		return { success: true, error: null };
	} catch (err: any) {
		return {
			success: false,
			error: err instanceof ApiError ? err.message : err.message || "Failed to send email",
		};
	}
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const booking_id = params.booking_id as string;
	if (!booking_id || booking_id === "") {
		throw new ApiError("Booking ID is required", 400, []);
	}

	const data = await getBookingForConfirmation({ id: booking_id, request });
	return data;
};

export default function SendConfirmationEmail() {
	const actionData: ActionResponse = useActionData();
	const loaderData = useLoaderData<typeof loader>();

	const navigation = useNavigation();
	const isSending = navigation.state === "submitting" && navigation.formMethod === "POST";
	const submit = useSubmit();

	const navigate = useNavigate();

	const form = useForm<emailFormData>({
		disabled: isSending,
		resolver: zodResolver(emailSchema),
		mode: "onChange",
		defaultValues: {
			customer_name: loaderData.booking?.customer_name ?? "",
			customer_email: loaderData.booking?.customer_email ?? "",
			meeting_point: "",
			important_notes: "",
			attachments: [],
		},
	});

	const { setError, handleSubmit, control, clearErrors } = form;

	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast.success("Email sent successfully.");
				navigate(-1);
			} else if (actionData.error) {
				toast.error(actionData.error);
			} else if (actionData.validationErrors) {
				toast.error("Invalid form data. Please check your inputs.");
				Object.entries(actionData.validationErrors).forEach(([field, errors]) => {
					setError(field as keyof emailFormData, { message: errors[0] });
				});
			}
		}
	}, [actionData, navigate]);

	const handleFormSubmittion = async (data: emailFormData) => {
		try {
			let attachments: BookingConfirmationPayload["attachments"] = [];

			if (data.attachments && data.attachments.length > 0) {
				const base64Promises = data.attachments.map(async (file) => ({
					filename: file.name,
					content: await fileToBase64(file),
					contentType: file.type || "application/pdf",
				}));

				attachments = await Promise.all(base64Promises);
			}

			// Build final payload with full tours array
			const payload: BookingConfirmationPayload = {
				booking_ref: loaderData.booking?.booking_ref ?? "N/A",
				customer_name: data.customer_name,
				customer_email: data.customer_email,
				customer_phone: loaderData.booking?.customer_phone ?? "",
				meeting_point: data.meeting_point || undefined,
				important_notes: data.important_notes || undefined,
				tours:
					loaderData.booking?.tours?.map((t) => {
						return {
							tour_name: t.tour_name ?? "N/A",
							tour_option_name: t.tour_option_name ?? "N/A",
							preffered_date: t.preffered_date ?? "N/A",
							preffered_timeslot: t.preffered_timeslot ?? "N/A",
							confirmed_date: t.confirmed_date ?? "N/A",
							confirmed_timeslot: t.confirmed_timeslot ?? "N/A",
							participant_count: t.participant_count,
						};
					}) || [],
				subtotal: Number(loaderData.booking?.subtotal) || 0,
				discount: Number(loaderData.booking?.discount) || 0,
				taxes: Number(loaderData.booking?.taxes) || 0,
				total: Number(loaderData.booking?.total) || 0,
				attachments,
			};

			const formData = new FormData();
			formData.append("payload", JSON.stringify(payload));

			submit(formData, {
				method: "POST",
				encType: "multipart/form-data",
			});
		} catch (err) {
			console.error(err);
			toast.error("Error sending email. Please try again.");
		}
	};

	return (
		<Dialog open={true} onOpenChange={() => navigate(-1)}>
			<DialogContent className="overflow-y-auto max-h-[85vh] max-w-3xl">
				<DialogHeader>
					<DialogTitle>
						Send Confirmation Email #{loaderData.booking?.booking_ref ?? "N/A"}
					</DialogTitle>
					<DialogDescription>
						Review all tours and send confirmation with attachments.
					</DialogDescription>
				</DialogHeader>

				{loaderData.booking == null && loaderData.error != null ? (
					<div className="p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive">
						{loaderData.error?.message ?? "Unknown error"}
					</div>
				) : (
					<Form {...form}>
						<form className="space-y-6" onSubmit={handleSubmit(handleFormSubmittion)}>
							{/* Customer Info */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<FormField
									control={control}
									name="customer_name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Customer Name</FormLabel>
											<FormControl>
												<Input disabled {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={control}
									name="customer_email"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Customer Email</FormLabel>
											<FormControl>
												<Input disabled type="email" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* All Tours List */}
							<div className="space-y-4">
								<h3 className="text-sm font-medium">
									Booked Tours ({loaderData.booking?.tours.length || 0})
								</h3>
								<div className="space-y-4">
									{loaderData.booking?.tours.map((tour, idx) => (
										<div key={idx} className="border rounded-lg p-4 bg-muted/30">
											<div className="font-medium">{tour.tour_name}</div>
											{tour.tour_option_name && (
												<div className="text-sm text-muted-foreground mt-0.5">
													{tour.tour_option_name}
												</div>
											)}
											<div className="grid grid-cols-2 gap-4 mt-3 text-sm">
												<div className="grid">
													<span className="text-muted-foreground text-xs mt-1">
														Preferred Date:
													</span>{" "}
													<span>
														{tour.preffered_date
															? format(new Date(tour.preffered_date), "PPP")
															: "N/A"}
													</span>
													<span className="text-muted-foreground text-xs mt-1">
														Preferred Timeslot:
													</span>
													<span>{tour.preffered_timeslot || "N/A"}</span>
												</div>
												<div className="grid">
													<span className="text-muted-foreground text-xs mt-1">
														Confirmed Date:
													</span>{" "}
													<span>
														{tour.confirmed_date
															? format(new Date(tour.confirmed_date), "PPP")
															: "N/A"}
													</span>
													<span className="text-muted-foreground text-xs mt-1">
														Confirmed Timeslot:
													</span>
													<span>{tour.confirmed_timeslot || "N/A"}</span>
												</div>
											</div>
											<div className="mt-3 text-xs text-muted-foreground">
												{tour.participant_count} participants
											</div>
										</div>
									))}
								</div>
							</div>

							{/* Notes & Meeting Point */}
							<FormField
								control={control}
								name="meeting_point"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Meeting Point</FormLabel>
										<FormControl>
											<Input
												placeholder="Meeting point / pickup location"
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={control}
								name="important_notes"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Important Notes</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Any special instructions or notes for the customer..."
												className="h-28 resize-none"
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Attachments */}
							<FormField
								control={control}
								name="attachments"
								render={({ field: { onChange, value = [], ...field } }) => {
									const selectedFiles = value as File[];

									const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
										const newFiles = Array.from(e.target.files || []);
										const updatedFiles = [...selectedFiles, ...newFiles];

										if (updatedFiles.length > 5) {
											setError("attachments", { message: "Maximum 5 files allowed" });
											return;
										}

										const totalSize = updatedFiles.reduce((sum, f) => sum + f.size, 0);
										if (totalSize > 35 * 1024 * 1024) {
											setError("attachments", { message: "Total size exceeds 35MB" });
											return;
										}

										onChange(updatedFiles);
										e.target.value = "";
									};

									const removeFile = (index: number) => {
										const updated = selectedFiles.filter((_, i) => i !== index);
										onChange(updated);
										clearErrors("attachments");
									};

									const totalSizeMB = (
										selectedFiles.reduce((sum, f) => sum + (f?.size ?? 0), 0) /
										(1024 * 1024)
									).toFixed(2);

									return (
										<FormItem>
											<FormLabel>Attachments (PDF tickets/vouchers)</FormLabel>
											<FormControl>
												<div className="space-y-3">
													<Input
														id="attachments"
														type="file"
														accept="application/pdf"
														multiple
														onChange={handleFilesChange}
														disabled={selectedFiles.length >= 5}
														{...field}
														value={undefined}
													/>

													{selectedFiles.length > 0 && (
														<div className="border rounded-md p-3 bg-muted/30 space-y-2">
															{selectedFiles.map((file, index) => (
																<div
																	key={index}
																	className="flex justify-between items-center bg-background border rounded px-3 py-2"
																>
																	<div className="flex items-center gap-2 truncate">
																		<span>📄</span>
																		<span className="truncate">
																			{file.name}
																		</span>
																		<span className="text-xs text-muted-foreground">
																			(
																			{(
																				file.size /
																				(1024 * 1024)
																			).toFixed(2)}{" "}
																			MB)
																		</span>
																	</div>
																	<Button
																		type="button"
																		variant="ghost"
																		size="icon"
																		onClick={() => removeFile(index)}
																	>
																		<Trash2 className="h-4 w-4" />
																	</Button>
																</div>
															))}
															<p className="text-xs text-muted-foreground">
																Total: {totalSizeMB} MB / 35 MB max
															</p>
														</div>
													)}
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									);
								}}
							/>

							<div className="pt-4 flex justify-end">
								<Button type="submit" disabled={isSending} className="min-w-32">
									{isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
									{isSending ? "Sending..." : "Send Confirmation Email"}
								</Button>
							</div>
						</form>
					</Form>
				)}
			</DialogContent>
		</Dialog>
	);
}
