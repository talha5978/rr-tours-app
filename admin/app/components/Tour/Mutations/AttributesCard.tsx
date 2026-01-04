import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormMessage } from "~/components/ui/form";
import { Label } from "~/components/ui/label";
import { AddFormControlType } from "~/routes/Tours/add-tour";

type Props = {
	control: AddFormControlType;
};

export const AttributesCard = ({ control }: Props) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Attributes</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* isFeatured */}
				<FormField
					control={control}
					name="isFeatured"
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<Label className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-4 cursor-pointer">
									<Checkbox
										checked={field.value === "true"}
										onCheckedChange={() => {
											field.onChange(field.value === "true" ? "false" : "true");
										}}
									/>
									<div className="grid gap-1.5 font-normal">
										<p className="text-sm leading-none font-medium">Featured Tour</p>
										<p className="text-muted-foreground text-sm">
											Tour will be displayed as main tour on the home page.
										</p>
									</div>
								</Label>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Active Status */}
				<FormField
					control={control}
					name="isActive"
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<Label className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-4 cursor-pointer">
									<Checkbox
										checked={field.value === "true"}
										onCheckedChange={() => {
											field.onChange(field.value === "true" ? "false" : "true");
										}}
									/>
									<div className="grid gap-1.5 font-normal">
										<p className="text-sm leading-none font-medium">Toggle Status</p>
										<p className="text-muted-foreground text-sm">
											Tour will be set as inactive and not displayed on the website.
										</p>
									</div>
								</Label>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Free cancellation */}
				<FormField
					control={control}
					name="free_cancelation_avilable"
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<Label className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-4 cursor-pointer">
									<Checkbox
										checked={field.value === "true"}
										onCheckedChange={() => {
											field.onChange(field.value === "true" ? "false" : "true");
										}}
									/>
									<div className="grid gap-1.5 font-normal">
										<p className="text-sm leading-none font-medium">Free Cancellation</p>
										<p className="text-muted-foreground text-sm">
											Tour can be claimed to be cancelled for free if active.
										</p>
									</div>
								</Label>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Wheel chair accessible */}
				<FormField
					control={control}
					name="isWeelChairAccessible"
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<Label className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-4 cursor-pointer">
									<Checkbox
										checked={field.value === "true"}
										onCheckedChange={() => {
											field.onChange(field.value === "true" ? "false" : "true");
										}}
									/>
									<div className="grid gap-1.5 font-normal">
										<p className="text-sm leading-none font-medium">
											Wheel Chair Accessible
										</p>
										<p className="text-muted-foreground text-sm">
											Tour will be marked as accessible for people with wheel chair.
										</p>
									</div>
								</Label>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</CardContent>
		</Card>
	);
};
