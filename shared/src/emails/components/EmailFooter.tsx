import { Hr, Section, Text } from "@react-email/components";

export function EmailFooter() {
	return (
		<Section style={{ padding: "32px 0", textAlign: "center" }}>
			<Hr style={{ borderColor: "#e5e5e5" }} />
			<Text style={{ color: "#666", fontSize: "14px", marginTop: "16px" }}>
				WanderNest • Book your adventure today
			</Text>
			<Text style={{ color: "#999", fontSize: "12px", marginTop: "8px" }}>
				© {new Date().getFullYear()} WanderNest. All rights reserved.
			</Text>
		</Section>
	);
}
