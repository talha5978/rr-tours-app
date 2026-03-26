import { SUPABASE_IMAGE_BUCKET_PATH } from "@workspace/shared/constants/constants";
import { Loader2, PencilLineIcon, PlusCircle, Trash } from "lucide-react";
import { useEffect } from "react";
import { Link, type LoaderFunctionArgs, Outlet, useFetcher, useLoaderData } from "react-router";
import { toast } from "sonner";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { Button } from "~/components/ui/button";
import { allHeroSectionsQuery } from "~/queries/hero-sections.q";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const hero_sections = await allHeroSectionsQuery({ request });
	return hero_sections;
};

export default function HeroSectionsPage() {
	const hero_sections = useLoaderData<typeof loader>();
	const fetcher = useFetcher();

	useEffect(() => {
		if (fetcher.data) {
			if (fetcher.data.success) {
				toast.success("Hero section deleted successfully");
			} else if (fetcher.data.error) {
				toast.error(fetcher.data.error);
			}
		}
	}, [fetcher.data]);

	const handleDeleteClick = (id: number) => {
		const formData = new FormData();
		formData.append("id", id.toString());
		fetcher.submit(formData, {
			method: "POST",
			action: `/hero-sections/${id}/delete`,
		});
	};

	return (
		<>
			<MetaDetails
				metaTitle="Hero Sections | Admin Panel"
				metaDescription="Manage hero sections here."
				metaKeywords="Hero Sections, Admin Panel, Manage Hero Sections"
			/>
			<section className="flex flex-1 flex-col gap-6">
				<div>
					<div className="flex justify-between gap-3 flex-wrap">
						<h1 className="text-2xl font-semibold">Hero Sections</h1>
						<Link to="/hero-sections/add" viewTransition className="ml-auto" prefetch="intent">
							<Button size="sm" className="ml-auto">
								<PlusCircle width={18} />
								<span>Add Hero Section</span>
							</Button>
						</Link>
					</div>
				</div>
				<div className="rounded-md flex flex-col gap-4">
					{(hero_sections.length === 0 || hero_sections == null) && (
						<div>
							<p className="text-muted-foreground">No hero sections found.</p>
						</div>
					)}

					<div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
						{hero_sections.length > 0 &&
							hero_sections.map((hero_section) => {
								return (
									<div
										className={`relative w-full rounded-lg border border-border aspect-4/3 shadow-sm group`}
									>
										<div className="absolute bottom-3 right-3 z-20">
											<div className="flex gap-2">
												<Link
													to={"/hero-sections/" + hero_section.id + "/update"}
													prefetch="intent"
													viewTransition
												>
													<Button
														className="cursor-pointer"
														variant={"outline"}
														size={"icon"}
													>
														<PencilLineIcon className="size-4" />
													</Button>
												</Link>
												<Button
													className="cursor-pointer"
													variant={"destructive"}
													size={"icon"}
													onClick={() => handleDeleteClick(hero_section.id)}
													disabled={fetcher.state === "submitting"}
												>
													{fetcher.state === "submitting" ? (
														<Loader2 className="size-4 animate-spin" />
													) : (
														<Trash className="size-4" />
													)}
												</Button>
											</div>
										</div>
										<div className="absolute inset-0 bg-linear-to-t from-black/10 via-black/10 to-transparent rounded-lg" />
										<img
											src={SUPABASE_IMAGE_BUCKET_PATH + "/" + hero_section.image}
											alt={hero_section.name}
											title={hero_section.name}
											className="border border-border rounded-lg h-full w-full object-cover"
										/>
									</div>
								);
							})}
					</div>
				</div>
			</section>
			<Outlet />
		</>
	);
}
