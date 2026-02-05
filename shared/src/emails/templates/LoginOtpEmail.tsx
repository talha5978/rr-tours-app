import { Container, Head, Html, Preview, Section, Text, Hr } from "@react-email/components";
import { EmailHeader } from "@workspace/shared/emails/components/EmailHeader";
import { EmailFooter } from "@workspace/shared/emails/components/EmailFooter";

interface AdminLoginOtpProps {
	code: string;
	email: string;
}

export default function AdminLoginOtpEmail({ code, email }: AdminLoginOtpProps) {
	return (
		<Html lang="en">
			<Head />
			<Preview>Admin Panel Login Verification Code</Preview>

			<Container
				style={{
					maxWidth: "600px",
					margin: "0 auto",
					fontFamily: "system-ui, sans-serif",
					color: "#1f2937",
				}}
			>
				<EmailHeader title="Login Verification Required" />

				<Section style={{ padding: "24px" }}>
					<Text style={{ fontSize: "18px", lineHeight: "1.6" }}>Hi!</Text>

					<Text style={{ fontSize: "16px", lineHeight: "1.6", marginTop: "16px" }}>
						There is a login attempt to the admin panel. Please enter the code below to verify if
						it's you.
					</Text>

					<Section
						style={{
							textAlign: "center",
							margin: "32px 0",
							backgroundColor: "#f8fafc",
							padding: "24px",
							borderRadius: "8px",
							border: "1px solid #e2e8f0",
						}}
					>
						<Text
							style={{
								fontSize: "32px",
								fontWeight: "bold",
								letterSpacing: "8px",
								color: "#1a1a1a",
								margin: 0,
							}}
						>
							{code}
						</Text>
					</Section>

					<Text style={{ fontSize: "15px", color: "#4b5563" }}>
						Enter this code in your browser to complete the verification. This code will expire in
						1 hour.
					</Text>

					<Text style={{ fontSize: "15px", color: "#4b5563", marginTop: "16px" }}>
						If you didn't request this verification, please do not share this code with anyone.
					</Text>

					<Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />

					<Text style={{ fontSize: "14px", color: "#6b7280" }}>
						This is an automated security message for account {email}.
					</Text>
				</Section>

				<EmailFooter />
			</Container>
		</Html>
	);
}
