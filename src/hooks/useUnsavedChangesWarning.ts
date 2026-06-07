import { useContext, useEffect, useCallback, useState } from 'react';
import { UNSAFE_NavigationContext as NavigationContext, Navigator } from 'react-router-dom';
// import { History, Transition } from 'history'; // React Router v6 uses its own history type internally, roughly compatible

/**
 * Hook to prompt the user when they try to navigate away with unsaved changes.
 * 
 * @param isDirty - Boolean indicating if the form has unsaved changes
 * @param blockerEnabledRef - Optional ref to enable/disable the blocker synchronously
 * @returns Object containing modal state and handlers
 */
export const useUnsavedChangesWarning = (
    isDirty: boolean,
    blockerEnabledRef?: React.MutableRefObject<boolean>
) => {
    const { navigator } = useContext(NavigationContext);
    const [showModal, setShowModal] = useState(false);
    const [nextLocation, setNextLocation] = useState<(() => void) | null>(null);
    const [confirmedNavigation, setConfirmedNavigation] = useState(false);

    const shouldBlockNavigation = () =>
        isDirty && (blockerEnabledRef?.current ?? true);

    // Handle browser's native "Leave site?" dialog (refresh/close tab)
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (shouldBlockNavigation()) {
                e.preventDefault();
                e.returnValue = ''; // Chrome requires returnValue to be set
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isDirty]);

    // Handle in-app navigation (links, back button)
    useEffect(() => {
        if (!isDirty || confirmedNavigation) return;

        // The type definition for navigator in react-router-dom v6's Context is a bit opaque
        // but at runtime it is the history object from the history package (or similar adapter)
        const history = navigator as any; // Cast to any to access push/replace/go listeners

        // We need to intercept the push/replace calls
        const originalPush = history.push;
        const originalReplace = history.replace;
        const originalGo = history.go;

        history.push = (...args: any[]) => {
            if (shouldBlockNavigation()) {
                setNextLocation(() => () => originalPush.apply(history, args));
                setShowModal(true);
                return;
            }
            originalPush.apply(history, args);
        };

        history.replace = (...args: any[]) => {
            if (shouldBlockNavigation()) {
                setNextLocation(() => () => originalReplace.apply(history, args));
                setShowModal(true);
                return;
            }
            originalReplace.apply(history, args);
        };

        // Intercept back/forward
        // "go" usually takes a delta number
        history.go = (...args: any[]) => {
            if (shouldBlockNavigation()) {
                setNextLocation(() => () => originalGo.apply(history, args));
                setShowModal(true);
                return;
            }
            originalGo.apply(history, args);
        }

        return () => {
            // Restore original functions
            history.push = originalPush;
            history.replace = originalReplace;
            history.go = originalGo;
        };
    }, [isDirty, navigator, confirmedNavigation]);

    const confirmNavigation = useCallback(() => {
        setConfirmedNavigation(true); // Disable the blocker
        setShowModal(false);
    }, []);

    // Effect to handle navigation after confirmation
    // This ensures the blocker effect is cleaned up (removing overrides) BEFORE we attempt to navigate
    useEffect(() => {
        if (confirmedNavigation && nextLocation) {
            const navigate = nextLocation;
            setNextLocation(null); // Clear the pending location
            navigate();
        }
    }, [confirmedNavigation, nextLocation]);

    const cancelNavigation = useCallback(() => {
        setShowModal(false);
        setNextLocation(null);
    }, []);

    return {
        showModal,
        confirmNavigation,
        cancelNavigation
    };
};
