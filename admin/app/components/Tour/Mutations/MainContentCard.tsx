import type { AddTourInput } from "@workspace/shared/schemas/tour.schema";
import { useWatch } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Separator } from "~/components/ui/separator";
import { Switch } from "~/components/ui/switch";
import {
	CustomTagsInputClear,
	TagsInput,
	TagsInputInput,
	TagsInputItem,
	TagsInputList,
} from "~/components/ui/tags-input";
import { Textarea } from "~/components/ui/textarea";
import { type AddFormControlType } from "~/routes/Tours/add-tour";

const MAX_LANGUAGES = 8;

export const MainContentCard = ({
	control,
	cancellation_policies,
}: {
	control: AddFormControlType;
	cancellation_policies: { id: number; policy: string }[];
}) => {
	const watchedGuide = useWatch<AddTourInput>({
		control,
		name: "live_tour_guide",
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>Tour Content</CardTitle>
				<CardDescription>
					Enter the tour main content to show on the tour details page.
				</CardDescription>
			</CardHeader>
			<Separator />
			<CardContent className="space-y-4">
				{/* Overview */}
				<FormField
					control={control}
					name="overview"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Overview</FormLabel>
							<FormControl>
								<Textarea
									placeholder="e.g. Overview of the tour"
									className="min-h-24"
									maxLength={2000}
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Highlights */}
				<FormField
					control={control}
					name="highlights"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Highlights</FormLabel>
							<FormControl>
								<Textarea
									placeholder="e.g. Highlights of the tour"
									className="min-h-36"
									maxLength={1500}
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Know Before You GO */}
				<FormField
					control={control}
					name="know_before_you_go"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Know Before You Go</FormLabel>
							<FormControl>
								<Textarea
									placeholder="e.g. Important things to consider before you go"
									className="min-h-36"
									maxLength={1500}
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Age and Health Restrictions */}
				<FormField
					control={control}
					name="age_health_restrictions"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Age and Health Restrictions</FormLabel>
							<FormControl>
								<Textarea
									placeholder="e.g. Health and age specific restrictions"
									className="min-h-36"
									maxLength={1500}
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Cancellation Policy */}
				<FormField
					control={control}
					name="cancellation_policy"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Cancellation Policy</FormLabel>
							<FormControl className="mt-1">
								<RadioGroup onValueChange={field.onChange} value={field.value}>
									{/* Optional "None" */}
									<div className="flex items-center gap-3">
										<RadioGroupItem value="" id="none" />
										<Label htmlFor="none">None</Label>
									</div>

									{cancellation_policies.map((p) => (
										<div className="flex items-center gap-3" key={p.id}>
											<RadioGroupItem value={p.id.toString()} id={p.id.toString()} />
											<Label htmlFor={p.id.toString()}>{p.policy}</Label>
										</div>
									))}
								</RadioGroup>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* live_tour_guide */}
				<FormField
					control={control}
					name={`live_tour_guide`}
					render={({ field }) => (
						<FormItem className="flex items-center space-x-3 mt-6">
							<FormLabel className="text-base">Live Tour Guide Available</FormLabel>
							<FormControl>
								<Switch
									checked={field.value === "true"}
									onCheckedChange={(checked) => field.onChange(checked ? "true" : "false")}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* live_tour_guide_languages */}
				<FormField
					control={control}
					name="live_tour_guide_langs"
					render={({ field, fieldState }) => (
						<FormItem hidden={watchedGuide !== "true"}>
							<FormLabel>Tour Guide Languages</FormLabel>
							<FormControl>
								<TagsInput
									value={field.value}
									onValueChange={field.onChange}
									max={MAX_LANGUAGES}
									editable
									addOnPaste
									className="w-full"
									aria-invalid={!!fieldState.error}
								>
									<div className="flex sm:flex-row flex-col gap-2">
										<TagsInputList>
											{field.value && Array.isArray(field.value)
												? field.value.map((item) => (
														<TagsInputItem key={item} value={item}>
															{item}
														</TagsInputItem>
													))
												: null}
											<TagsInputInput placeholder="Add tour guide languages..." />
										</TagsInputList>
										<CustomTagsInputClear />
									</div>
									<div className="text-muted-foreground text-sm">
										You can add up to {MAX_LANGUAGES} keywords
									</div>
								</TagsInput>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</CardContent>
		</Card>
	);
};
