import { AdminDashboardService } from "@workspace/shared/services/admin-dashboard.service";
import type { ActionFunctionArgs } from "react-router";

export const action = async ({ request }: ActionFunctionArgs) => {
	const formData = await request.json();
	const p = {
		startDate: formData.startDate as string,
		endDate: formData.endDate as string,
	};

	if (!p.startDate || !p.endDate) {
		throw new Error("Start date and end date are required");
	}
	if (p.startDate > p.endDate) {
		throw new Error("Start date must be before end date");
	}

	const dashboardService = new AdminDashboardService(request);
	const data = await dashboardService.fetchBookingsForExport(p.startDate, p.endDate);

	if (!data || data.length === 0) {
		return { sheetData: [] };
	}

	const sheetData = data.flatMap((booking) => {
		// Handle case when booking has no items
		if (!booking.booking_items || booking.booking_items.length === 0) {
			return [
				{
					"Booking Ref": booking.booking_ref,
					"Created At": booking.created_at
						? new Date(booking.created_at).toLocaleString("en-US", {
								timeZone: "Asia/Karachi",
							})
						: "",
					"Customer Name": booking.customer_name || "",
					"Customer Email": booking.customer_email || "",
					"Customer Phone": booking.customer_phone || "",
					"Tour Option": "",
					Quantity: 1,
					Subtotal: booking.subtotal_amount,
					Discount: booking.discount,
					Taxes: booking.taxes,
					Total: booking.total,
					"Booking Status": booking.booking_status,
					"Payment Status": booking.payment?.payment_status || "",
					"Paid Amount": booking.payment?.paid_amount || 0,
					"Paid At": booking.payment?.paid_at
						? new Date(booking.payment.paid_at).toLocaleString("en-US", {
								timeZone: "Asia/Karachi",
							})
						: "",
				},
			];
		}

		// Main logic: One row per booking_item (best for multiple tours/options)
		return booking.booking_items.map((item) => ({
			"Booking Ref": booking.booking_ref,
			"Created At": booking.created_at
				? new Date(booking.created_at).toLocaleString("en-US", { timeZone: "Asia/Karachi" })
				: "",
			"Customer Name": booking.customer_name || "",
			"Customer Email": booking.customer_email || "",
			"Customer Phone": booking.customer_phone || "",

			"Tour Option": item.tour_options ? item.tour_options.name : "N/A",

			Subtotal: booking.subtotal_amount,
			Discount: booking.discount,
			Taxes: booking.taxes,
			Total: booking.total,

			"Booking Status": booking.booking_status,
			"Payment Status": booking.payment?.payment_status || "",
			"Paid Amount": booking.payment?.paid_amount || 0,
			"Paid At": booking.payment?.paid_at
				? new Date(booking.payment.paid_at).toLocaleString("en-US", {
						timeZone: "Asia/Karachi",
					})
				: "",
		}));
	});

	return { sheetData };
};
