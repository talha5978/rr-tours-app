import { zodResolver } from "@hookform/resolvers/zod";
import { CATEGORY_IMG_DIMENSIONS, MAX_META_KEYWORDS } from "@workspace/shared/constants/constants";
import {
	type UpdateCategoryActionData,
	UpdateCategoryActionSchema,
	type UpdateCategoryInput,
	UpdateCategorySchema,
} from "@workspace/shared/schemas/category.schema";
import { cacheService } from "@workspace/shared/services/cache.service";
import { CategoryService } from "@workspace/shared/services/categories.service";
import { ActionResponse } from "@workspace/shared/types/action-data";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	Link,
	useActionData,
	useLoaderData,
	useNavigate,
	useNavigation,
	useSubmit,
} from "react-router";
import { toast } from "sonner";
import ImageInput from "~/components/Custom-Inputs/image-input";
import BackButton from "~/components/Nav/BackButton";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
	CustomTagsInputClear,
	TagsInput,
	TagsInputInput,
	TagsInputItem,
	TagsInputList,
} from "~/components/ui/tags-input";
import { Textarea } from "~/components/ui/textarea";
import { categoryDetailsUpdateQuery } from "~/queries/categories.q";
import {
	getSanitizedMetaDetailsForAction,
	getSanitizedMetaDetailsForForm,
} from "~/utils/getSanitizedMetaDetails";

export const action = async ({ request, params }: ActionFunctionArgs) => {
	const categoryId = (params.categoryId as string) || "";
	if (!categoryId || categoryId == "") {
		throw new Response("Category ID is required", { status: 400 });
	}

	const formData = await request.formData();
	// console.log("Form data: ", formData);

	const data: Partial<UpdateCategoryActionData> = {};

	if (formData.has("name")) {
		data.name = (formData.get("name") as string).trim();
	}

	if (formData.has("sort_order")) {
		data.sort_order = (formData.get("sort_order") as string).trim();
	}

	if (formData.has("image") && formData.has("removed_image")) {
		data.image = formData.get("image") as File;
		data.removed_image = formData.get("removed_image") as string;
	}

	// Parse meta_details fields
	getSanitizedMetaDetailsForAction({ formData, data });

	const parseResult = UpdateCategoryActionSchema.safeParse(data);
	// console.log("Parse result: ", parseResult?.error);

	if (!parseResult.success) {
		return new Response(JSON.stringify({ validationErrors: parseResult.error.flatten().fieldErrors }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const svc = new CategoryService(request);
	// return;
	try {
		await svc.updateCategory(categoryId, parseResult.data);

		await cacheService.invalidatePattern(CACHE_KEYS.categories.highLevelAD() + `:*`);
		await cacheService.invalidate(CACHE_KEYS.categories.details(categoryId));
		await cacheService.invalidate(CACHE_KEYS.categories.list());
		await cacheService.invalidate(CACHE_KEYS.categories.highLevelFP());

		return { success: true };
	} catch (error: any) {
		return {
			success: false,
			error: error instanceof ApiError ? error.message : error.message || "Failed to update category",
		};
	}
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const categoryId = params.categoryId as string;
	if (!categoryId) {
		throw new Response("Category ID is required", { status: 400 });
	}

	const response = await categoryDetailsUpdateQuery(request, Number(categoryId));
	return response;
};

export default function UpdateCategory() {
	const navigate = useNavigate();

	const submit = useSubmit();
	const navigation = useNavigation();
	const { data, error } = useLoaderData<typeof loader>();

	if (error) {
		toast.error(`Error ${error.statusCode}`, {
			description: error.message,
		});

		navigate("/categories");
		return null;
	}

	const actionData: ActionResponse = useActionData();

	const form = useForm<UpdateCategoryInput>({
		resolver: zodResolver(UpdateCategorySchema),
		mode: "onSubmit",
		defaultValues: {
			name: data?.name || "",
			image: data?.image || undefined,
			sort_order: String(data?.sort_order) || "1",
			meta_details: {
				meta_title: data?.meta_details?.meta_title || "",
				meta_description: data?.meta_details?.meta_description || "",
				url_key: data?.meta_details?.url_key || "",
				meta_keywords:
					data?.meta_details?.meta_keywords == ""
						? []
						: data?.meta_details?.meta_keywords?.split(",") || [],
			},
		},
	});

	const { handleSubmit, setError, control } = form;

	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "POST";

	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast.success("Category updated successfully");
				navigate(`/categories`);
			} else if (actionData.error) {
				toast.error(actionData.error);
			} else if (actionData.validationErrors) {
				toast.error("Invalid form data. Please check your inputs.");
				Object.entries(actionData.validationErrors).forEach(([field, errors]) => {
					setError(field as keyof UpdateCategoryInput, { message: errors[0] });
				});
			}
		}
	}, [actionData, navigate, setError]);

	async function onFormSubmit(values: UpdateCategoryInput) {
		if (data == null) {
			toast.error("Category data not found. Please try again.");
			return;
		}

		if (!values.image) {
			toast.error("Please upload an image.");
			return;
		}

		const normalizedValues = {
			name: values.name.trim(),
			image: values.image,
			sort_order: values.sort_order?.toString() || "1",
			meta_details: {
				meta_title: values.meta_details.meta_title.trim(),
				meta_description: values.meta_details.meta_description.trim(),
				url_key: values.meta_details.url_key.trim().toLowerCase(),
				meta_keywords: Array.isArray(values.meta_details.meta_keywords)
					? values.meta_details.meta_keywords.map((kw) => kw.trim()).filter(Boolean)
					: [],
			},
		};

		const formData = new FormData();

		let hasChanges = false;

		if (normalizedValues.name !== data.name) {
			formData.set("name", normalizedValues.name);
			hasChanges = true;
		}

		if (normalizedValues.sort_order !== data.sort_order.toString()) {
			formData.set("sort_order", normalizedValues.sort_order);
			hasChanges = true;
		}

		// Separate image check..
		if (normalizedValues.image && typeof normalizedValues.image !== "string") {
			formData.set("image", normalizedValues.image as File);
			formData.set("removed_image", data.image as string);
			hasChanges = true;
		}

		const { hasChanges: hasMetaChanges } = getSanitizedMetaDetailsForForm({
			formData,
			normalizedValues,
			entity: data,
			hasChanges,
		});

		hasChanges = hasChanges || hasMetaChanges;

		if (!hasChanges) {
			toast.info("No changes to save");
			return;
		}

		toast.info("Updating category...");

		submit(formData, {
			method: "POST",
			action: `/categories/${data.id}/update`,
			encType: "multipart/form-data",
		});
	}

	return (
		<>
			<MetaDetails
				metaTitle="Update Category | Admin Panel"
				metaDescription="Update category"
				metaKeywords="Update Category, category"
			/>
			<section className="flex flex-col gap-4">
				<div className="flex gap-4 items-center">
					<BackButton href="/categories" />
					<h1 className="text-2xl font-semibold">Update Category</h1>
				</div>
				<form className="space-y-4" onSubmit={handleSubmit(onFormSubmit)}>
					<Form {...form}>
						{/* Left Side: General and Meta Details */}
						<div className="grid md:grid-cols-2 gap-4">
							{/* General Card */}
							<Card className="col-span-4 md:col-span-1">
								<CardHeader>
									<CardTitle className="text-lg">General</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									{/* Category Name */}
									<FormField
										control={control}
										name="name"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Category Name</FormLabel>
												<FormControl>
													<Input
														placeholder="e.g. Cultural and Heritage"
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
												<FormLabel>Image</FormLabel>
												<FormControl>
													<ImageInput
														name="image"
														dimensions={CATEGORY_IMG_DIMENSIONS}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									{/* sort_order */}
									<FormField
										control={control}
										name="sort_order"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Sort Order</FormLabel>
												<FormControl>
													<Input type="number" placeholder="0" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</CardContent>
							</Card>

							{/* Meta Details Card */}
							<Card className="col-span-4 md:col-span-1">
								<CardHeader>
									<CardTitle className="text-lg">SEO & Meta Attributes</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									{/* Meta Title */}
									<FormField
										control={control}
										name="meta_details.meta_title"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Meta Title</FormLabel>
												<FormControl>
													<Input
														placeholder="e.g. Cultural and Heritage Tours"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									{/* Meta Description */}
									<FormField
										control={control}
										name="meta_details.meta_description"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Meta Description</FormLabel>
												<FormControl>
													<Textarea
														placeholder="A short description for SEO"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									{/* Meta Keywords */}
									<FormField
										control={control}
										name="meta_details.meta_keywords"
										render={({ field, fieldState }) => (
											<FormItem>
												<FormLabel>Meta Keywords</FormLabel>
												<FormControl>
													<TagsInput
														value={field.value}
														onValueChange={field.onChange}
														max={MAX_META_KEYWORDS}
														editable
														addOnPaste
														className="w-full"
														aria-invalid={!!fieldState.error}
													>
														<div className="flex sm:flex-row flex-col gap-2">
															<TagsInputList>
																{field.value && Array.isArray(field.value)
																	? field.value.map((item) => (
																			<TagsInputItem
																				key={item}
																				value={item}
																			>
																				{item}
																			</TagsInputItem>
																		))
																	: null}
																<TagsInputInput placeholder="Add meta keywords..." />
															</TagsInputList>
															<CustomTagsInputClear />
														</div>
														<div className="text-muted-foreground text-sm">
															You can add up to {MAX_META_KEYWORDS} keywords
														</div>
													</TagsInput>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									{/* URL Key */}
									<FormField
										control={control}
										name="meta_details.url_key"
										render={({ field }) => (
											<FormItem>
												<div className="flex gap-2">
													<FormLabel>URL Key</FormLabel>
													<span className="text-muted-foreground text-sm">
														(Without spaces)
													</span>
												</div>
												<FormControl>
													<Input
														placeholder="e.g. cultural-and-heritage-tours"
														disabled
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</CardContent>
							</Card>
						</div>

						{/* Submit Button */}
						<div className="flex gap-4 justify-end md:col-span-3">
							<Link to={"/categories"} viewTransition prefetch="intent">
								<Button variant={"outline"}>Back</Button>
							</Link>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting && <Loader2 className="animate-spin mr-2" />}
								<span>Update</span>
							</Button>
						</div>
					</Form>
				</form>
			</section>
		</>
	);
}
