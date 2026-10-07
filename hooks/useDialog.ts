import { useEffect, useId, useRef } from 'react';

const FOCUSABLE = 'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

// A modal dialog's keyboard contract. While `open`: focus moves to the panel
// (unless a field in it took focus with autoFocus), Tab and Shift+Tab stay
// inside it, Escape calls onClose, and on close focus goes back to the element
// that had it before the dialog opened.
// Spread `props` on the panel and put `titleId` on its heading.
export function useDialog<T extends HTMLElement = HTMLDivElement>(open: boolean, onClose: () => void) {
    const ref = useRef<T>(null);
    const titleId = useId();
    const close = useRef(onClose);
    close.current = onClose;

    // Who had focus when the dialog opened, read while rendering the opening
    // frame: an autoFocus field in the panel takes focus during the commit,
    // before any effect runs. Body (Safari does not focus a clicked button)
    // means no element to return to.
    const opener = useRef<HTMLElement | null>(null);
    const wasOpen = useRef(false);
    if (open && !wasOpen.current) opener.current = document.activeElement as HTMLElement | null;
    wasOpen.current = open;

    useEffect(() => {
        if (!open) return;
        const returnTo = opener.current;
        if (!ref.current?.contains(document.activeElement)) ref.current?.focus();
        const onKey = (e: KeyboardEvent) => {
            const panel = ref.current;
            if (!panel) return;
            if (e.key === 'Escape') {
                e.stopPropagation();
                close.current();
            } else if (e.key === 'Tab') {
                const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(el => el.getClientRects().length > 0);
                if (items.length === 0) {
                    e.preventDefault();
                    return;
                }
                const first = items[0], last = items[items.length - 1];
                const inside = panel.contains(document.activeElement);
                if (e.shiftKey && (!inside || document.activeElement === first || document.activeElement === panel)) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && (!inside || document.activeElement === last)) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('keydown', onKey);
            if (returnTo && returnTo !== document.body && returnTo.isConnected) returnTo.focus();
        };
    }, [open]);

    return {
        titleId,
        props: { ref, role: 'dialog', 'aria-modal': true, 'aria-labelledby': titleId, tabIndex: -1 } as const
    };
}
