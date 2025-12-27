import ErrorPage from "~/components/Error/ErrorPage";

export const loader = () => {
	throw new Response("", {
		status: 404,
		statusText: "Not Found",
	});
};

export default function NotFound() {
	return <ErrorPage />;
}
