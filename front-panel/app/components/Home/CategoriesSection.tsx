import type { FPHighLevelCategory } from "@workspace/shared/types/categories";
import { CategoryCard } from "~/components/Home/CategoryCard";

export default function CategoriesSection({ categories }: { categories: FPHighLevelCategory[] }) {
	return (
		<section className="sm:space-y-6 space-y-4">
			<h2 className="section-heading">Browse by Category</h2>

			<div className="grid gap-4 min-[28rem]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
				{categories.map((category) => (
					<CategoryCard key={category.id} category={category} />
				))}
			</div>
		</section>
	);
}
