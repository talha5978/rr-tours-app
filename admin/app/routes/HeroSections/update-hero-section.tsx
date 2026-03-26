import { zodResolver } from "@hookform/resolvers/zod";
import { HERO_SECTION_IMG_DIMENSIONS } from "@workspace/shared/constants/constants";
import {
	UpdateHeroSectionInput,
	UpdateHeroSectionSchema,
} from "@workspace/shared/schemas/hero-section.schema";
import {
	type UpdateTagActionData,
	UpdateTagActionSchema,
	type UpdateTagInput,
} from "@workspace/shared/schemas/tag.schema";
import { cacheService } from "@workspace/shared/services/cache.service";
import { HeroSectionsService } from "@workspace/shared/services/hero-sections.service";
import { ActionResponse } from "@workspace/shared/types/action-data";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";
import { Info, Loader2 } from "lucide-react";
import { useEffect } from "react";
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
import { toast } from "sonner";
import ImageInput from "~/components/Custom-Inputs/image-input";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "~/components/ui/sheet";
import { heroSectionQuery } from "~/queries/hero-sections.q";

export const action = async ({ request, params }: ActionFunctionArgs) => {
	const id = (params.id as string) || "";
	if (!id || id == "") {
		throw new Response("Hero Section ID is required", { status: 400 });
	}

	const formData = await request.formData();

	const data: Partial<UpdateTagActionData> = {};

	if (formData.has("name")) {
		data.name = (formData.get("name") as string).trim();
	}

	if (formData.has("image") && formData.has("removed_image")) {
		data.image = formData.get("image") as File;
		data.removed_image = formData.get("removed_image") as string;
	}

	const parseResult = UpdateTagActionSchema.safeParse(data);
	// console.log("Parse result: ", parseResult?.error);

	if (!parseResult.success) {
		return new Response(JSON.stringify({ validationErrors: parseResult.error.flatten().fieldErrors }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const svc = new HeroSectionsService(request);
	// return;
	try {
		await svc.updateHeroSection(Number(id), parseResult.data);

		await cacheService.invalidate(CACHE_KEYS.heroSections.list("AD"));
		await cacheService.invalidate(CACHE_KEYS.heroSections.list("FP"));
		await cacheService.invalidate(CACHE_KEYS.heroSections.details(id));

		return { success: true };
	} catch (error: any) {
		return {
			success: false,
			error:
				error instanceof ApiError ? error.message : error.message || "Failed to update hero section",
		};
	}
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const id = params.id as string;
	if (!id) {
		throw new Response("Hero Section ID is required", { status: 400 });
	}

	const response = await heroSectionQuery({ request, id: Number(id) });
	return response;
};

export default function UpdateHeroSectionPage() {
	const navigate = useNavigate();

	const submit = useSubmit();
	const navigation = useNavigation();
	const data = useLoaderData<typeof loader>();

	const actionData: ActionResponse = useActionData();

	const form = useForm<UpdateHeroSectionInput>({
		resolver: zodResolver(UpdateHeroSectionSchema),
		mode: "onSubmit",
		defaultValues: {
			name: data?.name || "",
			image: data?.image || undefined,
		},
	});

	const { handleSubmit, setError, control } = form;

	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";

	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast.success("Hero Section updated successfully");
				navigate(`/hero-sections`);
			} else if (actionData.error) {
				toast.error(actionData.error);
			} else if (actionData.validationErrors) {
				toast.error("Invalid form data. Please check your inputs.");
				Object.entries(actionData.validationErrors).forEach(([field, errors]) => {
					setError(field as keyof UpdateTagInput, { message: errors[0] });
				});
			}
		}
	}, [actionData, navigate, setError]);

	async function onFormSubmit(values: UpdateTagInput) {
		if (data == null) {
			toast.error("Hero Section data not found. Please try again.");
			return;
		}

		if (!values.image) {
			toast.error("Please upload an image.");
			return;
		}

		const normalizedValues = {
			name: values.name.trim(),
			image: values.image,
		};

		const formData = new FormData();

		let hasChanges = false;

		if (normalizedValues.name !== data.name) {
			formData.set("name", normalizedValues.name);
			hasChanges = true;
		}

		// Separate image check..
		if (normalizedValues.image && typeof normalizedValues.image !== "string") {
			formData.set("image", normalizedValues.image as File);
			formData.set("removed_image", data.image as string);
			hasChanges = true;
		}

		if (!hasChanges) {
			toast.info("No changes to save");
			return;
		}

		toast.info("Updating hero section...");

		submit(formData, {
			method: "POST",
			action: `/hero-sections/${data.id}/update`,
			encType: "multipart/form-data",
		});
	}

	return (
		<>
			<Sheet defaultOpen onOpenChange={() => navigate(-1)}>
				<SheetContent className="overflow-y-auto">
					<SheetHeader>
						<SheetTitle>Update Hero Section</SheetTitle>
						<SheetDescription>
							Create {data?.name} hero section here. Click update when you are done.
						</SheetDescription>
					</SheetHeader>
					<Separator />
					<form
						onSubmit={handleSubmit(onFormSubmit)}
						className="space-y-4 flex flex-col p-4 h-full"
					>
						<Form {...form}>
							<FormField
								control={control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Hero Section Name</FormLabel>
										<FormControl>
											<Input placeholder="e.g. Dubai City" maxLength={100} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Image Upload */}
							<FormField
								control={control}
								name="image"
								render={() => (
									<FormItem>
										<FormLabel>Hero Section Image</FormLabel>
										<FormControl>
											<ImageInput
												name="image"
												className="min-w-full h-full"
												showDetails={false}
												dimensions={HERO_SECTION_IMG_DIMENSIONS}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<SheetFooter className="self-end px-0 min-w-full">
								<Alert variant="default" className="mb-4">
									<Info />
									<AlertTitle>Recommendation</AlertTitle>
									<AlertDescription>
										Use image of high quality and resolution for the best appearance on
										the homepage.
									</AlertDescription>
								</Alert>
								<Button type="submit" disabled={isSubmitting} className="w-full">
									{isSubmitting && <Loader2 className="animate-spin" />}
									<span>Update</span>
								</Button>
								<SheetClose asChild className="w-full">
									<Button variant="outline">Close</Button>
								</SheetClose>
							</SheetFooter>
						</Form>
					</form>
				</SheetContent>
			</Sheet>
		</>
	);
}
