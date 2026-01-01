import { memo } from "react";
import ImageCarousel, { type ImageCarousel_BasicProps } from "~/components/ImageViewer/ImageCarousel";

const TourImageCarousel = memo(({ images, thumbPosition = "left", ...props }: ImageCarousel_BasicProps) => {
	return (
		<ImageCarousel
			images={images}
			imageFit="cover"
			thumbPosition={thumbPosition}
			aspectRatio="wide"
			showImageControls
			{...props}
		/>
	);
});

export default TourImageCarousel;
