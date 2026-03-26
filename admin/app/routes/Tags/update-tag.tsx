import { zodResolver } from "@hookform/resolvers/zod";
import { TAG_IMG_DIMENSIONS } from "@workspace/shared/constants/constants";
import {
	type UpdateTagActionData,
	UpdateTagActionSchema,
	type UpdateTagInput,
	UpdateTagSchema,
} from "@workspace/shared/schemas/tag.schema";
import { cacheService } from "@workspace/shared/services/cache.service";
import { TourTagsService } from "@workspace/shared/services/tags.service";
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
import { tagQuery } from "~/queries/tags.q";

export const action = async ({ request, params }: ActionFunctionArgs) => {
	const id = (params.id as string) || "";
	if (!id || id == "") {
		throw new Response("Tag ID is required", { status: 400 });
	}

	const formData = await request.formData();
	// console.log("Form data: ", formData);

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

	const svc = new TourTagsService(request);
	// return;
	try {
		await svc.updateTag(Number(id), parseResult.data);

		await cacheService.invalidate(CACHE_KEYS.tags.tags("AD"));
		await cacheService.invalidate(CACHE_KEYS.tags.tag(id));
		cacheService.invalidate(CACHE_KEYS.tags.tags("FP"));
		cacheService.invalidate(CACHE_KEYS.tags.cityTags(id));

		return { success: true };
	} catch (error: any) {
		return {
			success: false,
			error: error instanceof ApiError ? error.message : error.message || "Failed to update tag",
		};
	}
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const id = params.id as string;
	if (!id) {
		throw new Response("Tag ID is required", { status: 400 });
	}

	const response = await tagQuery({ request, id: Number(id) });
	return response;
};

export default function UpdateCategory() {
	const navigate = useNavigate();

	const submit = useSubmit();
	const navigation = useNavigation();
	const data = useLoaderData<typeof loader>();

	const actionData: ActionResponse = useActionData();

	const form = useForm<UpdateTagInput>({
		resolver: zodResolver(UpdateTagSchema),
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
				toast.success("Tag updated successfully");
				navigate(`/tags`);
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
			toast.error("Tag data not found. Please try again.");
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

		toast.info("Updating tag...");

		submit(formData, {
			method: "POST",
			action: `/tags/${data.id}/update`,
			encType: "multipart/form-data",
		});
	}

	return (
		<>
			<Sheet defaultOpen onOpenChange={() => navigate(-1)}>
				<SheetContent>
					<SheetHeader>
						<SheetTitle>Update Tag</SheetTitle>
						<SheetDescription>
							Update {data?.name} tag here. Click update when you are done.
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
										<FormLabel>Tag Name</FormLabel>
										<FormControl>
											<Input
												placeholder="e.g. Attractions"
												maxLength={100}
												{...field}
											/>
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
										<FormLabel>Tag Icon</FormLabel>
										<FormControl>
											<ImageInput
												name="image"
												className="w-50 h-50"
												showDetails={false}
												dimensions={TAG_IMG_DIMENSIONS}
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
										<span>
											Go to Lucide Icons website and customize the icon to width and
											height to 100px and stroke width of 2px
										</span>
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
