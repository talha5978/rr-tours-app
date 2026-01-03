import { createContext, useState } from "react";

export type ViewMode = "table" | "grid";

type ToursPageCtxType = {
	view_mode: ViewMode;
	setViewMode: (mode: ViewMode) => void;
};

const initialCtxState: ToursPageCtxType = {
	view_mode: "table",
	setViewMode: (_) => {},
};

export const ToursPageCtx = createContext<ToursPageCtxType>(initialCtxState);

export default function ToursPageContex({ children }: { children: React.ReactNode }) {
	const [viewMode, setViewMode] = useState<ViewMode>();

	const values: ToursPageCtxType = {
		view_mode: viewMode || initialCtxState.view_mode,
		setViewMode: (mode: ViewMode) => setViewMode(mode),
	};

	return <ToursPageCtx.Provider value={values}>{children}</ToursPageCtx.Provider>;
}
