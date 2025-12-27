import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [index("routes/home.tsx"), route("*", "./routes/Error/404.tsx")] satisfies RouteConfig;
