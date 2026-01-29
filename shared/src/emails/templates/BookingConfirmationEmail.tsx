import { Container, Head, Html, Preview, Section, Text, Hr, Column, Row } from "@react-email/components";
import { EmailHeader } from "@workspace/shared/emails/components/EmailHeader";
import { EmailFooter } from "@workspace/shared/emails/components/EmailFooter";
import type { BookingConfirmationPayload } from "@workspace/shared/types/emails";
import { CONTACT_NUMBER_1 } from "@workspace/shared/constants/constants";

export default function BookingConfirmationEmail(props: BookingConfirmationPayload) {
	const {
		booking_ref,
		customer_name,
		confirmed_timeslot,
		confirmed_date,
		tour_name,
		tour_option_name,
		total_amount,
		number_of_participants,
		meeting_point,
		important_notes,
		attachments,
	} = props;

	const formatCurrency = (amount: number) =>
		`AED ${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

	return (
		<Html lang="en" suppressHydrationWarning>
			<Head />
			<Preview>
				Your booking is confirmed – {tour_name} #{booking_ref}
			</Preview>

			<Container
				style={{
					maxWidth: "600px",
					margin: "0 auto",
					fontFamily:
						"system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
					color: "#1f2937",
				}}
			>
				<EmailHeader title="Booking Confirmed!" />

				<Section style={{ padding: "0 24px 32px", marginTop: "1rem" }}>
					{/* Greeting + Confirmation Message */}
					<Text
						style={{
							fontSize: "18px",
							lineHeight: "1.6",
							color: "#111827",
							margin: "0 0 24px",
						}}
					>
						Dear {customer_name},
					</Text>

					<Text
						style={{
							fontSize: "16px",
							lineHeight: "1.6",
							color: "#374151",
							margin: "0 0 32px",
						}}
					>
						Thank you for booking with Top Attractions Dubai! Your reservation is now confirmed.
						We’re excited to welcome you.
					</Text>

					{/* Booking Details */}
					<Text
						style={{
							fontSize: "20px",
							fontWeight: 600,
							color: "#111827",
							margin: "0 0 20px",
						}}
					>
						Booking Details
					</Text>

					<Row style={{ marginBottom: "16px" }}>
						<Column style={{ width: "140px", paddingRight: "16px" }}>
							<Text style={labelStyle}>Reference</Text>
						</Column>
						<Column>
							<Text style={valueStyle}>#{booking_ref}</Text>
						</Column>
					</Row>

					<Row style={{ marginBottom: "16px" }}>
						<Column style={{ width: "140px", paddingRight: "16px" }}>
							<Text style={labelStyle}>Tour</Text>
						</Column>
						<Column>
							<Text style={valueStyle}>{tour_name}</Text>
							{tour_option_name && (
								<Text style={{ ...valueStyle, fontSize: "14px", marginTop: "4px" }}>
									Option: {tour_option_name}
								</Text>
							)}
						</Column>
					</Row>

					<Row style={{ marginBottom: "16px" }}>
						<Column style={{ width: "140px", paddingRight: "16px" }}>
							<Text style={labelStyle}>Date & Time</Text>
						</Column>
						<Column>
							<Text style={valueStyle}>
								{confirmed_date} • {confirmed_timeslot}
							</Text>
						</Column>
					</Row>

					<Row style={{ marginBottom: "16px" }}>
						<Column style={{ width: "140px", paddingRight: "16px" }}>
							<Text style={labelStyle}>Participants</Text>
						</Column>
						<Column>
							<Text style={valueStyle}>{number_of_participants} people</Text>
						</Column>
					</Row>

					{meeting_point && (
						<Row style={{ marginBottom: "16px" }}>
							<Column style={{ width: "140px", paddingRight: "16px" }}>
								<Text style={labelStyle}>Meeting Point</Text>
							</Column>
							<Column>
								<Text style={valueStyle}>{meeting_point}</Text>
							</Column>
						</Row>
					)}

					<Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />

					{/* Pricing */}
					<Text
						style={{
							fontSize: "18px",
							fontWeight: 600,
							color: "#111827",
							margin: "0 0 16px",
						}}
					>
						Payment Summary
					</Text>

					<Row style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #e5e7eb" }}>
						<Column style={{ width: "140px", paddingRight: "16px" }}>
							<Text style={{ ...labelStyle, fontSize: "16px", fontWeight: 600 }}>
								Total Paid
							</Text>
						</Column>
						<Column>
							<Text
								style={{
									fontSize: "20px",
									fontWeight: 700,
									color: "#111827",
									margin: 0,
								}}
							>
								{formatCurrency(total_amount)}
							</Text>
						</Column>
					</Row>

					{/* Attachments / Tickets Notice */}
					{attachments && attachments.length > 0 && (
						<Section style={{ marginTop: "32px" }}>
							<Text
								style={{
									fontSize: "16px",
									color: "#111827",
									fontWeight: 600,
									margin: "0 0 12px",
								}}
							>
								Your Tickets
							</Text>
							<Text
								style={{
									fontSize: "15px",
									color: "#374151",
									lineHeight: "1.6",
								}}
							>
								Please find your booking voucher(s) and ticket(s) attached to this email. You
								may bring a printed or digital copy on the day of your tour.
							</Text>
						</Section>
					)}

					{important_notes && (
						<>
							<Hr style={{ borderColor: "#e5e7eb", margin: "32px 0 24px" }} />
							<Text
								style={{
									fontSize: "18px",
									fontWeight: 600,
									color: "#111827",
									margin: "0 0 16px",
								}}
							>
								Important Notes
							</Text>
							<Text
								style={{
									fontSize: "15px",
									color: "#374151",
									lineHeight: "1.6",
									whiteSpace: "pre-wrap",
								}}
							>
								{important_notes}
							</Text>
						</>
					)}
				</Section>

				{/* Next Steps */}
				<Section style={{ padding: "0 24px 32px", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
					<Text
						style={{
							fontSize: "16px",
							fontWeight: 600,
							color: "#111827",
							margin: "0 0 16px",
							textAlign: "center",
						}}
					>
						What Happens Next?
					</Text>
					<Text
						style={{
							fontSize: "15px",
							color: "#374151",
							lineHeight: "1.6",
							textAlign: "center",
						}}
					>
						If you have any questions, send us a query or contact us at +{CONTACT_NUMBER_1}.
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
