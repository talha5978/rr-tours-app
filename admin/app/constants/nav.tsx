import { IconSettings } from "@tabler/icons-react";
import {
	Archive,
	Blocks,
	CalendarCheck2,
	FerrisWheel,
	Gift,
	House,
	MapPin,
	Megaphone,
	RectangleHorizontal,
	Siren,
	Tag,
	Users,
} from "lucide-react";
import type { NavItem } from "~/types/nav";

export const mainNavItems: NavItem[] = [
	{
		title: "Quick Links",
		items: [
			{
				title: "Dashboard",
				url: "/",
				icon: <House />,
			},
			{
				title: "New Tour",
				url: "/tours/add",
				icon: <FerrisWheel />,
			},
			{
				title: "Bookings",
				url: "/bookings",
				icon: <CalendarCheck2 />,
			},
		],
	},
	{
		title: "Tours",
		items: [
			{
				title: "All Tours",
				url: "/tours",
				icon: <FerrisWheel />,
			},
			{
				title: "Categories",
				url: "/categories",
				icon: <Blocks />,
			},
			{
				title: "Tour Tags",
				url: "/tags",
				icon: <Tag />,
			},
			{
				title: "Cities",
				url: "/cities",
				icon: <MapPin />,
			},
		],
	},
	{
		title: "Bookings",
		items: [
			{
				title: "All Bookings",
				url: "/bookings",
				icon: <Archive />,
			},
			{
				title: "Customers",
				url: "/customers",
				icon: <Users />,
			},
		],
	},
	{
		title: "Promotion",
		items: [
			{
				title: "Coupons",
				url: "/coupons",
				icon: <Gift />,
			},
			{
				title: "Announcements",
				url: "/announcements",
				icon: <Megaphone />,
			},
		],
	},
	{
		title: "Content",
		items: [
			{
				title: "Hero Sections",
				url: "/hero-sections",
				icon: <RectangleHorizontal />,
			},
			{
				title: "Cancellation Policies",
				url: "/cancellation-policies",
				icon: <Siren />,
			},
		],
	},
	{
		title: "Others",
		items: [
			{
				title: "Settings",
				url: "/settings",
				icon: <IconSettings />,
			},
		],
	},
];
