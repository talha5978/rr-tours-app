import { useRouteLoaderData, useActionData, useSubmit, useNavigation, useLoaderData } from "react-router";
import { loader as rootLoader } from "~/root";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { PhoneInput } from "~/components/Booking/phone-number-input";
import { countries } from "country-data-list";
import { ProfileUpdateForm, profileUpdateSchema } from "@workspace/shared/schemas/profile-update.schema";
import { AuthService } from "@workspace/shared/services/auth.service";
import { genAuthSecurity } from "@workspace/shared/utils/auth-utils.server";
import { getCurrentUser } from "@workspace/shared/queries/auth.q";
import { cacheService } from "@workspace/shared/services/cache.service";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";
import type { FullCurrentUser } from "@workspace/shared/types/user";

export async function action({ request }: any) {
	try {
		const formData = await request.formData();
		const first_name = formData.get("first_name")?.toString().trim();
		const last_name = formData.get("last_name")?.toString().trim();
		const phone_number = formData.get("phone_number")?.toString().trim() || null;
		const country = formData.get("country")?.toString().trim() || null;

		const { authId } = genAuthSecurity(request);
		if (!authId) {
			return { success: false, error: "Unauthorized" };
		}

		const user = await getCurrentUser(request);

		if (user.error || user.user == null) {
			return { success: false, error: "User not found" };
		}

		const authSvc = new AuthService(request);
		await authSvc.updateUserProfile({
			first_name,
			last_name,
			phone_number,
			country,
			user_id: user.user.id,
		});

		await cacheService.invalidate(CACHE_KEYS.auth.session("FP", authId));

		return { success: true, error: null };
	} catch (err: any) {
		return { success: false, error: err.message || "Failed to update profile" };
	}
}

export interface Country {
	alpha2: string;
	alpha3: string;
	countryCallingCodes: string[];
	currencies: string[];
	emoji?: string;
	ioc: string;
	languages: string[];
	name: string;
	status: string;
}

export const loader = () => {
	const countries_list = countries.all.filter(
		(country: Country) => country.emoji && country.status !== "deleted" && country.ioc !== "PRK",
	);

	return { countries_list };
};

export default function AccountDetailsPage() {
	const rootData = useRouteLoaderData<typeof rootLoader>("root");
	const { countries_list } = useLoaderData<typeof loader>();
	const actionData = useActionData();
	const submit = useSubmit();
	const navigation = useNavigation();

	const user = rootData?.user as FullCurrentUser | null;

	if (!user || user == null) return null;

	const isSubmitting = navigation.state === "submitting";

	const form = useForm<ProfileUpdateForm>({
		disabled: isSubmitting,
		resolver: zodResolver(profileUpdateSchema),
		defaultValues: {
			first_name: user.first_name || "",
			last_name: user.last_name || "",
			phone_number: user.phone_number || "",
			country: (() => {
				if (!user.country) return "";
				const found = countries_list.find(
					(c) => c.alpha2 === user.country || c.alpha3 === user.country,
				);
				return found ? found.alpha3 : user.country;
			})(),
		},
	});

	const onSubmit = (data: ProfileUpdateForm) => {
		console.log(data, user);

		if (
			data.first_name === user.first_name &&
			data.last_name === user.last_name &&
			data.phone_number == user.phone_number &&
			(data.country === "" ? null : data.country) == user.country
		) {
			toast.error("No changes detected");
			return;
		}

		const formData = new FormData();
		formData.append("first_name", data.first_name);
		formData.append("last_name", data.last_name);
		formData.append("phone_number", data.phone_number || "");
		formData.append("country", data.country || "");
		submit(formData, { method: "post" });
	};

	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast.success("Profile updated successfully!");
			} else if (actionData.error) {
				toast.error(actionData.error);
			}
		}
	}, [actionData]);

	// const filteredCountries = useMemo(
	// 	() =>
	// 		countries_list
	// 			.filter((x) => x.name)
	// 			.map((option, key: number) => (
	// 				<SelectItem key={key} value={option.alpha3 || option.alpha2}>
	// 					{option.emoji} {option.name}
	// 				</SelectItem>
	// 			)),
	// 	[countries_list],
	// );

	return (
		<>
			<MetaDetails
				metaTitle="Account Details | WanderNest"
				metaDescription="My account information"
				metaKeywords="WanderNest"
			/>

			<div className="space-y-6">
				<h1 className="text-3xl font-bold">Account Details</h1>

				<Card>
					<CardHeader>
						<div className="flex items-center sm:flex-row flex-col gap-4">
							<Avatar className="sm:h-11 h-8 sm:w-11 w-8 border-2 border-background ring-1 ring-muted/40">
								<AvatarImage
									src={user.avatar_url ?? undefined}
									alt={user.first_name ?? "User"}
								/>
								<AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
									{user.first_name?.charAt(0) ?? "U"}
									{user.last_name?.charAt(0) ?? ""}
								</AvatarFallback>
							</Avatar>
							<div>
								<CardTitle className="sm:text-2xl text-xl">
									{user.first_name} {user.last_name}
								</CardTitle>
								<CardDescription>{user.email}</CardDescription>
							</div>
						</div>
					</CardHeader>

					<CardContent>
						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
								<div className="grid sm:grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="first_name"
										render={({ field }) => (
											<FormItem>
												<FormLabel>First Name</FormLabel>
												<FormControl>
													<Input placeholder="First Name" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="last_name"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Last Name</FormLabel>
												<FormControl>
													<Input placeholder="Last Name" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<div className="grid sm:grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="phone_number"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Phone Number</FormLabel>
												<FormControl>
													<PhoneInput {...field} placeholder="Phone Number" />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									{/* <FormField
										control={form.control}
										name="country"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Country</FormLabel>
												<FormControl>
													<Select
														onValueChange={field.onChange}
														value={field.value}
													>
														<SelectTrigger className="w-full">
															<SelectValue placeholder={"Your country"} />
														</SelectTrigger>
														<SelectContent>
															<SelectGroup>
																<Suspense fallback={"Loading..."}>
																	<Await
																			resolve={countries_list}
																			children={(countries_list) =>
																				filteredCountries
																			}
																		/>
																</Suspense>
															</SelectGroup>
														</SelectContent>
													</Select>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/> */}
								</div>

								<div className="w-fit ml-auto">
									<Button type="submit" className="" disabled={isSubmitting}>
										{isSubmitting ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Saving...
											</>
										) : (
											<>
												<Save className="mr-2 h-4 w-4" />
												Save Changes
											</>
										)}
									</Button>
								</div>
							</form>
						</Form>
					</CardContent>
				</Card>
			</div>
		</>
	);
}
