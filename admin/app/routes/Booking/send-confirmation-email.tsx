import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/components/ui/form";
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
import { queryClient } from "@workspace/shared/utils/query-client";
import { getBookingForConfirmation } from "~/queries/bookings.q";
import { BookingConfirmationPayload } from "@workspace/shared/types/emails";
import { useEffect } from "react";
import { toast } from "sonner";
import type { ActionResponse } from "@workspace/shared/types/action-data";
import { emailService } from "@workspace/shared/services/emails.service";

const fileToBase64 = (file: File): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => resolve((reader.result as string).split(",")[1]); // remove data:url prefix
		reader.onerror = (error) => reject(error);
	});

const MAX_SIZE = 35 * 1024 * 1024;

const emailSchema = z.object({
	customer_name: z.string(),
	customer_email: z.string().email(),
	confirmed_timeslot: z
		.string({ required_error: "Confirmed timeslot is required" })
		.min(1, "Confirmed timeslot is required")
		.refine((value) => value.trim().length > 0, {
			message: "Confirmed timeslot is required",
		}),
	confirmed_date: z
		.string({ required_error: "Confirmed date is required" })
		.min(1, "Confirmed date is required")
		.refine((value) => value.trim().length > 0, {
			message: "Confirmed date is required",
		}),
	tour_name: z.string(),
	tour_option_name: z.string(),
	total_amount: z.string(),
	number_of_participants: z.string(),
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

	const data = await queryClient.fetchQuery(getBookingForConfirmation({ id: booking_id, request }));
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
			confirmed_timeslot: loaderData.booking?.confirmed_timeslot ?? "",
			confirmed_date: loaderData.booking?.confirmed_date ?? "",
			tour_name: loaderData.booking?.tour_name ?? "",
			tour_option_name: loaderData.booking?.tour_option_name ?? "",
			total_amount: loaderData.booking?.total_amount ?? "",
			number_of_participants: loaderData.booking?.number_of_participants.toString() ?? "N/A",
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

			// Build final payload
			const payload: BookingConfirmationPayload = {
				booking_ref: loaderData.booking?.booking_ref ?? "N/A",
				customer_name: data.customer_name,
				customer_email: data.customer_email,
				customer_phone: loaderData.booking?.customer_phone ?? "",
				confirmed_timeslot: data.confirmed_timeslot,
				confirmed_date: data.confirmed_date,
				tour_name: data.tour_name,
				tour_option_name: data.tour_option_name || undefined,
				total_amount: Number(data.total_amount) || 0,
				number_of_participants: Number(data.number_of_participants) || 0,
				meeting_point: data.meeting_point || undefined,
				important_notes: data.important_notes || undefined,
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
			<DialogContent className="overflow-y-auto max-h-[80vh]">
				<DialogHeader className="max-sm:mt-6">
					<DialogTitle>
						Send Confirmation Email #{loaderData.booking?.booking_ref ?? "N/A"}
					</DialogTitle>
					<DialogDescription>
						Add tickets, vouchers and other details and send a confirmation email.
					</DialogDescription>
				</DialogHeader>

				{loaderData.booking == null && loaderData.error != null ? (
					<div className="p-4 bg-warning/40 border-2 rounded-lg border-warning">
						<p>{loaderData.error?.message ?? "Unknown error"}</p>
					</div>
				) : (
					<Form {...form}>
						<form
							method="POST"
							className="space-y-4"
							onSubmit={handleSubmit(handleFormSubmittion)}
						>
							<div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
								<FormField
									control={control}
									name="customer_name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Customer Name</FormLabel>
											<FormControl>
												<Input
													placeholder="Name"
													disabled
													min={1}
													type="text"
													{...field}
												/>
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
												<Input
													placeholder="Email"
													disabled
													min={1}
													type="email"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<FormField
								control={control}
								name="tour_name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Selected Tour</FormLabel>
										<FormControl>
											<Input placeholder="Tour" min={1} disabled {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={control}
								name="tour_option_name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Selected Option</FormLabel>
										<FormControl>
											<Input placeholder="Option" min={1} disabled {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
								<FormField
									control={control}
									name="confirmed_date"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Confirmed Date</FormLabel>
											<FormControl>
												<Input placeholder="Confirmed Date" min={1} {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={control}
									name="confirmed_timeslot"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Confirmed Timeslot</FormLabel>
											<FormControl>
												<Input placeholder="Confirmed Timeslot" min={1} {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<FormField
								control={control}
								name="important_notes"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Important Notes</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Important Notes"
												className="h-28"
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
								name="meeting_point"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Meeting Point</FormLabel>
										<FormControl>
											<Input
												placeholder="Meeting Point"
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
														className={`cursor-pointer hover:border-primary transition-colors duration-150 ease-in`}
														onChange={handleFilesChange}
														{...field}
														value={undefined}
														disabled={selectedFiles.length >= 5}
													/>

													{selectedFiles.length > 0 && (
														<div className="border rounded-md p-3 bg-muted/30 space-y-2">
															<p className="text-sm font-medium">
																Selected files ({selectedFiles.length}/5)
															</p>

															{selectedFiles.map((file, index) => (
																<div
																	key={index}
																	className="flex items-center justify-between text-sm bg-background border rounded px-3 py-2"
																>
																	<div className="flex items-center gap-2 truncate flex-1">
																		<span className="text-muted-foreground">
																			📄
																		</span>
																		<span className="truncate max-w-25 sm:max-w-55">
																			{file?.name ?? "File N/A"}
																		</span>
																		<span className="text-xs text-muted-foreground">
																			(
																			{(
																				(file?.size ?? 0) /
																				(1024 * 1024)
																			).toFixed(2)}{" "}
																			MB)
																		</span>
																	</div>
																	<Button
																		type="button"
																		variant="ghost"
																		size="icon"
																		className="h-8 w-8 p-0 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
																		onClick={() => removeFile(index)}
																	>
																		<Trash2 />
																	</Button>
																</div>
															))}

															{/* Total size info */}
															<p className="text-xs text-muted-foreground mt-2">
																Total size: {totalSizeMB} MB{" "}
																{Number(totalSizeMB) > 35
																	? "(exceeds limit)"
																	: "/ 35 MB max"}
															</p>
														</div>
													)}

													{/* Description */}
													<FormDescription>
														Upload up to 5 PDF files. Total size must not exceed
														35MB. These will be attached to the confirmation
														email.
													</FormDescription>
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									);
								}}
							/>

							<div className="mt-2 w-fit ml-auto">
								<Button type="submit" className="w-fit" disabled={isSending}>
									{isSending && <Loader2 className="animate-spin mr-1" />}
									<span>{isSending ? "Sending..." : "Send"}</span>
								</Button>
							</div>
						</form>
					</Form>
				)}
			</DialogContent>
		</Dialog>
	);
}
