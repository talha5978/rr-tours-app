import { zodResolver } from "@hookform/resolvers/zod";
import { TAG_IMG_DIMENSIONS } from "@workspace/shared/constants/constants";
import { AddTagInput, AddTagSchema } from "@workspace/shared/schemas/tag.schema";
import { cacheService } from "@workspace/shared/services/cache.service";
import { TourTagsService } from "@workspace/shared/services/tags.service";
import type { ActionResponse } from "@workspace/shared/types/action-data";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";
import { Info, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useActionData, useNavigate, useNavigation, useSubmit } from "react-router";
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

export const action = async ({ request }: { request: Request }) => {
	const formData = await request.formData();

	const data = {
		name: formData.get("name") as string,
		image: formData.get("image") as File,
	};

	const parseResult = AddTagSchema.safeParse(data);

	if (!parseResult.success) {
		return new Response(JSON.stringify({ validationErrors: parseResult.error.flatten().fieldErrors }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	// console.log("Data in the action: ", parseResult.data);

	const svc = new TourTagsService(request);
	// return;
	try {
		await svc.addTag(parseResult.data);

		await cacheService.invalidate(CACHE_KEYS.tags.tags("AD"));
		cacheService.invalidate(CACHE_KEYS.tags.tags("FP"));

		return { success: true };
	} catch (error: any) {
		return {
			success: false,
			error: error instanceof ApiError ? error.message : error.message || "Failed to add tag",
		};
	}
};

export const loader = async () => {
	return null;
};

export default function AddCategoryPage() {
	const navigate = useNavigate();

	const submit = useSubmit();
	const navigation = useNavigation();

	const actionData: ActionResponse = useActionData();

	const form = useForm<AddTagInput>({
		resolver: zodResolver(AddTagSchema),
		mode: "onSubmit",
		defaultValues: {
			name: "",
			image: undefined,
		},
	});

	const { handleSubmit, setError, control } = form;

	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";

	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast.success("Tag added successfully");
				navigate(`/tags`);
			} else if (actionData.error) {
				toast.error(actionData.error);
			} else if (actionData.validationErrors) {
				toast.error("Invalid form data. Please check your inputs.");
				Object.entries(actionData.validationErrors).forEach(([field, errors]) => {
					setError(field as keyof AddTagInput, { message: errors[0] });
				});
			}
		}
	}, [actionData, navigate, setError]);

	async function onFormSubmit(values: AddTagInput) {
		if (!values.image) {
			toast.error("Please upload an image.");
			return;
		}

		const formData = new FormData();
		formData.set("name", values.name.trim());
		formData.set("image", values.image);

		submit(formData, {
			method: "POST",
			action: "/tags/add",
			encType: "multipart/form-data",
		});
	}

	return (
		<Sheet defaultOpen onOpenChange={() => navigate(-1)}>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Create Tag</SheetTitle>
					<SheetDescription>Create a new tag here. Click save when you are done.</SheetDescription>
				</SheetHeader>
				<Separator />
				<form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 flex flex-col p-4 h-full">
					<Form {...form}>
						<FormField
							control={control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Tag Name</FormLabel>
									<FormControl>
										<Input placeholder="e.g. Attractions" maxLength={100} {...field} />
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
										Go to Lucide Icons website and customize the icon to width and height
										to 100px and stroke width of 2px
									</span>
								</AlertDescription>
							</Alert>
							<Button type="submit" disabled={isSubmitting} className="w-full">
								{isSubmitting && <Loader2 className="animate-spin" />}
								<span>Save</span>
							</Button>
							<SheetClose asChild className="w-full">
								<Button variant="outline">Close</Button>
							</SheetClose>
						</SheetFooter>
					</Form>
				</form>
			</SheetContent>
		</Sheet>
	);
}
