import { EMAIL_ADDRESS_1 } from "@workspace/shared/constants/constants";
import InquiryEmail from "@workspace/shared/emails/templates/InquiryEmail";
import { type contactFormData } from "@workspace/shared/schemas/contact.schema";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { type ReactNode } from "react";
import { Resend } from "resend";
import type { Attachment } from "resend";
import type { BookingConfirmationPayload, SoftBookingEmailProps } from "@workspace/shared/types/emails";
import SoftBookingEmail from "@workspace/shared/emails/templates/SoftBookingCreationEmail";
import BookingConfirmationEmail from "@workspace/shared/emails/templates/BookingConfirmationEmail";
import PasswordResetEmail from "@workspace/shared/emails/templates/PasswordResetEmail";
import AdminLoginOtpEmail from "@workspace/shared/emails/templates/LoginOtpEmail";
import WelcomeEmail from "@workspace/shared/emails/templates/WelcomeEmail";

class EmailService {
	private static instance: EmailService | null = null;
	private resend: Resend | null = null;

	public static getInstance(): EmailService {
		if (!EmailService.instance) {
			EmailService.instance = new EmailService();
		}
		return EmailService.instance;
	}

	private initializeResend(): void {
		if (this.resend) return;

		const apiKey = process.env.RESEND_API_KEY;
		if (!apiKey) {
			console.warn("RESEND_API_KEY is not set. Email sending is disabled.");
			throw new ApiError("Email service not configured: missing RESEND_API_KEY", 500, []);
		}

		this.resend = new Resend(apiKey);
	}

	private async sendEmail({
		from,
		to,
		subject,
		text,
		attachments,
		react,
		cc,
	}: {
		from: string;
		to: string | string[];
		subject: string;
		text?: string;
		react?: ReactNode;
		attachments?: Attachment[];
		cc?: string | string[];
	}) {
		this.initializeResend();

		if (!this.resend) {
			throw new Error("Resend client not initialized");
		}

		try {
			const { data, error } = await this.resend.emails.send({
				from,
				to,
				subject,
				text,
				react,
				attachments,
				cc,
			});

			if (error) {
				throw new ApiError(error.message, error.statusCode ?? 404, []);
			}

			return data;
		} catch (err) {
			console.error(err);
			throw err;
		}
	}

	/** Send inquiry from website visitor */
	public async sendInquiry(payload: contactFormData) {
		const { full_name, email, subject, message } = payload;

		return this.sendEmail({
			from: `Top Attractions Dubai <inquiries@topattractionsdubai.com>`,
			to: EMAIL_ADDRESS_1,
			subject: `New Inquiry: ${subject}`,
			text: [
				`New Inquiry from ${full_name}`,
				`Email: ${email}`,
				`Subject: ${subject}`,
				``,
				`Message:`,
				message,
			].join("\n"),
			react: InquiryEmail({ email, full_name, message, subject }),
		});
	}

	/** Send email to agency when a new booking is created */
	public async sendSoftBookingCreationEmail(payload: SoftBookingEmailProps) {
		const { booking_ref, customer_email, customer_name, total, customer_phone, tour_name } = payload;

		return this.sendEmail({
			from: `Top Attractions Dubai <bookings@topattractionsdubai.com>`,
			to: EMAIL_ADDRESS_1,
			subject: `New Booking: #${booking_ref} - ${tour_name}`,
			text: `A new booking has been placed!\n\nBooking Reference: ${booking_ref}\nCustomer: ${customer_name} (${customer_email}, ${customer_phone})\nTotal: $${total.toFixed(2)}`,
			react: SoftBookingEmail(payload),
		});
	}

	/** Send confirmation email to customer */
	public async sendBookingConfirmation(payload: BookingConfirmationPayload) {
		const { booking_ref, tour_name, customer_name } = payload;

		const resendAttachments =
			payload.attachments?.map((att) => ({
				filename: att.filename,
				content: att.content instanceof Buffer ? att.content.toString("base64") : att.content,
				contentType: att.contentType || "application/pdf",
			})) ?? [];

		return this.sendEmail({
			from: `Top Attractions Dubai <bookings@topattractionsdubai.com>`,
			to: payload.customer_email,
			cc: EMAIL_ADDRESS_1,
			subject: `Booking Confirmed – ${tour_name} #${booking_ref}`,
			text: [
				`Dear ${customer_name},`,
				``,
				`Your booking #${booking_ref} is confirmed!`,
				`Tour: ${tour_name}`,
				`Date: ${payload.confirmed_date} at ${payload.confirmed_timeslot}`,
				`Total: AED ${payload.total_amount.toFixed(2)}`,
				``,
				`Tickets attached.`,
				`Thank you for choosing Top Attractions Dubai!`,
			].join("\n"),
			react: BookingConfirmationEmail(payload),
			attachments: resendAttachments.length > 0 ? resendAttachments : undefined,
		});
	}

	/** Send password reset link email */
	public async sendPasswordResetLink(recoveryLink: string, email: string) {
		return this.sendEmail({
			from: `Top Attractions Dubai <no-reply@topattractionsdubai.com>`,
			to: email,
			subject: `Password Reset Request - Top Attractions Dubai`,
			text: `Password reset link`,
			react: PasswordResetEmail({ recoveryLink, email }),
		});
	}

	/** Send otp for admin login */
	public async sendAdminLoginOtpEmail(code: string, email: string) {
		return this.sendEmail({
			from: `Top Attractions Dubai <no-reply@topattractionsdubai.com>`,
			to: email,
			subject: `Login Verification Code - Top Attractions Dubai`,
			text: `Your login verification code is: ${code}`,
			react: AdminLoginOtpEmail({ code, email }),
		});
	}

	/** Send welcome email on signup */
	public async sendWelcomeEmail(firstName: string, email: string) {
		return this.sendEmail({
			from: `Top Attractions Dubai <no-reply@topattractionsdubai.com>`,
			to: email,
			subject: `👋 Welcome to Top Attractions Dubai, ${firstName}!`,
			text: `Welcome to Top Attractions Dubai, ${firstName}! We're excited to have you on board.`,
			react: WelcomeEmail({ firstName, email }),
		});
	}
}

export const emailService = EmailService.getInstance();
