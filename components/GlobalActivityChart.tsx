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
import { colors } from '../designTokens.js';
import { Loading, EmptyState, ErrorState } from './States';

const GlobalActivityChart: React.FC = () => {
    // null when the request failed
    const [data, setData] = useState<any[] | null>(null);
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

    if (loading) return <Loading compact />;
    if (!data) return <ErrorState compact title="Timeline unavailable" message="Could not load the activity timeline." />;
    if (data.length === 0) return <EmptyState compact title="No activity recorded yet." />;

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={colors.brand.DEFAULT} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={colors.brand.DEFAULT} stopOpacity={0} />
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
                            contentStyle={{ backgroundColor: '#000', border: `1px solid ${colors.line}` }}
                            itemStyle={{ color: colors.brand.DEFAULT }}
                            labelStyle={{ color: '#ccc' }}
                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke={colors.brand.DEFAULT}
                            fillOpacity={1}
                            fill="url(#colorCount)"
                            name="Games Played"
                        />
                        <Brush
                            dataKey="day"
                            height={20}
                            stroke="#444"
                            fill={colors.surface.card}
                            tickFormatter={() => ''}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

};

export default GlobalActivityChart;
