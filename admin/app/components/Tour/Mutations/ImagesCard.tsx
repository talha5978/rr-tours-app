import { TOUR_IMG_DIMENSTIONS } from "@workspace/shared/constants/constants";
import { type AddFormControlType } from "~/routes/Tours/add-tour";
import ImageInput from "~/components/Custom-Inputs/image-input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { useFormContext } from "react-hook-form";

type Props = {
	control: AddFormControlType;
};

export const ImagesInputCard = ({ control }: Props) => {
	const {
		formState: { errors },
	} = useFormContext();

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Images</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 gap-10 lg:grid-cols-[2fr_3fr] w-full">
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
											className="max-w-250 max-h-250"
											dimensions={TOUR_IMG_DIMENSTIONS}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<div className="grid grid-rows-1 grid-cols-1 min-[500px]:grid-cols-2 min-[500px]:grid-rows-2 gap-x-4 gap-y-5 ">
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
														dimensions={TOUR_IMG_DIMENSTIONS}
														className="max-w-250 max-h-250"
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
				{errors?.images?.root && (
					<div className="mt-4">
						<p className="text-destructive">{errors?.images?.root?.message?.toString()}</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
};
