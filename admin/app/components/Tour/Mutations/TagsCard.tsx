import { useFormContext } from "react-hook-form";
import { Link } from "react-router";
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
				{tags.length > 0 ? (
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
																	? selectedTags.filter(
																			(id) => id !== value,
																		)
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
				) : (
					<div className="flex items-center gap-2 text-sm">
						<span className="text-muted-foreground">No tags found.</span>
						<Link to={"/tags/add"}>
							<span className="text-primary underline-offset-4 hover:underline">Add Tag</span>
						</Link>
					</div>
				)}
				<div className="flex justify-end">
					<Button type="button" size="sm" onClick={() => setValue("tags", [])} disabled={noTags}>
						Unselect All
					</Button>
				</div>
			</CardContent>
		</Card>
	);
};
