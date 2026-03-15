import { Container, Head, Html, Preview, Section, Text, Button, Hr } from "@react-email/components";
import { EmailFooter } from "@workspace/shared/emails/components/EmailFooter";
import { EmailHeader } from "@workspace/shared/emails/components/EmailHeader";

interface RecoveryEmailProps {
	recoveryLink: string;
	email: string;
}

export default function PasswordResetEmail({ recoveryLink, email }: RecoveryEmailProps) {
	return (
		<Html lang="en">
			<Head />
			<Preview>Reset your password for WanderNest</Preview>

			<Container
				style={{
					maxWidth: "600px",
					margin: "0 auto",
					fontFamily: "system-ui, sans-serif",
					color: "#1f2937",
				}}
			>
				<EmailHeader title="Password Reset Request" />

				<Section style={{ padding: "24px" }}>
					<Text style={{ fontSize: "18px", lineHeight: "1.6" }}>Hello,</Text>

					<Text style={{ fontSize: "16px", lineHeight: "1.6", marginTop: "16px" }}>
						We received a request to reset the password for your account ({email}).
					</Text>

					<Section style={{ textAlign: "center", margin: "32px 0" }}>
						<Button
							href={recoveryLink}
							style={{
								backgroundColor: "#22c55e",
								color: "white",
								padding: "12px 20px",
								borderRadius: "6px",
								textDecoration: "none",
								fontWeight: 500,
								fontSize: "16px",
							}}
						>
							Reset Password
						</Button>
					</Section>

					<Text style={{ fontSize: "15px", color: "#4b5563" }}>
						If you didn’t request a password reset, you can safely ignore this email.
					</Text>

					<Hr style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />

					<Text style={{ fontSize: "14px", color: "#6b7280" }}>
						The link will expire in 1 hour for security reasons.
					</Text>
				</Section>

				<EmailFooter />
			</Container>
		</Html>
	);
}
