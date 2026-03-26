import { zodResolver } from "@hookform/resolvers/zod";
import { HERO_SECTION_IMG_DIMENSIONS } from "@workspace/shared/constants/constants";
import {
	type AddHeroSectionInput,
	AddHeroSectionSchema,
} from "@workspace/shared/schemas/hero-section.schema";
import { cacheService } from "@workspace/shared/services/cache.service";
import { HeroSectionsService } from "@workspace/shared/services/hero-sections.service";
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

	const parseResult = AddHeroSectionSchema.safeParse(data);

	if (!parseResult.success) {
		return new Response(JSON.stringify({ validationErrors: parseResult.error.flatten().fieldErrors }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const svc = new HeroSectionsService(request);
	// return;
	try {
		await svc.addHeroSection(parseResult.data);
		await cacheService.invalidate(CACHE_KEYS.heroSections.list("AD"));
		await cacheService.invalidate(CACHE_KEYS.heroSections.list("FP"));

		return { success: true };
	} catch (error: any) {
		return {
			success: false,
			error: error instanceof ApiError ? error.message : error.message || "Failed to add hero section",
		};
	}
};

export const loader = async () => {
	return null;
};

export default function AddHeroSectionPage() {
	const navigate = useNavigate();

	const submit = useSubmit();
	const navigation = useNavigation();

	const actionData: ActionResponse = useActionData();

	const form = useForm<AddHeroSectionInput>({
		resolver: zodResolver(AddHeroSectionSchema),
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
				toast.success("Hero section added successfully");
				navigate(`/hero-sections`);
			} else if (actionData.error) {
				toast.error(actionData.error);
			} else if (actionData.validationErrors) {
				toast.error("Invalid form data. Please check your inputs.");
				Object.entries(actionData.validationErrors).forEach(([field, errors]) => {
					setError(field as keyof AddHeroSectionInput, { message: errors[0] });
				});
			}
		}
	}, [actionData, navigate, setError]);

	async function onFormSubmit(values: AddHeroSectionInput) {
		if (!values.image) {
			toast.error("Please upload an image.");
			return;
		}

		const formData = new FormData();
		formData.set("name", values.name.trim());
		formData.set("image", values.image);

		submit(formData, {
			method: "POST",
			action: "/hero-sections/add",
			encType: "multipart/form-data",
		});
	}

	return (
		<Sheet defaultOpen onOpenChange={() => navigate(-1)}>
			<SheetContent className="overflow-y-auto">
				<SheetHeader>
					<SheetTitle>Add Hero Section</SheetTitle>
					<SheetDescription>
						Add a new hero section here. Click save when you are done.
					</SheetDescription>
				</SheetHeader>
				<Separator />
				<form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 flex flex-col p-4 h-full">
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
									Use image of high quality and resolution for the best appearance on the
									homepage.
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
