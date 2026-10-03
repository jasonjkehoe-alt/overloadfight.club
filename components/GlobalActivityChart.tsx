import React, { useEffect, useState } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Brush
} from 'recharts';
import { Activity } from 'lucide-react';

const GlobalActivityChart: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/stats/activity-timeline');
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (e) {
                console.error("Failed to load activity timeline", e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return null; // Or skeleton
    if (data.length === 0) return null;

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ff6600" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#ff6600" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis
                            dataKey="day"
                            stroke="#666"
                            fontSize={10}
                            tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            minTickGap={30}
                            height={30}
                        />
                        <YAxis stroke="#666" fontSize={10} width={30} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                            itemStyle={{ color: '#ff6600' }}
                            labelStyle={{ color: '#ccc' }}
                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#ff6600"
                            fillOpacity={1}
                            fill="url(#colorCount)"
                            name="Games Played"
                        />
                        <Brush
                            dataKey="day"
                            height={20}
                            stroke="#444"
                            fill="#111"
                            tickFormatter={() => ''}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

};

export default GlobalActivityChart;
