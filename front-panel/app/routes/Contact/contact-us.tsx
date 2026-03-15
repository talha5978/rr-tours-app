import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { BriefcaseBusinessIcon, Clock8Icon, Loader2, MapPinIcon, PhoneIcon } from "lucide-react";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { CONTACT_NUMBER_1 } from "@workspace/shared/constants/constants";
import { Separator } from "~/components/ui/separator";
import { Button } from "~/components/ui/button";
import { GoogleReCaptcha, verifyRecaptcha } from "~/components/ReCaptcha/GoogleReCaptcha";
import { ActionResponse } from "@workspace/shared/types/action-data";
import { type ActionFunctionArgs, useActionData, useNavigate, useNavigation, useSubmit } from "react-router";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { contactFormData, contactSchema } from "@workspace/shared/schemas/contact.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { emailService } from "@workspace/shared/services/emails.service";

const contactInfo = [
	{
		title: "Office Hours",
		icon: Clock8Icon,
		description: "Monday-Friday\n8:00 am to 11:00 pm",
	},
	{
		title: "Our Address",
		icon: MapPinIcon,
		description: "802 ABC Rd,Dubai\n96812, UAE",
	},
	{
		title: "Office 2",
		icon: BriefcaseBusinessIcon,
		description: "N/A",
	},
	{
		title: "Get in Touch",
		icon: PhoneIcon,
		description: "+" + CONTACT_NUMBER_1,
	},
];

export const action = async ({ request }: ActionFunctionArgs) => {
	try {
		const formData = await request.formData();

		const recaptchaToken = formData.get("recaptchaToken") as string;

		if (!recaptchaToken || recaptchaToken == "") {
			return {
				success: false,
				error: "Captcha identification failed",
			};
		}

		const captchaResult = await verifyRecaptcha(recaptchaToken);

		if (!captchaResult.success) {
			return {
				success: false,
				error: "Captcha verification failed",
			};
		}

		const data = {
			full_name: formData.get("full_name") as string,
			email: formData.get("email") as string,
			subject: formData.get("subject") as string,
			message: formData.get("message") as string,
		};

		const parseResult = contactSchema.safeParse(data);

		if (!parseResult.success) {
			const firstError = Object.values(parseResult.error.flatten().fieldErrors).flat()[0]!;
			return { success: false, error: firstError };
		}

		await emailService.sendInquiry(data);

		return { success: true };
	} catch (error: any) {
		const errorMessage =
			error instanceof ApiError ? error.message : error.message || "Failed to process request";
		return {
			success: false,
			error: errorMessage,
		};
	}
};

export const loader = () => {
	return null;
};

export default function ContactUs() {
	return (
		<>
			<MetaDetails
				metaTitle="Contact Us | WanderNest"
				metaDescription="We're here to help you with any questions or concerns you may have. Don't hesitate to reach out to us!"
				metaKeywords="WanderNest, Contact"
				ogType="article"
				ogUrl={`${process.env.VITE_MAIN_APP_URL}/contact-us`}
				canonicalUrl={`${process.env.VITE_MAIN_APP_URL}/contact-us`}
				ogImage="/contact-us.jpg"
			/>
			<section className="py-8 sm:py-16">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					{/* Header */}
					<div className="relative mx-auto mb-12 w-fit sm:mb-16 lg:mb-24">
						<h2 className="text-2xl font-semibold md:text-3xl lg:text-4xl">Contact Us</h2>
					</div>

					<div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1fr]">
						<div className="space-y-8">
							<div className="space-y-4">
								<h3 className="text-2xl font-semibold">Happy to help you!</h3>
								<p className="text-muted-foreground text-lg font-medium">
									We&apos;re here to help you with any questions or concerns you may have.
									Don&apos;t hesitate to reach out to us! Have a question about tours,
									bookings, or anything else?
								</p>
							</div>

							{/* Contact Info Grid */}
							<div className="grid gap-4 sm:grid-cols-2">
								{contactInfo.map((info, index) => (
									<Card key={index}>
										<CardContent className="flex flex-col items-center gap-2 text-center">
											<Avatar className="size-9 border">
												<AvatarFallback className="bg-transparent [&>svg]:size-5">
													<info.icon />
												</AvatarFallback>
											</Avatar>
											<div className="space-y-3">
												<h4 className="text-lg font-semibold">{info.title}</h4>
												<div className="text-muted-foreground text-base font-medium">
													{info.description.split("\n").map((line, idx) => (
														<p key={idx}>{line}</p>
													))}
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						</div>
						<InquiryForm />
					</div>
				</div>
			</section>
		</>
	);
}

const InquiryForm = () => {
	const actionData: ActionResponse = useActionData();

	const submit = useSubmit();
	const navigation = useNavigation();
	const navigate = useNavigate();
	const recaptchaRef = useRef(null);

	const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

	const isSending = navigation.state === "submitting" && navigation.formMethod === "POST";

	const form = useForm<contactFormData>({
		disabled: isSending,
		resolver: zodResolver(contactSchema),
		mode: "onChange",
		defaultValues: {
			email: "",
			full_name: "",
			message: "",
			subject: "",
		},
	});

	const { setError, handleSubmit, control, reset } = form;

	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast.success("Your message has been sent successfully. We will get back to you soon.");
				setRecaptchaToken(null);
				reset();
				if (recaptchaRef.current !== null) {
					// @ts-ignore
					recaptchaRef.current.reset();
				}
			} else if (actionData.error) {
				toast.error(actionData.error);
				setRecaptchaToken(null);
				reset();
				if (recaptchaRef.current !== null) {
					// @ts-ignore
					recaptchaRef.current.reset();
				}
			} else if (actionData.validationErrors) {
				toast.error("Invalid form data. Please check your inputs.");
				Object.entries(actionData.validationErrors).forEach(([field, errors]) => {
					setError(field as keyof contactFormData, { message: errors[0] });
				});
			}
		}
	}, [actionData, navigate]);

	const handleFormSubmittion = (data: contactFormData) => {
		if (!recaptchaToken || recaptchaToken == "") {
			toast.error("Invalid Captcha", {
				description: "Try again later",
			});
			return;
		}

		const formData = new FormData();
		formData.append("email", data.email.trim());
		formData.append("full_name", data.full_name.trim());
		formData.append("subject", data.subject.trim());
		formData.append("message", data.message.trim());
		formData.append("recaptchaToken", recaptchaToken ?? "");
		submit(formData, { method: "POST", action: "/contact-us" });
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg font-semibold">Inquire</CardTitle>
				<CardDescription>
					If your have any doubts or queries you may send us a message here.
				</CardDescription>
			</CardHeader>
			<Separator />
			<CardContent>
				<Form {...form}>
					<form method="POST" className="space-y-4" onSubmit={handleSubmit(handleFormSubmittion)}>
						<div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
							<FormField
								control={control}
								name="full_name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Full Name</FormLabel>
										<FormControl>
											<Input placeholder="John Doe" min={1} type="text" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input
												placeholder="johndoe@gmail.com"
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
							name="subject"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Subject</FormLabel>
									<FormControl>
										<Input placeholder="Subject" min={1} type="text" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={control}
							name="message"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Message</FormLabel>
									<FormControl>
										<Textarea placeholder="Message" className="h-32" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<GoogleReCaptcha
							siteKey={process.env.VITE_RECAPTCHA_SITE_KEY as string}
							onChange={(token) => setRecaptchaToken(token)}
							ref={recaptchaRef}
						/>

						<Button type="submit" className="w-full" disabled={isSending || !recaptchaToken}>
							{isSending && <Loader2 className="animate-spin mr-1" />}
							<span>Send</span>
						</Button>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
};
