import { useCallback } from 'react';
import { useQueryText } from './useLocation';

// The match page's scrubber position, in whole seconds, kept in the URL as
// `?t=` so a shared link opens the scoreboard at the same moment. null is
// the end of the match (the tracker's final scoreboard), which leaves `t` out.
// The slider follows every move; the URL catches up after a pause.
export function useMatchTime(duration: number): [number | null, (seconds: number | null) => void] {
    const [text, setText] = useQueryText('t');
    const end = Math.ceil(duration);
    const n = Number(text);
    const time = text !== '' && Number.isFinite(n) && n >= 0 && n < end ? Math.floor(n) : null;
    const setTime = useCallback((seconds: number | null) => {
        setText(seconds === null || seconds >= end ? '' : String(Math.max(0, Math.floor(seconds))));
    }, [setText, end]);
    return [time, setTime];
}
