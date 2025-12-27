import { useEffect, useRef, useState } from "react";
import LoadingBar, { LoadingBarRef } from "react-top-loading-bar";
import { useLocation, useNavigation } from "react-router";

export const TopLoadingBar = () => {
	const loadingBarRef = useRef<null | LoadingBarRef>(null);
	const navigation = useNavigation();
	const [isLoadingBarStarted, setIsLoadingBarStarted] = useState<boolean>(false);
	const location = useLocation();

	useEffect(() => {
		if (loadingBarRef.current != null) {
			if (navigation.state === "loading") {
				if (!location?.state?.suppressLoadingBar) {
					// Start the loading bar for non-suppressed navigations
					loadingBarRef.current.continuousStart();
					setIsLoadingBarStarted(true);
				} else {
					// Ensure suppressed navigations don't start the bar
					setIsLoadingBarStarted(false);
				}
			} else if (navigation.state === "idle" && isLoadingBarStarted) {
				// Only complete the bar if it was started
				loadingBarRef.current.complete();
				setIsLoadingBarStarted(false);
			}
		}
	}, [navigation.state, navigation.location, isLoadingBarStarted]);

	return <LoadingBar color="var(--color-primary)" ref={loadingBarRef} />;
};
