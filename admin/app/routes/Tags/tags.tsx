import { SUPABASE_IMAGE_BUCKET_PATH } from "@workspace/shared/constants/constants";
import { MoreVertical, PlusCircle } from "lucide-react";
import { Link, type LoaderFunctionArgs, Outlet, useLoaderData } from "react-router";
import { MetaDetails } from "~/components/SEO/MetaDetails";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { allTagsQuery } from "~/queries/tags.q";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const tags = await allTagsQuery({ request });
	return tags;
};

export default function TagsPage() {
	const tags = useLoaderData<typeof loader>();

	return (
		<>
			<MetaDetails
				metaTitle="Tags | Admin Panel"
				metaDescription="Manage tour tags here."
				metaKeywords="Tour Tags"
			/>
			<section className="flex flex-1 flex-col gap-6">
				<div>
					<div className="flex justify-between gap-3 flex-wrap">
						<h1 className="text-2xl font-semibold">Tags</h1>
						<Link to="/tags/add" viewTransition className="ml-auto" prefetch="intent">
							<Button size="sm" className="ml-auto">
								<PlusCircle width={18} />
								<span>Add Tag</span>
							</Button>
						</Link>
					</div>
					{/* {query && (
						<div className="mt-3">
							<p>Showing records for "{query?.trim()}"</p>
						</div>
					)} */}
				</div>
				<div className="rounded-md flex flex-col gap-4">
					{(tags.length === 0 || tags == null) && (
						<div>
							<p className="text-muted-foreground">No tags found.</p>
						</div>
					)}

					<div className="flex gap-4 flex-wrap">
						{tags.length > 0 &&
							tags.map((tag) => {
								return (
									<div className="relative">
										<div
											key={tag.id}
											className="flex flex-col gap-2 items-center px-8 py-6 bg-card rounded-xl "
										>
											<div className="absolute top-2 right-2">
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															className="h-8 w-8 p-0 cursor-pointer"
														>
															<span className="sr-only">Open menu</span>
															<MoreVertical className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<Link to={`LIVE`} viewTransition prefetch="intent">
															<DropdownMenuItem>View Live</DropdownMenuItem>
														</Link>
														<Link
															to={`/tours?tags=${tag.id}`}
															viewTransition
															prefetch="intent"
														>
															<DropdownMenuItem>View Tours</DropdownMenuItem>
														</Link>
														<Link
															to={`${tag.id}/update`}
															viewTransition
															prefetch="intent"
														>
															<DropdownMenuItem>Update</DropdownMenuItem>
														</Link>
													</DropdownMenuContent>
												</DropdownMenu>
											</div>
											<img
												src={SUPABASE_IMAGE_BUCKET_PATH + "/" + tag.image}
												className="h-6 w-6"
											/>
											<p className="text-base">{tag.name}</p>
										</div>
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
