import { Link } from "react-router";
import { memo } from "react";
import { SUPABASE_IMAGE_BUCKET_PATH } from "@workspace/shared/constants/constants";
import type { FPHighLevelCategory } from "@workspace/shared/types/categories";

export const CategoryCard = memo(({ category, ...props }: { category: FPHighLevelCategory }) => {
	return (
		<Link
			to={`/tours?categories=${category.id}`}
			prefetch="intent"
			viewTransition
			className="group block h-full"
		>
			<div className="select-none relative aspect-4/3 overflow-hidden rounded-2xl border" {...props}>
				<img
					src={SUPABASE_IMAGE_BUCKET_PATH + "/" + category.image}
					alt={category.name}
					title={category.name}
					className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[104%]"
				/>
				<div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent" />

				<div className="absolute bottom-0 left-0 right-0 p-4">
					<h3 className="sm:text-md md:text-lg font-semibold text-white leading-tight">
						{category.name}
					</h3>
				</div>
			</div>
		</Link>
	);
});
