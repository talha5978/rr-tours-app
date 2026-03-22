import { Container, Head, Html, Preview, Section, Text, Hr, Column, Row } from "@react-email/components";
import { EmailHeader } from "@workspace/shared/emails/components/EmailHeader";
import { EmailFooter } from "@workspace/shared/emails/components/EmailFooter";
import type { BookingConfirmationPayload } from "@workspace/shared/types/emails";
import { CONTACT_NUMBER_1 } from "@workspace/shared/constants/constants";
import { format } from "date-fns";

export default function BookingConfirmationEmail(props: BookingConfirmationPayload) {
	const {
		booking_ref,
		customer_name,
		total,
		meeting_point,
		important_notes,
		tours = [],
		subtotal,
		discount,
		taxes,
		attachments,
	} = props;

	const formatCurrency = (amount: number) =>
		`AED ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

	return (
		<Html lang="en" suppressHydrationWarning>
			<Head />
			<Preview>Your booking is confirmed! #{booking_ref}</Preview>

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
					{/* Greeting */}
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
						Thank you for booking with WanderNest! Your reservation is now confirmed. We’re
						excited to welcome you.
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

					{/* Multi-Tour List */}
					<Row style={{ marginBottom: "16px" }}>
						<Column style={{ width: "140px", paddingRight: "16px", verticalAlign: "top" }}>
							<Text style={labelStyle}>Tours</Text>
						</Column>
						<Column>
							<div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
								{tours.length === 0 ? (
									<Text style={{ ...valueStyle, color: "#9ca3af" }}>No tours found</Text>
								) : (
									tours.map((tour, index) => (
										<div key={index}>
											<Text
												style={{
													...valueStyle,
													fontWeight: 600,
													marginBottom: "4px",
												}}
											>
												{tour.tour_name}
												{tour.tour_option_name && (
													<span style={{ fontWeight: 400, color: "#6b7280" }}>
														{" "}
														— {tour.tour_option_name}
													</span>
												)}
											</Text>

											<div
												style={{
													fontSize: "14px",
													color: "#4b5563",
													lineHeight: "1.5",
												}}
											>
												<div>
													Confirmed:{" "}
													<span style={{ color: "#111827" }}>
														{tour.confirmed_date
															? format(new Date(tour.confirmed_date), "PPP")
															: "N/A"}{" "}
														• {tour.confirmed_timeslot || "—"}
													</span>
												</div>
												<div>
													Preferred:{" "}
													<span style={{ color: "#111827" }}>
														{tour.preffered_date
															? format(new Date(tour.preffered_date), "PPP")
															: "N/A"}{" "}
														• {tour.preffered_timeslot || "—"}
													</span>
												</div>
												<div style={{ marginTop: "4px" }}>
													{tour.participant_count} participant
													{tour.participant_count !== 1 ? "s" : ""}
												</div>
											</div>

											{index < tours.length - 1 && (
												<Hr style={{ borderColor: "#e5e7eb", margin: "16px 0" }} />
											)}
										</div>
									))
								)}
							</div>
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

					{/* Payment Summary */}
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

					<Row style={{ marginBottom: "8px" }}>
						<Column style={{ width: "140px", paddingRight: "16px" }}>
							<Text style={labelStyle}>Subtotal</Text>
						</Column>
						<Column>
							<Text style={valueStyle}>{formatCurrency(subtotal)}</Text>
						</Column>
					</Row>

					{discount > 0 && (
						<Row style={{ marginBottom: "8px" }}>
							<Column style={{ width: "140px", paddingRight: "16px" }}>
								<Text style={labelStyle}>Discount</Text>
							</Column>
							<Column>
								<Text style={{ ...valueStyle, color: "#dc2626" }}>
									-{formatCurrency(discount)}
								</Text>
							</Column>
						</Row>
					)}

					{taxes > 0 && (
						<Row style={{ marginBottom: "8px" }}>
							<Column style={{ width: "140px", paddingRight: "16px" }}>
								<Text style={labelStyle}>Taxes</Text>
							</Column>
							<Column>
								<Text style={valueStyle}>{formatCurrency(taxes)}</Text>
							</Column>
						</Row>
					)}

					<Row style={{ paddingTop: "12px", borderTop: "1px solid #e5e7eb" }}>
						<Column style={{ width: "140px", paddingRight: "16px" }}>
							<Text style={{ ...labelStyle, fontSize: "16px", fontWeight: 600 }}>
								Grand Total
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
								{formatCurrency(total)}
							</Text>
						</Column>
					</Row>

					{/* Attachments Notice */}
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
								Your Tickets & Vouchers
							</Text>
							<Text
								style={{
									fontSize: "15px",
									color: "#374151",
									lineHeight: "1.6",
								}}
							>
								Please find your booking voucher(s), ticket(s), and any additional documents
								attached to this email. Bring a printed or digital copy on the day of your
								tour.
							</Text>
						</Section>
					)}

					{/* Important Notes */}
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
						If you have any questions, feel free to reply to this email or contact us at +
						{CONTACT_NUMBER_1}.
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
