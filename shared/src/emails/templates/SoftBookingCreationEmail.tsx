import { Container, Head, Html, Preview, Section, Text, Hr, Column, Row } from "@react-email/components";
import { EmailHeader } from "@workspace/shared/emails/components/EmailHeader";
import { EmailFooter } from "@workspace/shared/emails/components/EmailFooter";
import type { SoftBookingEmailProps } from "@workspace/shared/types/emails";

export default function SoftBookingEmail(props: SoftBookingEmailProps) {
	const {
		date,
		total,
		customer_name,
		customer_email,
		customer_phone,
		tour_name,
		tour_option_name,
		timeslot,
		isOpenDated,
		participants,
		subtotal,
		discount,
		taxes,
		booking_ref,
	} = props;

	const formatCurrency = (amount: number) =>
		`AED ${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

	return (
		<Html lang="en" suppressHydrationWarning>
			<Head />
			<Preview>
				New Booking – {tour_name} by {customer_name}
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
				<EmailHeader title="New Booking Received" />

				<Section style={{ padding: "0 24px 32px", marginTop: "1rem" }}>
					{/* Booking Summary Header */}
					<Text
						style={{
							fontSize: "20px",
							fontWeight: 600,
							color: "#111827",
							margin: "0 0 24px",
						}}
					>
						Booking Summary
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
							<Text style={labelStyle}>Customer</Text>
						</Column>
						<Column>
							<Text style={valueStyle}>
								{customer_name}
								<br />
								<span style={{ color: "#6b7280" }}>{customer_email}</span>
								<br />
								<span style={{ color: "#6b7280" }}>{customer_phone}</span>
							</Text>
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
							<Text style={labelStyle}>Preffered Date / Slot</Text>
						</Column>
						<Column>
							<Text style={valueStyle}>
								{isOpenDated ? "Open-dated voucher" : date}
								{!isOpenDated && timeslot && ` • ${timeslot}`}
							</Text>
						</Column>
					</Row>

					<Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />

					{/* Participants */}
					<Text
						style={{
							fontSize: "18px",
							fontWeight: 600,
							color: "#111827",
							margin: "0 0 16px",
						}}
					>
						Participants
					</Text>

					{participants.map((p, index) => (
						<Row key={index} style={{ marginBottom: "12px" }}>
							<Column style={{ width: "140px", paddingRight: "16px" }}>
								<Text style={labelStyle}>{p.participant_name}</Text>
							</Column>
							<Column>
								<Text style={valueStyle}>
									{p.quantity} × {formatCurrency(p.unit_price)}
								</Text>
							</Column>
						</Row>
					))}

					<Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />

					{/* Pricing Summary */}
					<Text
						style={{
							fontSize: "18px",
							fontWeight: 600,
							color: "#111827",
							margin: "0 0 16px",
						}}
					>
						Pricing
					</Text>

					<Row style={{ marginBottom: "12px" }}>
						<Column style={{ width: "140px", paddingRight: "16px" }}>
							<Text style={labelStyle}>Subtotal</Text>
						</Column>
						<Column>
							<Text style={valueStyle}>{formatCurrency(subtotal)}</Text>
						</Column>
					</Row>

					{discount > 0 && (
						<Row style={{ marginBottom: "12px" }}>
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

					<Row style={{ marginBottom: "12px" }}>
						<Column style={{ width: "140px", paddingRight: "16px" }}>
							<Text style={labelStyle}>Taxes</Text>
						</Column>
						<Column>
							<Text style={valueStyle}>{formatCurrency(taxes)}</Text>
						</Column>
					</Row>

					<Row style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #e5e7eb" }}>
						<Column style={{ width: "140px", paddingRight: "16px" }}>
							<Text style={{ ...labelStyle, fontSize: "16px", fontWeight: 600 }}>Total</Text>
						</Column>
						<Column>
							<Text
								style={{
									fontSize: "18px",
									fontWeight: 700,
									color: "#111827",
									margin: 0,
								}}
							>
								{formatCurrency(total)}
							</Text>
						</Column>
					</Row>
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
						Soft booking created via website • Action required: confirm / follow up with customer
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
