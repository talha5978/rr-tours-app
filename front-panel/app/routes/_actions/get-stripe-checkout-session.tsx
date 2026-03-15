import { BookingService } from "@workspace/shared/services/booking.service";
import { StripeServerService } from "@workspace/shared/services/stripe.service";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { type ActionFunctionArgs } from "react-router";
import z from "zod";

const checkoutSessionSchema = z.object({
	amount: z
		.number({ invalid_type_error: "Amount is required", required_error: "Amount is required" })
		.positive("Amount must be positive"),
	bookingRef: z.string({ required_error: "Booking reference is required" }),
	tour_name: z.string({ required_error: "Tour name is required" }),
	tour_cover_img_url: z.string({ required_error: "Tour cover image URL is required" }),
	description: z.string().optional(),
	successUrl: z.string({ required_error: "Success URL is required" }),
	cancelUrl: z.string({ required_error: "Cancel URL is required" }),
});

export const action = async ({ request } : ActionFunctionArgs) => {
    if(request.method !== "POST") {
        return {
            sessionId: null,
            error: new ApiError("Invalid request method", 405, []),
        }
    }

    const reqBody = await request.json(); 

    if(reqBody === null) {
        return {
            sessionId: null,
            error: new ApiError("Invalid request body", 400, []),
        }
    }
    
    const data = {
        amount: reqBody.amount as unknown as number,
        bookingRef: reqBody.bookingRef as string,
        tour_name: reqBody.tour_name as string,
        tour_cover_img_url: reqBody.tour_cover_img_url as string,
        description: (reqBody.description as unknown as string) || undefined,
        successUrl: reqBody.successUrl as string,
        cancelUrl: reqBody.cancelUrl as string,
    }

    // console.log(data);
    const parseResult = checkoutSessionSchema.safeParse(data);
    
    if(!parseResult.success) {
        return {
            sessionId: null,
            error: new ApiError(parseResult.error.message ?? "Invalid data for checkout", 400, [parseResult.error]),
        }
    }

    const stripeSvc = new StripeServerService();
    const resp = await stripeSvc.createCheckoutSession(data);

    if(resp.sessionId != null) {
        const bookingSvc = new BookingService(request);
        await bookingSvc.updateBookingCheckoutSessionId(data.bookingRef, resp.sessionId);
    }

    return resp;
}