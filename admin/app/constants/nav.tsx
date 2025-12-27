import { IconSettings } from "@tabler/icons-react";
import {
	Archive,
	Blocks,
	Box,
	Boxes,
	FerrisWheel,
	Gift,
	House,
	LinkIcon,
	Megaphone,
	RectangleHorizontal,
	TableProperties,
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
				url: "/tours/create",
				icon: <FerrisWheel />,
			},
			{
				title: "Categories",
				url: "/categories",
				icon: <Blocks />,
			},
		],
	},
	{
		title: "Catalog",
		items: [
			{
				title: "Products",
				url: "/products",
				icon: <Archive />,
			},
			{
				title: "All Units",
				url: "/all-product-units",
				icon: <Boxes />,
			},
			{
				title: "Categories",
				url: "/categories",
				icon: <LinkIcon />,
			},
			{
				title: "Collections",
				url: "/collections",
				icon: <Tag />,
			},
			{
				title: "Product Attributes",
				url: "/product-attributes",
				icon: <TableProperties />,
			},
		],
	},
	{
		title: "Sales",
		items: [
			{
				title: "Orders",
				url: "/orders",
				icon: <Box />,
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