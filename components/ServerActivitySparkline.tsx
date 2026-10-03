
import React, { useMemo } from 'react';
import { GameData } from '../types';

interface ServerActivitySparklineProps {
    serverIp: string;
    activityData?: { server_ip: string; hour: string; count: number }[] | null;
}

const ServerActivitySparkline: React.FC<ServerActivitySparklineProps> = ({ serverIp, activityData }) => {
    const data = useMemo(() => {
        const hours = new Array(24).fill(0);
        if (!activityData) return hours;

        activityData.forEach(item => {
            if (item.server_ip === serverIp) {
                const h = parseInt(item.hour);
                if (!isNaN(h) && h >= 0 && h < 24) {
                    hours[h] = item.count;
                }
            }
        });
        return hours;
    }, [serverIp, activityData]);

    const max = Math.max(...data, 1); // Avoid divide by zero

    return (
        <div className="flex items-end h-8 w-24 gap-[2px]" title="24h Usage Activity">
            {data.map((count, i) => (
                <div
                    key={i}
                    className={`w-full rounded-[1px] ${count > 0 ? 'bg-[#ff6600]' : 'bg-gray-700'}`}
                    style={{
                        height: `${Math.max((count / max) * 100, 15)}%`,
                        opacity: count > 0 ? 1 : 0.3
                    }}
                />
            ))}
        </div>
    );
};

export default ServerActivitySparkline;
