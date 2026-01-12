import { useState, useEffect } from "react";

const FAV_KEY = "TAD_favourite_tours_" + process.env.VITE_ENV;

function isBrowser() {
	return typeof window !== "undefined";
}

function readFavourites(): string[] {
	if (!isBrowser()) return [];
	try {
		const raw = localStorage.getItem(FAV_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

function writeFavourites(ids: string[]) {
	if (!isBrowser()) return;
	localStorage.setItem(FAV_KEY, JSON.stringify(ids));
	window.dispatchEvent(new Event("favourites-change")); // same-tab sync
}

export function clearFavourites() {
	if (!isBrowser()) return;
	writeFavourites([]);
}

export function useFavourites() {
	const [favourites, setFavourites] = useState<string[]>(() => readFavourites());

	// sync on mount and storage events
	useEffect(() => {
		function sync() {
			setFavourites(readFavourites());
		}

		window.addEventListener("storage", sync); // other tabs
		window.addEventListener("favourites-change", sync); // same tab
		return () => {
			window.removeEventListener("storage", sync);
			window.removeEventListener("favourites-change", sync);
		};
	}, []);

	// derived helpers
	const isFavourite = (tourId: string) => favourites.includes(tourId);
	const toggle = (tourId: string) => {
		const favs = readFavourites();
		let nextFavs: string[];
		if (favs.includes(tourId)) {
			nextFavs = favs.filter((id) => id !== tourId);
		} else {
			nextFavs = [...favs, tourId];
		}
		writeFavourites(nextFavs);
		setFavourites(nextFavs); // immediate update in this tab
	};

	function clear() {
		clearFavourites();
	}

	const count = favourites.length;

	return { favourites, count, isFavourite, toggle, clear };
}
