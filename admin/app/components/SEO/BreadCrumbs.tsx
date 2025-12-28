// import { Fragment } from "react";
// import { Link, useLocation } from "react-router";
// import { resolveBreadcrumbs } from "~/utils/breadCrumbUtil";
// import {
// 	Breadcrumb,
// 	BreadcrumbItem,
// 	BreadcrumbLink,
// 	BreadcrumbList,
// 	BreadcrumbSeparator,
// } from "~/components/ui/breadcrumb";

// interface BreadcrumbsProps {
// 	params?: Record<string, string>;
// }

// export function Breadcrumbs({ params = {} }: BreadcrumbsProps) {
// 	const { pathname } = useLocation();
// 	const items = resolveBreadcrumbs(pathname, params);
// 	// console.log(items);

// 	return (
// 		<nav className="mb-4">
// 			<Breadcrumb>
// 				<BreadcrumbList>
// 					{items.map((item, index) => (
// 						<Fragment key={index}>
// 							<BreadcrumbItem>
// 								<BreadcrumbLink asChild>
// 									<Link to={item.href}>{item.label}</Link>
// 								</BreadcrumbLink>
// 							</BreadcrumbItem>
// 							{index < items.length - 1 && <BreadcrumbSeparator />}
// 						</Fragment>
// 					))}
// 				</BreadcrumbList>
// 			</Breadcrumb>
// 		</nav>
// 	);
// }
