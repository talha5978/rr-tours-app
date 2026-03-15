import { Container, Head, Html, Preview, Section, Text, Hr, Button } from "@react-email/components";
import { EmailHeader } from "@workspace/shared/emails/components/EmailHeader";
import { EmailFooter } from "@workspace/shared/emails/components/EmailFooter";

interface WelcomeEmailProps {
	firstName: string;
	email: string;
	loginUrl?: string;
}

export default function WelcomeEmail({
	firstName,
	email,
	loginUrl = process.env.VITE_MAIN_APP_URL + "/login",
}: WelcomeEmailProps) {
	const name = firstName || "there";

	return (
		<Html lang="en">
			<Head />
			<Preview>Welcome to WanderNest – Let's start exploring!</Preview>

			<Container
				style={{
					maxWidth: "600px",
					margin: "0 auto",
					fontFamily:
						"system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
					color: "#1f2937",
				}}
			>
				<EmailHeader title="Welcome Aboard!" />

				<Section style={{ padding: "24px" }}>
					<Text style={{ fontSize: "18px", lineHeight: "1.6" }}>Hi {name},</Text>

					<Text style={{ fontSize: "16px", lineHeight: "1.6", marginTop: "16px" }}>
						Thank you for joining <strong>WanderNest</strong>!
					</Text>

					<Text style={{ fontSize: "16px", lineHeight: "1.6", marginTop: "12px" }}>
						We're thrilled to have you with us. Get ready to discover the best tours, attractions,
						and experiences Dubai has to offer — all in just a few clicks.
					</Text>

					<Section style={{ textAlign: "center", margin: "32px 0" }}>
						<Button
							href={loginUrl}
							style={{
								backgroundColor: "#22c55e",
								color: "white",
								padding: "14px 32px",
								borderRadius: "6px",
								textDecoration: "none",
								fontWeight: 500,
								fontSize: "16px",
								display: "inline-block",
							}}
						>
							Start Exploring Now
						</Button>
					</Section>

					<Text style={{ fontSize: "15px", color: "#4b5563", lineHeight: "1.6" }}>
						With your new account you can:
					</Text>

					<ul
						style={{
							fontSize: "15px",
							color: "#4b5563",
							lineHeight: "1.8",
							paddingLeft: "20px",
							margin: "12px 0 24px 0",
						}}
					>
						<li>Book amazing tours and activities instantly</li>
						<li>Save your favorite experiences and come back later</li>
						<li>Manage bookings and view trip details</li>
						<li>Get exclusive offers and updates</li>
					</ul>

					<Text style={{ fontSize: "15px", color: "#4b5563" }}>
						If you ever need help, our support team is just one message away.
					</Text>

					<Hr style={{ borderColor: "#e5e7eb", margin: "32px 0 24px 0" }} />

					<Text style={{ fontSize: "14px", color: "#6b7280", lineHeight: "1.5" }}>
						This email was sent to <strong>{email}</strong> because you signed up for an account
						with WanderNest.
						<br />
						If this wasn't you, please ignore this message or contact support.
					</Text>
				</Section>

				<EmailFooter />
			</Container>
		</Html>
	);
}
