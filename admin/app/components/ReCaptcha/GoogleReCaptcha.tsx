import { useEffect, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";

type GoogleReCaptchaProps = {
	siteKey: string;
	onChange: (token: string | null) => void;
};

export async function verifyRecaptcha(token: string) {
	const resp = await fetch("https://www.google.com/recaptcha/api/siteverify", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			secret: process.env.RECAPTCHA_SECRET_KEY as string,
			response: token,
		}),
	});

	return resp.json() as Promise<{ success: boolean; score?: number }>;
}

export function GoogleReCaptcha({ siteKey, onChange }: GoogleReCaptchaProps) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) return null;
	if (typeof window == "undefined") return null;

	return <ReCAPTCHA sitekey={siteKey} onChange={onChange} suppressHydrationWarning={true} />;
}
