import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
	route("login", "./routes/Auth/login.tsx"),
	route("logout", "./routes/_actions/logout.tsx"),

	layout("./routes/layout.tsx", [index("routes/dashboard.tsx"), route("*", "./routes/Error/404.tsx")]),
] satisfies RouteConfig;
