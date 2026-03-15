import { Container, Head, Html, Preview, Section, Text, Hr, Column, Row } from "@react-email/components";
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

			<Container
				style={{
					maxWidth: "600px",
					margin: "0 auto",
					fontFamily:
						"system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
					color: "#1f2937",
				}}
			>
				<EmailHeader title="New Inquiry Received" />

				<Section style={{ padding: "0 24px 32px", marginTop: "1rem" }}>
					<Text
						style={{
							fontSize: "20px",
							fontWeight: 600,
							color: "#111827",
							margin: "0 0 24px",
						}}
					>
						Customer Details
					</Text>

					<Row style={{ marginBottom: "20px" }}>
						<Column style={{ width: "120px", paddingRight: "16px" }}>
							<Text style={labelStyle}>Name</Text>
						</Column>
						<Column>
							<Text style={valueStyle}>{full_name}</Text>
						</Column>
					</Row>

					<Row style={{ marginBottom: "20px" }}>
						<Column style={{ width: "120px", paddingRight: "16px" }}>
							<Text style={labelStyle}>Email</Text>
						</Column>
						<Column>
							<Text style={valueStyle}>{email}</Text>
						</Column>
					</Row>

					<Hr
						style={{
							borderColor: "#e5e7eb",
							margin: "24px 0",
						}}
					/>

					<Text
						style={{
							fontSize: "20px",
							fontWeight: 600,
							color: "#111827",
							margin: "0 0 20px",
						}}
					>
						Message
					</Text>

					<Text
						style={{
							fontSize: "15px",
							lineHeight: "1.7",
							color: "#374151",
							whiteSpace: "pre-wrap",
							backgroundColor: "#f9fafb",
							padding: "16px 20px",
							borderRadius: "6px",
							border: "1px solid #e5e7eb",
						}}
					>
						{message}
					</Text>
				</Section>

				<Section style={{ padding: "0 24px 32px" }}>
					<Text
						style={{
							fontSize: "14px",
							color: "#6b7280",
							textAlign: "center",
							lineHeight: "1.5",
						}}
					>
						This message was sent from the contact form on wandernest.com
					</Text>
				</Section>

				<EmailFooter />
			</Container>
		</Html>
	);
}

const labelStyle = {
	fontSize: "15px",
	fontWeight: 500,
	color: "#4b5563",
	margin: 0,
};

const valueStyle = {
	fontSize: "15px",
	color: "#111827",
	margin: 0,
	fontWeight: 500,
};
