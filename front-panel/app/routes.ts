import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

export default [
	route("robots.txt", "./routes/robots.txt.ts"),
	route("sitemap.xml", "./routes/sitemap.xml.ts"),

	route("/logout", "./routes/_actions/logout.tsx"),
	route("/login/google", "./routes/_actions/google-login.tsx"),
	route("/auth/callback", "./routes/Auth/google-login-callback.tsx"),

	layout("./routes/layout.tsx", [
		index("routes/Home/home.tsx"),
		route("/login", "./routes/Auth/login.tsx"),
		route("/forgot-password", "./routes/Auth/forgot-password.tsx"),
		route("/update-password", "./routes/Auth/update-password.tsx"),
		route("/signup", "./routes/Auth/signup.tsx"),

		...prefix("tours", [
			index("./routes/Tour/tours.tsx"),
			route("tour/:id/:url_key", "./routes/Tour/tour-details.tsx"),
		]),

		route("city/:id/:url_key", "./routes/City/city.tsx"),

		route("booking", "./routes/Booking/booking.tsx"),
		route("payment", "./routes/Payment/Payment.tsx"),
		route("track-booking", "./routes/Booking/track-booking.tsx"),

		route("my-favourites", "./routes/Favourites/my-favourites.tsx"),

		route("contact-us", "./routes/Contact/contact-us.tsx"),
		route("about", "./routes/About/about.tsx"),
		route("faqs", "./routes/FAQs/faqs.tsx"),
		route("privacy-policy", "./routes/Miscellaneous/PrivacyPolicy.tsx"),
		route("terms-of-usage", "./routes/Miscellaneous/TermsOfUsage.tsx"),

		route("email-preview", "./routes/email-preview.tsx"),

		layout("./routes/Account/account-layout.tsx", [
			...prefix("account", [
				route("details", "./routes/Account/account-details.tsx"),
				route("bookings", "./routes/Account/my-bookings.tsx"),
				route("reviews", "./routes/Account/my-reviews.tsx"),
			]),
		]),

		route("add-review", "./routes/_actions/add-review.tsx"),
		route("delete-review", "./routes/_actions/delete-review.tsx"),

		route("collection/:id", "./routes/Collections/collection-tours.tsx"),
	]),

	route("*", "./routes/Error/404.tsx"),
] satisfies RouteConfig;
