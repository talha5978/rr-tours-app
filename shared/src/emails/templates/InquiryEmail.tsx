import { Container, Head, Html, Preview, Section, Text } from "@react-email/components";
import { EmailHeader } from "@workspace/shared/emails/components/EmailHeader";
import { EmailFooter } from "@workspace/shared/emails/components/EmailFooter";
import type { contactFormData } from "@workspace/shared/schemas/contact.schema";

interface InquiryEmailProps extends contactFormData {}

export default function InquiryEmail(props: InquiryEmailProps) {
	const { full_name, email, subject: _, message } = props;

	return (
		<Html lang="en" suppressHydrationWarning>
			<Head />
			<Preview>New inquiry from {full_name}</Preview>
			<Container style={{ maxWidth: "600px", margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
				<EmailHeader title="New Inquiry Received" />

				<Section style={{ padding: "24px" }}>
					<Text style={{ fontSize: "16px", color: "#333" }}>
						<strong>Name:</strong> {full_name}
					</Text>
					<Text style={{ fontSize: "16px", color: "#333" }}>
						<strong>Email:</strong> {email}
					</Text>
					<Text style={{ fontSize: "16px", color: "#333", marginTop: "16px" }}>
						<strong>Message:</strong>
					</Text>
					<Text style={{ whiteSpace: "pre-wrap", color: "#444", lineHeight: "1.6" }}>
						{message}
					</Text>
				</Section>

				<EmailFooter />
			</Container>
		</Html>
	);
}
