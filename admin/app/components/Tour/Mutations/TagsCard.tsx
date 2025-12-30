import { useFormContext } from "react-hook-form";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { FormField } from "~/components/ui/form";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { type FormControlType } from "~/routes/Tours/add-tour";

type Props = {
	control: FormControlType;
	noTags: boolean;
	tags: { id: number; name: string }[];
};

export const TagsCard = ({ control, tags, noTags }: Props) => {
	const { setValue } = useFormContext();

	return (
		<Card>
			<CardHeader>
				<CardTitle>Tags</CardTitle>
				<CardDescription>
					These tags are used to filter out and sub categorize the tours.
				</CardDescription>
			</CardHeader>
			<Separator />
			<CardContent className="space-y-6">
				<div className="flex gap-4 flex-wrap">
					<FormField
						control={control}
						name="tags"
						render={({ field }) => {
							const selectedTags = field.value ?? [];

							return (
								<div className="flex gap-4 flex-wrap">
									{tags.map((tag) => {
										const value = tag.id.toString();
										const checked = selectedTags.includes(value);

										return (
											<Label
												key={tag.id}
												className="hover:bg-accent/50 flex items-center gap-3 rounded-lg border p-2 cursor-pointer"
											>
												<Checkbox
													checked={checked}
													onCheckedChange={() => {
														field.onChange(
															checked
																? selectedTags.filter((id) => id !== value)
																: [...selectedTags, value],
														);
													}}
												/>
												<span className="text-sm font-medium">{tag.name}</span>
											</Label>
										);
									})}
								</div>
							);
						}}
					/>
				</div>
				<div className="flex justify-end">
					<Button type="button" size="sm" onClick={() => setValue("tags", [])} disabled={noTags}>
						Unselect All
					</Button>
				</div>
			</CardContent>
		</Card>
	);
};
