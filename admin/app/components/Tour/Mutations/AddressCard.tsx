import { Info, MapIcon } from "lucide-react";
import { useWatch } from "react-hook-form";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { type AddFormControlType } from "~/routes/Tours/add-tour";

export function extractIframeSrc(input: string): string {
	if (!input) return "";

	// Case 1: full iframe HTML
	const iframeMatch = input.match(/<iframe[^>]*src=["']([^"']+)["']/i);
	if (iframeMatch?.[1]) {
		return iframeMatch[1];
	}

	// Case 2: User pasted only the URL
	if (input.startsWith("http")) {
		return input;
	}

	return "";
}

export const AddressCard = ({ control }: { control: AddFormControlType }) => {
	const watchedIframe = useWatch({ control, name: "address_link" });

	return (
		<Card>
			<CardHeader>
				<CardTitle>Address</CardTitle>
				<CardDescription>
					Visitors will be able to see this address on this tour details page
				</CardDescription>
			</CardHeader>
			<Separator />
			<CardContent className="space-y-4">
				{/* Address Name */}
				<FormField
					control={control}
					name="address_name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Address Name</FormLabel>
							<FormControl>
								<Input
									placeholder="e.g. Ferrari World, Abu Dhabi , Yas Island, Abu Dhabi Emirate, United Arab Emirates"
									maxLength={250}
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Address Link */}
				<FormField
					control={control}
					name="address_link"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="flex gap-2 flex-wrap justify-between">
								<div className="flex gap-2 items-center">
									<span className="self-end">Address Link</span>
									<div className="md:inline hidden">
										<Tooltip>
											<TooltipTrigger asChild>
												<Info className="size-4" />
											</TooltipTrigger>
											<TooltipContent>
												<p>
													Please enter google maps iframe link from share section of
													the current tour in google maps.
												</p>
											</TooltipContent>
										</Tooltip>
									</div>
								</div>
								<div>
									<Button variant="link" size="sm">
										<a href="https://www.google.com/maps" target="_blank">
											Go to Google Maps
										</a>
									</Button>
								</div>
							</FormLabel>
							<FormControl>
								<div className="flex gap-2 relative">
									<Input
										placeholder="Paste Google Maps iframe or link"
										value={field.value ?? ""}
										onChange={(e) => {
											const raw = e.target.value;
											const src = extractIframeSrc(raw);
											field.onChange(src);
										}}
										className="pl-10"
										spellCheck={false}
									/>
									<MapIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2" />
								</div>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div>
					{watchedIframe && typeof window != "undefined" ? (
						<iframe
							src={watchedIframe}
							width="100%"
							height="400"
							style={{ border: "0", borderRadius: "10px" }}
							allowFullScreen
							loading="lazy"
							referrerPolicy="no-referrer-when-downgrade"
						></iframe>
					) : (
						<p className="italic text-sm text-muted-foreground">No embedded link found.</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
};
