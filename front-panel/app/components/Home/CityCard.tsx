import { SUPABASE_IMAGE_BUCKET_PATH } from "@workspace/shared/constants/constants";
import type { FPHighLevelCity } from "@workspace/shared/types/cities";
import { memo } from "react";
import { Link } from "react-router";

export const CityCard = memo(({ city }: { city: FPHighLevelCity }) => {
	return (
		<Link to={`/city/${city.id}/${city.url_key}`} prefetch="intent" viewTransition>
			<div className="select-none h-88 flex flex-col max-w-60 rounded-xl shadow-lg overflow-hidden relative group">
				<div className="relative w-full h-full">
					<img
						src={SUPABASE_IMAGE_BUCKET_PATH + "/" + city.card_image}
						alt={city.name}
						title={city.name}
						className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[104%]"
					/>
					<div className="absolute bottom-3 left-3">
						<div className="inset-0 bg-black/80 bg-opacity-30 px-2 py-1 rounded-sm">
							<h3 className="font-bold text-lg text-secondary line-clamp-1">{city.name}</h3>
						</div>
					</div>
				</div>
			</div>
		</Link>
	);
});
