import { useEffect, useState } from 'react';

// Copies `text` to the clipboard and says for two seconds whether it worked.
// navigator.clipboard only exists on HTTPS and localhost, so on plain HTTP the
// copy fails and the caller says so (JoinIp, the schedule's feed link).
export function useCopy(text: string) {
    const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

    useEffect(() => {
        if (status === 'idle') return;
        const timer = setTimeout(() => setStatus('idle'), 2000);
        return () => clearTimeout(timer);
    }, [status]);

    const copy = () => {
        if (!navigator.clipboard) {
            setStatus('failed');
            return;
        }
        navigator.clipboard.writeText(text).then(() => setStatus('copied'), () => setStatus('failed'));
    };

    return { status, copy };
}
