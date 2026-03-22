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
			from: `WanderNest <inquiries@wandernest.com>`,
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
			from: `WanderNest <bookings@wandernest.com>`,
			to: EMAIL_ADDRESS_1,
			subject: `New Booking: #${booking_ref} - ${tour_name}`,
			text: `A new booking has been placed!\n\nBooking Reference: ${booking_ref}\nCustomer: ${customer_name} (${customer_email}, ${customer_phone})\nTotal: $${total.toFixed(2)}`,
			react: SoftBookingEmail(payload),
		});
	}

	/** Send confirmation email to customer */
	public async sendBookingConfirmation(payload: BookingConfirmationPayload) {
		const { booking_ref, customer_name, customer_email } = payload;

		// Build plain text email body with all tours
		const tourLines = payload.tours
			.map((tour, index) => {
				return [
					`Tour ${index + 1}: ${tour.tour_name}`,
					tour.tour_option_name ? `   Option: ${tour.tour_option_name}` : "",
					`   Confirmed: ${tour.confirmed_date || "N/A"} at ${tour.confirmed_timeslot || "N/A"}`,
					`   Participants: ${tour.participant_count}`,
					"",
				]
					.filter(Boolean)
					.join("\n");
			})
			.join("\n");

		const resendAttachments =
			payload.attachments?.map((att) => ({
				filename: att.filename,
				content: att.content instanceof Buffer ? att.content.toString("base64") : att.content,
				contentType: att.contentType || "application/pdf",
			})) ?? [];

		return this.sendEmail({
			from: `WanderNest <bookings@wandernest.com>`,
			to: customer_email,
			cc: EMAIL_ADDRESS_1,
			subject: `Booking Confirmed – #${booking_ref}`,
			text: [
				`Dear ${customer_name},`,
				``,
				`Your booking #${booking_ref} has been confirmed!`,
				``,
				`📍 Booked Tours:`,
				``,
				tourLines,
				`Grand Total: AED ${payload.total.toFixed(2)}`,
				``,
				payload.meeting_point ? `📍 Meeting Point: ${payload.meeting_point}` : "",
				payload.important_notes ? `\n📌 Important Notes:\n${payload.important_notes}\n` : "",
				``,
				`Your tickets and vouchers are attached.`,
				``,
				`Thank you for choosing WanderNest!`,
				`We look forward to seeing you soon.`,
				``,
				`Best regards,`,
				`WanderNest Team`,
			].join("\n"),
			react: BookingConfirmationEmail(payload),
			attachments: resendAttachments.length > 0 ? resendAttachments : undefined,
		});
	}

	/** Send password reset link email */
	public async sendPasswordResetLink(recoveryLink: string, email: string) {
		return this.sendEmail({
			from: `WanderNest <no-reply@wandernest.com>`,
			to: email,
			subject: `Password Reset Request - WanderNest`,
			text: `Password reset link`,
			react: PasswordResetEmail({ recoveryLink, email }),
		});
	}

	/** Send otp for admin login */
	public async sendAdminLoginOtpEmail(code: string, email: string) {
		return this.sendEmail({
			from: `WanderNest <no-reply@wandernest.com>`,
			to: email,
			subject: `Login Verification Code - WanderNest`,
			text: `Your login verification code is: ${code}`,
			react: AdminLoginOtpEmail({ code, email }),
		});
	}

	/** Send welcome email on signup */
	public async sendWelcomeEmail(firstName: string, email: string) {
		return this.sendEmail({
			from: `WanderNest <no-reply@wandernest.com>`,
			to: email,
			subject: `👋 Welcome to WanderNest, ${firstName}!`,
			text: `Welcome to WanderNest, ${firstName}! We're excited to have you on board.`,
			react: WelcomeEmail({ firstName, email }),
		});
	}
}

export const emailService = EmailService.getInstance();
