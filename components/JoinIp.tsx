import React, { useEffect, useState } from 'react';
import { Copy, Check } from 'lucide-react';

// "Join at <ip>" with a copy button that says whether the copy worked.
// navigator.clipboard only exists on HTTPS and localhost, so on plain HTTP
// the button says so and a click on the IP selects it for a manual copy.
const JoinIp: React.FC<{ ip: string }> = ({ ip }) => {
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
        navigator.clipboard.writeText(ip).then(() => setStatus('copied'), () => setStatus('failed'));
    };

    return (
        <div className="flex items-center gap-2 text-sm font-mono text-gray-400">
            <span>Join at <span className="text-white select-all">{ip}</span></span>
            <button
                onClick={copy}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-control border border-gray-700 hover:border-brand text-xs text-gray-400 hover:text-brand transition-colors"
                title={`Copy ${ip}`}
            >
                {status === 'copied' ? (
                    <span className="text-green-400 flex items-center gap-1"><Check size={12} /> Copied</span>
                ) : status === 'failed' ? (
                    <span className="text-red-400">Copy failed, select the IP</span>
                ) : (
                    <><Copy size={12} /> Copy IP</>
                )}
            </button>
        </div>
    );
};

export default JoinIp;
