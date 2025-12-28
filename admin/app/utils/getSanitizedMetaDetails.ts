interface ActionProps {
	formData: FormData;
	data: any;
}

interface FormProps {
	formData: FormData;
	entity: any;
	hasChanges: boolean;
	normalizedValues: any;
}

export function getSanitizedMetaDetailsForAction({ formData, data }: ActionProps) {
	const metaFields = ["meta_title", "meta_description", "url_key", "meta_keywords"] as const;

	// Parse meta_details fields
	const hasMetaFields = metaFields.some((field) => formData.has(`meta_details.${field}`));
	if (hasMetaFields) {
		data.meta_details = {
			meta_title: "",
			meta_description: "",
			url_key: "",
			meta_keywords: "",
		};
		for (const field of metaFields) {
			const formKey = `meta_details.${field}`;
			if (formData.has(formKey)) {
				data.meta_details[field] = formData.get(formKey) as string;
			} else {
				delete data.meta_details[field];
			}
		}
	}
}

export function getSanitizedMetaDetailsForForm({
	formData,
	normalizedValues,
	entity,
	hasChanges,
}: FormProps) {
	const metaFields = ["meta_title", "meta_description", "url_key"] as const;

	// Compare meta_details fields
	for (const field of metaFields) {
		if (normalizedValues.meta_details[field] !== entity.meta_details![field]) {
			formData.set(`meta_details.${field}`, normalizedValues.meta_details[field]);
			hasChanges = true;
		}
	}

	// Compare meta_keywords (array comparison)
	const submittedKeywords = normalizedValues.meta_details.meta_keywords
		.map((kw: string) => kw.trim())
		.filter((kw: string) => kw !== "");

	const initialKeywords = entity
		.meta_details!.meta_keywords!.split(",")
		.map((kw: string) => kw.trim())
		.filter((kw: string) => kw !== "");

	const keywordsChanged =
		submittedKeywords.length !== initialKeywords!.length ||
		!submittedKeywords.every((kw: string, i: number) => kw === initialKeywords![i]);

	if (keywordsChanged) {
		formData.set(
			"meta_details.meta_keywords",
			submittedKeywords.length > 0 ? submittedKeywords.join(",") : "",
		);
		hasChanges = true;
	}

	return {
		hasChanges,
	};
}
