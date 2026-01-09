import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

export default [
	route("robots.txt", "./routes/robots.txt.ts"),

	layout("./routes/layout.tsx", [
		index("routes/Home/home.tsx"),

		...prefix("tours", [
			index("./routes/Tour/tours.tsx"),
			route("tour/:id/:url_key", "./routes/Tour/tour-details.tsx"),
		]),

		route("city/:id/:url_key", "./routes/City/city.tsx"),
	]),

	route("*", "./routes/Error/404.tsx"),
] satisfies RouteConfig;
