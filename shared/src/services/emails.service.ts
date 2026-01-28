import { EMAIL_ADDRESS_1 } from "@workspace/shared/constants/constants";
import InquiryEmail from "@workspace/shared/emails/templates/InquiryEmail";
import { type contactFormData } from "@workspace/shared/schemas/contact.schema";
import { ApiError } from "@workspace/shared/utils/ApiError";
import { type ReactNode } from "react";
import { Resend } from "resend";
import type { Attachment } from "resend";

interface OrderCreatedNotificationPayload {
	orderId: string;
	customerName: string;
	customerEmail: string;
	total: number;
}

interface OrderConfirmationPayload {
	orderId: string;
	customerEmail: string;
	customerName: string;
	orderDetails: string; // Or better: object with items, total, etc. – render to HTML/text
	attachments?: Array<{
		filename: string;
		content: Buffer | string; // Buffer from fetch or string (base64)
		contentType?: string; // defaults to 'application/pdf'
	}>;
	// You can pass a pre-rendered HTML string or use React Email here
}

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
	}: {
		from: string;
		to: string | string[];
		subject: string;
		text?: string;
		react?: ReactNode;
		attachments?: Attachment[];
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

	/** Send notification to agency when a new order/booking is created */
	public async sendOrderCreatedNotification(payload: OrderCreatedNotificationPayload, react: string) {
		const { orderId, customerName, customerEmail, total } = payload;

		const EMAIL_ADDRESS_1 = process.env.STORE_EMAIL || "admin@yourstore.com";

		return this.sendEmail({
			from: `Top Attractions Dubai <bookings@topattractionsdubai.com>`,
			to: EMAIL_ADDRESS_1,
			subject: `New Order Received: #${orderId}`,
			text: `A new order has been placed!\n\nOrder ID: ${orderId}\nCustomer: ${customerName} (${customerEmail})\nTotal: $${total.toFixed(2)}`,
			// html: `
			//     <h2>New Order Notification</h2>
			//     <p>A new order has been created on your store.</p>
			//     <ul>
			//     <li><strong>Order ID:</strong> ${orderId}</li>
			//     <li><strong>Customer:</strong> ${customerName} (${customerEmail})</li>
			//     <li><strong>Total Amount:</strong> $${total.toFixed(2)}</li>
			//     </ul>
			//     <p>Check the admin panel for full details.</p>
			// `,
			react,
		});
	}

	/** Send confirmation email to customer (triggered by admin after payment confirmed) */
	public async sendOrderConfirmation(payload: OrderConfirmationPayload, react: string) {
		const { orderId, customerEmail, customerName, orderDetails, attachments = [] } = payload;

		// Convert attachments to Resend format if needed
		const resendAttachments: Attachment[] = attachments.map((att) => ({
			filename: att.filename,
			content: att.content instanceof Buffer ? att.content.toString("base64") : att.content,
			contentType: att.contentType || "application/pdf",
		}));

		return this.sendEmail({
			from: `Top Attractions Dubai <bookings@topattractionsdubai.com>`,
			to: customerEmail,
			subject: `Order Confirmation - #${orderId}`,
			text: `Thank you for your order, ${customerName}!\n\nYour order #${orderId} is confirmed.\n\nDetails:\n${orderDetails}`,
			// html: `
			//     <h2>Order Confirmed!</h2>
			//     <p>Dear ${customerName},</p>
			//     <p>Your order <strong>#${orderId}</strong> has been confirmed and is being processed.</p>
			//     <h3>Order Details</h3>
			//     <pre>${orderDetails}</pre> <!-- Or better: render a table with items, total, etc. -->
			//     <p>Attached are your tour tickets (if applicable).</p>
			//     <p>Thank you for shopping with us!</p>
			// `,
			react,
			attachments: resendAttachments.length > 0 ? resendAttachments : undefined,
		});
	}
}

export const emailService = EmailService.getInstance();
