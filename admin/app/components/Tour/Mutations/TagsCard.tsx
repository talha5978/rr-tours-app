import { SUPABASE_IMAGE_BUCKET_PATH } from "@workspace/shared/constants/constants";
import type { GetAllTourTags } from "@workspace/shared/types/tour-tags";
import { useFormContext } from "react-hook-form";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { FormField } from "~/components/ui/form";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { type AddFormControlType } from "~/routes/Tours/add-tour";

type Props = {
	control: AddFormControlType;
	noTags: boolean;
	tags: GetAllTourTags;
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
													className={`hover:bg-accent/50 flex items-center border-2 gap-3 rounded-lg p-2 cursor-pointer ${checked ? "bg-accent/50 border-primary" : ""}`}
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
														hidden
													/>
													<div
														key={tag.id}
														className="flex flex-col gap-2 items-center px-7 py-6 rounded-xl"
													>
														<img
															src={SUPABASE_IMAGE_BUCKET_PATH + "/" + tag.image}
															className="h-6 w-6"
														/>
														<p className="text-base">{tag.name}</p>
													</div>
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
