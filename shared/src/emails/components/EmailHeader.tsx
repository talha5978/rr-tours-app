import { Column, Container, Row, Section, Text } from "@react-email/components";

interface EmailHeaderProps {
	title: string;
}

export function EmailHeader({ title }: EmailHeaderProps) {
	return (
		<Section style={{ backgroundColor: "#f7f7f7", padding: "20px 0" }}>
			<Container>
				<Row>
					<Column align="center">
						<Text
							style={{
								fontSize: "28px",
								fontWeight: "bold",
								color: "#1a1a1a",
								margin: "16px 0 0",
							}}
						>
							{title}
						</Text>
					</Column>
				</Row>
			</Container>
		</Section>
	);
}
