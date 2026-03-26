import { zodResolver } from "@hookform/resolvers/zod";
import { MAX_META_KEYWORDS } from "@workspace/shared/constants/constants";
import {
	UpdateTourActionPayloadSchema,
	type UpdateTourInput,
	UpdateTourSchema,
} from "@workspace/shared/schemas/tour.schema";
import { cacheService } from "@workspace/shared/services/cache.service";
import { ToursService } from "@workspace/shared/services/tours.service";
import type { ActionResponse } from "@workspace/shared/types/action-data";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { CACHE_KEYS } from "@workspace/shared/utils/cache-keys";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { type Control, useForm, useWatch } from "react-hook-form";
import {
	type ActionFunctionArgs,
	Link,
	type LoaderFunctionArgs,
	useActionData,
	useLoaderData,
	useNavigate,
	useNavigation,
	useSubmit,
} from "react-router";
import { toast } from "sonner";
import BackButton from "~/components/Nav/BackButton";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { AddressCard } from "~/components/Tour/Mutations/AddressCard";
import { AttributesCard } from "~/components/Tour/Mutations/AttributesCard";
import { GeneralDetailsCard } from "~/components/Tour/Mutations/GeneralCard";
import { ImagesInputCard } from "~/components/Tour/Mutations/ImagesCard";
import { MainContentCard } from "~/components/Tour/Mutations/MainContentCard";
import { TagsCard } from "~/components/Tour/Mutations/TagsCard";
import { TourOptionsCard } from "~/components/Tour/Mutations/UpdateTourOptionsCard";
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
import { cancellationPoliciesQuery } from "~/queries/cancellation-policies.q";
import { categoryListQuery } from "~/queries/categories.q";
import { citiesListQuery } from "~/queries/cities.q";
import { participantTypesQuery } from "~/queries/participant-types.q";
import { allProvidersQuery } from "~/queries/providers.q";
import { allTagsQuery } from "~/queries/tags.q";
import { tourDetailsForUpdateQuery } from "~/queries/tours.q";
import {
	getSanitizedMetaDetailsForAction,
	getSanitizedMetaDetailsForForm,
} from "~/utils/getSanitizedMetaDetails";

export const action = async ({ request, params }: ActionFunctionArgs) => {
	try {
		const tour_id = params.id;
		if (!tour_id) {
			throw new ApiError("Tour ID is required", 400, []);
		}

		if (request.method !== "PATCH") {
			throw new ApiError("Invalid request method", 405, []);
		}

		const formData = await request.formData();
		let payload: string = formData.get("payload") as string;

		if (!payload || payload.trim() === "") {
			throw new ApiError("Empty request body", 400, []);
		}

		let rawBody: any = JSON.parse(payload);

		getSanitizedMetaDetailsForAction({ formData, data: rawBody });

		const cover_image = formData.get("cover_image") as File | null;
		const images = formData.getAll("images") as File[];
		const removed_images = formData.getAll("removed_images") as string[];

		if (removed_images.length > 0) {
			rawBody.removed_images = removed_images;
		}

		let parseResult = UpdateTourActionPayloadSchema.safeParse(rawBody);
		// console.dir(rawBody.tour_options_updates);

		if (!parseResult.success) {
			console.error(parseResult.error.flatten().fieldErrors, rawBody);

			return new Response(
				JSON.stringify({ validationErrors: parseResult.error.flatten().fieldErrors }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}
		console.dir(parseResult.data);

		const tours_svc = new ToursService(request);
		await tours_svc.updateTour(
			{
				...parseResult.data,
				cover_image,
				images,
			},
			tour_id,
		);

		await cacheService.invalidatePattern(CACHE_KEYS.categories.highLevelAD() + `:*`);
		await cacheService.invalidatePattern(CACHE_KEYS.tours.list("AD") + `:*`);
		await cacheService.invalidatePattern(CACHE_KEYS.tours.highLevel("AD") + `:*`);
		await cacheService.invalidate(CACHE_KEYS.tours.detailForUpdate(tour_id));
		await cacheService.invalidate(CACHE_KEYS.tours.details("AD", tour_id));
		await cacheService.invalidate(CACHE_KEYS.tours.details("FP", tour_id));
		await cacheService.invalidatePattern(CACHE_KEYS.tours.highLevel("FP") + `:*`);

		if (parseResult.data.tour_options_updates != null) {
			await cacheService.invalidatePattern(
				CACHE_KEYS.tours.slotAvailability(undefined, undefined, tour_id) + `:*`,
			);
		}

		return { success: true, tour_id };
	} catch (error: any) {
		return {
			success: false,
			tour_id: null,
			error: error instanceof ApiError ? error.message : error.message || "Failed to update tour",
		};
	}
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	if (params.id == null || params.id == "") {
		throw new ApiError("Tour ID is required", 400, []);
	}

	const tour = await tourDetailsForUpdateQuery({ request, tour_id: params.id });
	const cancellation_policies = await cancellationPoliciesQuery({ request });
	const participants = await participantTypesQuery({ request });
	const cities = await citiesListQuery({ request });
	const tags = await allTagsQuery({ request });
	const categories = await categoryListQuery({ request });
	const providers = await allProvidersQuery({ request });

	return {
		cities,
		categories,
		providers,
		tags,
		cancellation_policies,
		participants,
		tour,
	};
};

export default function UpdateTourPage() {
	const { cities, categories, providers, tags, cancellation_policies, participants, tour } =
		useLoaderData<typeof loader>();
	const navigate = useNavigate();

	if (tour == null) {
		toast.error("Error fetching tour!");
		navigate("/tours");
	}

	const submit = useSubmit();
	const navigation = useNavigation();

	// @ts-ignore
	const actionData: ActionResponse & { tour_id: string | null } = useActionData();

	const form = useForm<UpdateTourInput>({
		resolver: zodResolver(UpdateTourSchema),
		mode: "onSubmit",
		defaultValues: {
			name: tour?.name ?? "",
			city_id: tour?.city?.id.toString() ?? "",
			tour_category_id: tour?.tour_category?.id.toString() ?? "",
			provider: tour?.provider?.id.toString() ?? "",
			duration_minutes: tour?.duration_minutes?.toString() ?? "",
			isFeatured: tour?.isFeatured ? "true" : "false",
			isActive: tour?.isActive ? "true" : "false",
			free_cancelation_avilable: tour?.free_cancelation_avilable ? "true" : "false",
			isWeelChairAccessible: tour?.isWeelChairAccessible ? "true" : "false",
			tags: tour?.tags.map((i) => i.id.toString()) ?? [],
			overview: tour?.overview ?? "",
			highlights: tour?.highlights ?? "",
			know_before_you_go: tour?.know_before_you_go ?? "",
			cancellation_policy: tour?.cancellation_policy?.toString() ?? "",
			age_health_restrictions: tour?.age_health_restrictions ?? "",
			cover_image: tour?.cover_image ?? undefined,
			images: tour?.images ?? (Array.from({ length: 4 }).fill(undefined) as undefined[]),
			address_name: tour?.address_name ?? "",
			address_link: tour?.address_link ?? "",
			meta_details: {
				meta_title: tour?.meta_details?.meta_title || "",
				meta_description: tour?.meta_details?.meta_description || "",
				url_key: tour?.meta_details?.url_key || "",
				meta_keywords:
					tour?.meta_details?.meta_keywords == ""
						? []
						: tour?.meta_details?.meta_keywords?.split(",") || [],
			},
			tour_options: tour?.tour_options.map((option) => ({
				id: option.id,
				name: option.name ?? "",
				note: option.note ?? "",
				exclusions: option.exclusions ?? "",
				inclusions: option.inclusions ?? "",
				prices: option.prices.map((price) => ({
					id: price.id,
					price: price.price.toString() ?? "",
					participant: price.participant_type_id.toString() ?? "",
				})),
				sort_order: option?.sort_order?.toString() ?? "1",
				isOpenDated: (option.isOpenDated ? "true" : "false") as "true" | "false",
				rules: option.availability_rules.map((rule) => ({
					id: rule.id,
					start_date: rule.start_date,
					end_date: rule.end_date,
					is_active: rule.is_active ? "true" : "false",
					weekdays: rule.weekdays.map(String) as ("1" | "2" | "3" | "4" | "5" | "6" | "7")[],
					time_slots: rule.time_slots.map((slot) => ({
						id: slot.id ?? undefined,
						label: slot.label ?? "",
						capacity: slot.capacity.toString() ?? "",
						is_active: slot.is_active ? "true" : "false",
					})),
				})),
				overrides: option.availability_overrides.map((override) => ({
					id: override.id ?? undefined,
					date: override.date ?? "",
					override_type: override.override_type ?? "",
					new_capacity: override.new_capacity?.toString() ?? null,
					time_slot_label: override.time_slot_id?.toString() ?? "",
				})),
			})),
			live_tour_guide:
				tour?.live_tour_guide_langs != null && tour?.live_tour_guide_langs != "" ? "true" : "false",
			live_tour_guide_langs: tour?.live_tour_guide_langs?.split(",") ?? [],
		},
	});

	const { handleSubmit, setError, control } = form;

	const isSubmitting = navigation.state === "submitting" && navigation.formMethod === "PATCH";

	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast.success(tour?.name + " tour updated successfully");
				if (actionData.tour_id) {
					navigate("/tours");
				}
			} else if (actionData.error) {
				toast.error(actionData.error);
			} else if (actionData.validationErrors) {
				toast.error("Invalid form data. Please check your inputs.");
				Object.entries(actionData.validationErrors).forEach(([field, errors]) => {
					setError(field as keyof UpdateTourInput, { message: errors[0] });
				});
			}
		}
	}, [actionData, navigate, setError]);

	const watchedTags = useWatch({ control, name: "tags" }) ?? [];

	async function onFormSubmit(values: UpdateTourInput) {
		console.log(values);

		if (tour == null) {
			toast.error("Tour data not found. Please try again later.");
			return;
		}

		if (values.address_name != null && values.address_name != "") {
			if (values.address_link == null || values.address_link == "") {
				toast.error("Please add address link.");
				return;
			}
		} else if (values.address_name == null || values.address_name == "") {
			if (values.address_link != null && values.address_link != "") {
				toast.error("Please add address name.");
				return;
			}
		}

		if (values.tour_options.length === 0) {
			toast.error("Please add at least one tour option.");
			return;
		}

		for (const option of values.tour_options) {
			if (option.rules == null || option.rules.length === 0) {
				toast.error(`Please add at least one availability rule for tour option "${option.name}".`);
				return;
			}
		}

		for (const option of values.tour_options) {
			if (option.prices.length === 0) {
				toast.error("Please add at least one price for each tour option.");
				return;
			}

			const seenParticipants = new Set<string>();

			for (const price of option.prices) {
				if (seenParticipants.has(price.participant)) {
					toast.error(
						`Duplicate ${participants
							.find((i) => i.id === Number(price.participant))
							?.name.toLowerCase()} participant prices in the tour option "${option.name}" are not allowed.`,
					);
					return;
				}

				seenParticipants.add(price.participant);
			}
		}

		const formData = new FormData();
		let hasChanges = false;

		function trimRecursive(obj: any): any {
			if (typeof obj === "string") {
				return obj.trim();
			} else if (Array.isArray(obj)) {
				return obj.map(trimRecursive);
			} else if (typeof obj === "object" && obj !== null) {
				const newObj: any = {};
				for (const key in obj) {
					newObj[key] = trimRecursive(obj[key]);
				}
				return newObj;
			}
			return obj;
		}

		// CRITICAL: Preserve File objects from trimming
		const rawImages = values.images;
		const rawCoverImage = values.cover_image;

		const trimmedValues = trimRecursive({
			...values,
			images: undefined,
			cover_image: undefined,
		}) as UpdateTourInput;

		if (trimmedValues.live_tour_guide === "false") {
			trimmedValues.live_tour_guide_langs = [];
		}

		// === MAIN TOUR FIELDS ===
		const tourUpdate: Partial<any> = {};

		if (trimmedValues.name !== tour.name) {
			tourUpdate.name = trimmedValues.name;
			hasChanges = true;
		}
		if (trimmedValues.overview !== tour.overview) {
			tourUpdate.overview = trimmedValues.overview;
			hasChanges = true;
		}
		const cityId = Number(trimmedValues.city_id);
		if (cityId !== tour.city_id) {
			tourUpdate.city_id = cityId;
			hasChanges = true;
		}
		const categoryId = Number(trimmedValues.tour_category_id);
		if (categoryId !== tour.tour_category_id) {
			tourUpdate.tour_category_id = categoryId;
			hasChanges = true;
		}
		const provider = trimmedValues.provider ? Number(trimmedValues.provider) : null;
		if (provider !== tour.provider?.id) {
			tourUpdate.provider = provider;
			hasChanges = true;
		}

		const duration = trimmedValues.duration_minutes ? Number(trimmedValues.duration_minutes) : null;
		if (duration !== tour.duration_minutes) {
			tourUpdate.duration_minutes = duration;
			hasChanges = true;
		}
		const isFeatured = trimmedValues.isFeatured === "true";
		if (isFeatured !== tour.isFeatured) {
			tourUpdate.isFeatured = isFeatured;
			hasChanges = true;
		}
		const isActive = trimmedValues.isActive === "true";
		if (isActive !== tour.isActive) {
			tourUpdate.isActive = isActive;
			hasChanges = true;
		}
		const freeCancel = trimmedValues.free_cancelation_avilable === "true";
		if (freeCancel !== tour.free_cancelation_avilable) {
			tourUpdate.free_cancelation_avilable = freeCancel;
			hasChanges = true;
		}
		const isWheelChair = trimmedValues.isWeelChairAccessible === "true";
		if (isWheelChair !== tour.isWeelChairAccessible) {
			tourUpdate.isWeelChairAccessible = isWheelChair;
			hasChanges = true;
		}
		const liveTourGuide = trimmedValues.live_tour_guide === "true";
		if (liveTourGuide !== tour.live_tour_guide) {
			tourUpdate.live_tour_guide = liveTourGuide;
			hasChanges = true;
		}
		const liveTourGuideLangs =
			trimmedValues.live_tour_guide_langs != null && trimmedValues.live_tour_guide_langs.length > 0
				? trimmedValues.live_tour_guide_langs.join(",")
				: null;
		if (liveTourGuideLangs !== tour.live_tour_guide_langs) {
			tourUpdate.live_tour_guide_langs = liveTourGuideLangs;
			hasChanges = true;
		}
		const cancellationPolicy = trimmedValues.cancellation_policy
			? Number(trimmedValues.cancellation_policy)
			: null;
		if (cancellationPolicy !== tour.cancellation_policy) {
			tourUpdate.cancellation_policy = cancellationPolicy;
			hasChanges = true;
		}
		const ageHealth = trimmedValues.age_health_restrictions || null;
		if (ageHealth !== tour.age_health_restrictions) {
			tourUpdate.age_health_restrictions = ageHealth;
			hasChanges = true;
		}
		const highlights = trimmedValues.highlights || null;
		if (highlights !== tour.highlights) {
			tourUpdate.highlights = highlights;
			hasChanges = true;
		}
		const knowBefore = trimmedValues.know_before_you_go || null;
		if (knowBefore !== tour.know_before_you_go) {
			tourUpdate.know_before_you_go = knowBefore;
			hasChanges = true;
		}
		const addressName = trimmedValues.address_name || null;
		if (addressName !== tour.address_name) {
			tourUpdate.address_name = addressName;
			hasChanges = true;
		}
		const addressLink = trimmedValues.address_link || null;
		if (addressLink !== tour.address_link) {
			tourUpdate.address_link = addressLink;
			hasChanges = true;
		}

		// === COVER IMAGE ===
		let removedCoverImage: string | null = null;
		if (rawCoverImage instanceof File) {
			hasChanges = true;
			removedCoverImage = tour.cover_image || null;
			formData.append("cover_image", rawCoverImage);
		} else if (rawCoverImage !== tour.cover_image) {
			tourUpdate.cover_image = rawCoverImage;
			hasChanges = true;
		}

		// === SECONDARY IMAGES ===
		const originalImages = tour?.images || [];
		const formImages = rawImages.filter((img): img is string | File => img !== null && img !== undefined);

		const imagesChanged =
			formImages.length !== originalImages.length ||
			formImages.some((img, index) => {
				if (typeof img === "string") {
					return img !== originalImages[index];
				}
				return true;
			});

		if (imagesChanged) {
			const keptImages = formImages.filter((img): img is string => typeof img === "string");
			const removedImages = originalImages.filter((img) => !keptImages.includes(img));

			removedImages.forEach((imageUrl) => {
				formData.append("removed_images", imageUrl);
			});

			const newImages = formImages.filter((img): img is File => img instanceof File);
			newImages.forEach((file) => {
				formData.append("images", file);
			});

			hasChanges = true;
		}

		// === TAGS ===
		const originalTagIds = tour.tags.map((t) => t.id.toString());
		const addedTags = trimmedValues?.tags?.filter((id) => !originalTagIds.includes(id)).map(Number) ?? [];
		const removedTags = originalTagIds.filter((id) => !trimmedValues?.tags?.includes(id)).map(Number);

		if (addedTags.length > 0 || removedTags.length > 0) {
			hasChanges = true;
		}

		const tourOptionsPayload: {
			new_options: any[];
			deleted_options: number[];
			updated_options: any[];
			new_prices: any[];
			deleted_prices: number[];
			updated_prices: any[];
			new_rules: any[];
			deleted_rules: number[];
			new_time_slots: any[];
			deleted_time_slots: number[];
			new_overrides: any[];
			deleted_overrides: number[];
		} = {
			new_options: [],
			deleted_options: [],
			updated_options: [],

			new_prices: [],
			deleted_prices: [],
			updated_prices: [],

			new_rules: [],
			deleted_rules: [],

			new_time_slots: [],
			deleted_time_slots: [],

			new_overrides: [],
			deleted_overrides: [],
		};

		let tempCounter = 0;

		// Track used IDs to detect deletions
		const usedRuleIds = new Set<number>();
		const usedTimeSlotIds = new Set<number>();
		const usedOverrideIds = new Set<number>();

		trimmedValues.tour_options.forEach((formOption) => {
			if (formOption.id) {
				usedRuleIds.add(formOption.id); // wait — no: usedRuleIds for rules, not option
			}

			formOption.rules?.forEach((rule) => {
				if (rule.id) usedRuleIds.add(rule.id);
				rule.time_slots.forEach((ts) => {
					if (ts.id) usedTimeSlotIds.add(ts.id);
				});
			});

			formOption.overrides?.forEach((ov) => {
				if (ov.id) usedOverrideIds.add(ov.id);
			});
		});

		// Deleted options
		const originalOptionIds = new Set(tour.tour_options.map((o) => o.id));
		tourOptionsPayload.deleted_options = [...originalOptionIds].filter(
			(id) => !trimmedValues.tour_options.some((fo) => fo.id === id),
		);

		// Process each form option
		for (const [optIndex, formOption] of trimmedValues.tour_options.entries()) {
			const isNewOption = !formOption.id;
			const tempOptionId = isNewOption ? `new-opt-${++tempCounter}` : formOption.id!;

			// New option
			if (isNewOption) {
				tourOptionsPayload.new_options.push({
					name: formOption.name,
					inclusions: formOption.inclusions || null,
					exclusions: formOption.exclusions || null,
					note: formOption.note || null,
					sort_order: Number(formOption.sort_order || optIndex + 1),
					isOpenDated: formOption.isOpenDated === "true",
				});
				hasChanges = true;
			} else {
				// Updated option
				const originalOption = tour.tour_options.find((o) => o.id === formOption.id);
				if (!originalOption) continue;

				const optionUpdate: any = { id: formOption.id };

				if (formOption.name !== originalOption.name) {
					optionUpdate.name = formOption.name;
					hasChanges = true;
				}
				if (
					formOption.inclusions !==
					(originalOption.inclusions == null ? "" : originalOption.inclusions)
				) {
					optionUpdate.inclusions = formOption.inclusions || null;
					hasChanges = true;
				}
				if (
					formOption.exclusions !==
					(originalOption.exclusions == null ? "" : originalOption.exclusions)
				) {
					optionUpdate.exclusions = formOption.exclusions || null;
					hasChanges = true;
				}
				if (formOption.note !== (originalOption.note == null ? "" : originalOption.note)) {
					optionUpdate.note = formOption.note || null;
					hasChanges = true;
				}
				if (
					Number(formOption.sort_order || 0) !==
					(originalOption.sort_order == null ? 0 : originalOption.sort_order)
				) {
					optionUpdate.sort_order = Number(formOption.sort_order || optIndex + 1);
					hasChanges = true;
				}
				if ((formOption.isOpenDated === "true") !== originalOption.isOpenDated) {
					optionUpdate.isOpenDated = formOption.isOpenDated === "true";
					hasChanges = true;
				}

				if (Object.keys(optionUpdate).length > 1) {
					tourOptionsPayload.updated_options.push(optionUpdate);
				}
			}

			// Prices
			const originalPrices = isNewOption
				? []
				: tour.tour_options.find((o) => o.id === formOption.id)!.prices;
			const formPriceIds = new Set(formOption.prices.map((p) => p.id).filter(Boolean));

			const ifOptPricesDeleted = originalPrices.map((p) => p.id).filter((id) => !formPriceIds.has(id));

			if (ifOptPricesDeleted.length > 0) {
				tourOptionsPayload.deleted_prices.push(...ifOptPricesDeleted);
				hasChanges = true;
			}

			for (const formPrice of formOption.prices) {
				const isNewPrice = !formPrice.id;
				const participantId = Number(formPrice.participant);
				const priceNum = Number(formPrice.price);

				if (isNewPrice) {
					tourOptionsPayload.new_prices.push({
						tour_option_id: tempOptionId,
						participant_type_id: participantId,
						price: priceNum,
					});
					hasChanges = true;
				} else {
					const originalPrice = originalPrices.find((p) => p.id === formPrice.id);
					if (originalPrice && originalPrice.price !== priceNum) {
						tourOptionsPayload.updated_prices.push({
							id: formPrice.id,
							price: priceNum,
						});

						hasChanges = true;
					}

					if (originalPrice && originalPrice.participant_type_id !== participantId) {
						const s = tourOptionsPayload.updated_prices.find((p: any) => p.id === formPrice.id);

						if (s) {
							s.participant_type_id = participantId;
						} else {
							tourOptionsPayload.updated_prices.push({
								id: formPrice.id,
								participant_type_id: participantId,
							});
						}

						hasChanges = true;
					}
				}
			}

			// RULES
			const originalRules = isNewOption
				? []
				: (tour.tour_options.find((o) => o.id === formOption.id)?.availability_rules ?? []);

			const formRuleIds = new Set(formOption.rules?.map((r) => r.id).filter(Boolean) ?? []);

			// Deleted rules
			const deletedRuleIds = originalRules.map((r) => r.id).filter((id) => !formRuleIds.has(id));

			if (deletedRuleIds.length > 0) {
				tourOptionsPayload.deleted_rules.push(...deletedRuleIds);
				hasChanges = true;
			}

			// Process each rule in form
			formOption.rules?.forEach((formRule) => {
				const isNewRule = !formRule.id;
				const tempRuleId = isNewRule ? `new-rule-${++tempCounter}` : formRule.id!;

				if (isNewRule) {
					tourOptionsPayload.new_rules.push({
						tour_option_id: tempOptionId,
						start_date: formRule.start_date,
						end_date: formRule.end_date,
						weekdays: formRule.weekdays.map(Number), // convert string "1" → number 1
						is_active: formRule.is_active === "true",
					});
					hasChanges = true;
				}

				// TIME SLOTS (per rule)
				const originalSlots = isNewRule
					? []
					: (originalRules.find((r) => r.id === formRule.id)?.time_slots ?? []);

				const formSlotIds = new Set(formRule.time_slots.map((ts) => ts.id).filter(Boolean));

				// Deleted slots
				const deletedSlotIds = originalSlots.map((s) => s.id).filter((id) => !formSlotIds.has(id));

				if (deletedSlotIds.length > 0) {
					tourOptionsPayload.deleted_time_slots.push(...deletedSlotIds);
					hasChanges = true;
				}

				// Process each time slot
				formRule.time_slots.forEach((formTs) => {
					const isNewSlot = !formTs.id;

					const slotData = {
						label: formTs.label,
						capacity: Number(formTs.capacity),
						is_active: formTs.is_active === "true",
					};

					if (isNewSlot) {
						tourOptionsPayload.new_time_slots.push({
							availability_rule_id: tempRuleId,
							...slotData,
						});
						hasChanges = true;
					}
				});
			});

			// OVERRIDES
			const originalOverrides = isNewOption
				? []
				: (tour.tour_options.find((o) => o.id === formOption.id)?.availability_overrides ?? []);

			const formOverrideIds = new Set(formOption.overrides?.map((o) => o.id).filter(Boolean) ?? []);

			// Deleted overrides
			const deletedOverrideIds = originalOverrides
				.map((o) => o.id)
				.filter((id) => !formOverrideIds.has(id));

			if (deletedOverrideIds.length > 0) {
				tourOptionsPayload.deleted_overrides.push(...deletedOverrideIds);
				hasChanges = true;
			}

			// Process each override
			formOption.overrides?.forEach((formOv) => {
				const isNewOverride = !formOv.id;

				const overrideData = {
					date: formOv.date,
					override_type: formOv.override_type,
					new_capacity:
						formOv.override_type === "CAPACITY_CHANGE" && formOv.new_capacity != null
							? Number(formOv.new_capacity)
							: null,
					time_slot_id: formOv.time_slot_label ? Number(formOv.time_slot_label) : null, // assuming label was replaced with ID in form
				};

				if (isNewOverride) {
					tourOptionsPayload.new_overrides.push({
						tour_option_id: tempOptionId,
						...overrideData,
					});
					hasChanges = true;
				}
			});
		}

		// === META DETAILS ===
		const normalizedMeta = {
			meta_details: {
				meta_title: values.meta_details.meta_title.trim(),
				meta_description: values.meta_details.meta_description.trim(),
				url_key: values.meta_details.url_key.trim().toLowerCase(),
				meta_keywords: Array.isArray(values.meta_details.meta_keywords)
					? values.meta_details.meta_keywords.map((kw) => kw.trim()).filter(Boolean)
					: [],
			},
		};
		const { hasChanges: metaHasChanges } = getSanitizedMetaDetailsForForm({
			formData,
			normalizedValues: normalizedMeta,
			entity: tour,
			hasChanges,
		});
		hasChanges = hasChanges || metaHasChanges;

		if (!hasChanges) {
			toast.info("No changes to update.");
			return;
		}

		toast.info("Updating the tour...");

		// === BUILD FINAL PAYLOAD ===
		const payload: any = {};

		if (Object.keys(tourUpdate).length > 0) {
			payload.tour_update = tourUpdate;
		}

		if (addedTags.length > 0 || removedTags.length > 0) {
			payload.added_tags = addedTags;
			payload.removed_tags = removedTags;
		}

		if (Object.values(tourOptionsPayload).some((arr: any) => arr.length > 0)) {
			payload.tour_options_updates = tourOptionsPayload;
		}

		if (removedCoverImage) {
			payload.removed_cover_image = removedCoverImage;
		}

		formData.append("payload", JSON.stringify(payload));
		console.log("Final payload:", payload);

		submit(formData, {
			method: "PATCH",
			encType: "multipart/form-data",
		});
	}

	return (
		<>
			<MetaDetails
				metaTitle={"Update " + tour?.name + " Tour | Admin Panel"}
				metaDescription={"Update" + tour?.name + " Tour"}
				metaKeywords="Update Tour"
			/>
			<section className="flex flex-col gap-4">
				<div className="flex gap-4 items-center">
					<BackButton href="/tours" />
					<h1 className="text-2xl font-semibold">Update Tour</h1>
				</div>
				<form className="space-y-4" onSubmit={handleSubmit(onFormSubmit)}>
					<Form {...form}>
						<div className="grid md:grid-cols-2 gap-4">
							{/* General Card */}
							<GeneralDetailsCard
								control={control as any}
								cities={cities}
								categories={categories}
								providers={providers}
							/>

							{/* Attributes Card */}
							<AttributesCard control={control as any} />
						</div>

						{/* Images Card */}
						<ImagesInputCard control={control as any} />

						{/* Tags Selection Card */}
						<TagsCard control={control as any} tags={tags} noTags={watchedTags.length === 0} />

						{/* MAIN Content Card */}
						<MainContentCard
							control={control as any}
							cancellation_policies={cancellation_policies}
						/>

						{/* Options Card */}
						<TourOptionsCard control={control as any} participants={participants} />

						{/* Address Card */}
						<AddressCard control={control as any} />

						{/* Meta Details Card */}
						<Card>
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
													placeholder="e.g. Ferrari World, Abu Dhabi"
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
													disabled
													placeholder="e.g. ferrari-world-abu-dhabi-tour"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>

						{/* Submit Button */}
						<div className="flex gap-4 justify-end md:col-span-3">
							<Link to={"/tours"} viewTransition prefetch="intent">
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

export type UpdateFormControlType = Control<UpdateTourInput>;
