import { CITY_CARD_IMG_DIMENSTIONS } from "@workspace/shared/constants/constants";
import { type FormControlType } from "~/routes/Tours/add-tour";
import ImageInput from "~/components/Custom-Inputs/image-input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";

type Props = {
	control: FormControlType;
};

export const ImagesInputCard = ({ control }: Props) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Images</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_3fr] w-full">
					<div>
						<FormField
							control={control}
							name="cover_image"
							render={() => (
								<FormItem>
									<FormLabel>Cover Image</FormLabel>
									<FormControl>
										<ImageInput
											name="cover_image"
											dimensions={CITY_CARD_IMG_DIMENSTIONS}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<div className="grid grid-cols-2 grid-rows-2 gap-x-4 gap-y-5">
						{Array(4)
							.fill(null)
							.map((_, index) => (
								<div className="h-fit" key={index}>
									<FormField
										control={control}
										name={`images.${index}`}
										render={() => (
											<FormItem>
												<FormLabel>Secondary Image {index + 1}</FormLabel>
												<FormControl>
													<ImageInput
														name={`images.${index}`}
														dimensions={CITY_CARD_IMG_DIMENSTIONS}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							))}
					</div>
				</div>
			</CardContent>
		</Card>
	);
};
