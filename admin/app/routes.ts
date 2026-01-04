import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

export default [
	route("login", "./routes/Auth/login.tsx"),
	route("logout", "./routes/_actions/logout.tsx"),

	layout("./routes/layout.tsx", [
		index("routes/dashboard.tsx"),

		...prefix("categories", [
			index("./routes/Categories/categories.tsx"),
			route("add", "./routes/Categories/add-category.tsx"),
			...prefix(":categoryId", [route("update", "./routes/Categories/update-category.tsx")]),
		]),

		...prefix("cities", [
			index("./routes/Cities/cities.tsx"),
			route("add", "./routes/Cities/add-city.tsx"),
			...prefix(":cityId", [route("update", "./routes/Cities/update-city.tsx")]),
		]),

		route("tags", "./routes/Tags/tags.tsx", [
			route("add", "./routes/Tags/add-tag.tsx"),
			route(":id/update", "./routes/Tags/update-tag.tsx"),
		]),

		...prefix("tours", [
			index("./routes/Tours/tours.tsx"),
			route("add", "./routes/Tours/add-tour.tsx"),
			...prefix("tour/:id", [
				route(":urlKey?", "./routes/Tours/tour-details.tsx"),
				route("update", "./routes/Tours/update-tour.tsx"),
			]),
		]),

		route("*", "./routes/Error/404.tsx"),
	]),
] satisfies RouteConfig;
