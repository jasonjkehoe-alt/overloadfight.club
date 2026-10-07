import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { colors, chartTooltip } from '../designTokens.js';

interface ActivityGraphProps {
  globalActivity?: { day: string; hour: string; count: number }[];
}

const ActivityGraph: React.FC<ActivityGraphProps> = ({ globalActivity }) => {
  const [is24Hour, setIs24Hour] = useState(true);
  // Default to current day of week (0-6), or 'all'
  const [activeTab, setActiveTab] = useState<string | number>(new Date().getDay());

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const data = useMemo(() => {
    if (!globalActivity || globalActivity.length === 0) return [];

    // Initialize 24 hour buckets
    const hours = new Array(24).fill(0).map((_, i) => ({
      hour: i,
      count: 0,
    }));

    globalActivity.forEach(item => {
      const h = parseInt(item.hour);
      const d = parseInt(item.day);

      if (!isNaN(h) && h >= 0 && h < 24) {
        // If All Days selected, sum everything
        if (activeTab === 'all') {
          hours[h].count += item.count;
        }
        // If specific day selected, only add if match
        else if (d === activeTab) {
          hours[h].count += item.count;
        }
      }
    });

    // If "All Days", maybe average it? The user asked for "breakdown", usually aggregation is fine or average.
    // Existing "All Time" charts usually sum. But if we sum 365 days, the numbers will be huge compared to a single day.
    // The previous implementation was grouping by hour over the whole dataset (Sum).
    // So 'all' should behave like the original: Sum of all activity at that hour across all days.

    return hours;
  }, [globalActivity, activeTab]);

  if (!data || data.length === 0) return null;

  // Find current time for the red line
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentDay = now.getDay();

  // Only show the "Now" line if we are viewing "All Days" OR the current day
  const showNowLine = activeTab === 'all' || activeTab === currentDay;

  // Calculate position percentage for the red line (0-100%) representing 00:00 to 23:59
  const timePercentage = ((currentHour + currentMinutes / 60) / 24) * 100;

  // Helper to format time
  const formatTimeLabel = (hour: number) => {
    if (is24Hour) return `${hour}:00`;
    const h = hour % 12 || 12;
    const ampm = hour < 12 ? 'AM' : 'PM';
    return `${h} ${ampm}`;
  };

  const formatCurrentTime = (date: Date) => {
    if (is24Hour) {
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="w-full h-full relative flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">

        {/* Day Tabs */}
        <div className="flex bg-surface-page rounded-control border border-line p-1 overflow-x-auto max-w-full">
          {DAYS.map((day, i) => (
            <button
              key={day}
              onClick={() => setActiveTab(i)}
              className={`px-3 py-1 rounded-control text-2xs font-bold uppercase transition-colors whitespace-nowrap ${activeTab === i
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-surface-raised'
                }`}
            >
              {day}
            </button>
          ))}
          <div className="w-[1px] bg-gray-800 mx-1"></div>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-control text-2xs font-bold uppercase transition-colors whitespace-nowrap ${activeTab === 'all'
                ? 'bg-gray-700 text-white'
                : 'text-gray-500 hover:text-gray-300 hover:bg-surface-raised'
              }`}
          >
            All Days
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-600 font-mono self-end sm:self-auto">
          <span className="hidden sm:inline">LOCAL: <span className="text-gray-300">{formatCurrentTime(now)}</span></span>
          <button
            onClick={() => setIs24Hour(!is24Hour)}
            className="text-brand hover:text-white border border-brand hover:bg-brand px-1.5 py-0.5 rounded-control transition-all text-2xs font-bold"
          >
            {is24Hour ? '12H' : '24H'}
          </button>
        </div>
      </div>

      <div className="flex-1 w-full relative min-h-0">
        {/* Red Current Time Line Overlay */}
        {showNowLine && (
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-red-600 z-10 pointer-events-none shadow-[0_0_4px_rgba(220,38,38,0.8)]"
            style={{
              left: `${timePercentage}%`
            }}
          >
            <div className="absolute -top-1 -left-[3px] w-2 h-2 bg-red-600 rounded-full shadow-sm"></div>
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
            <XAxis
              dataKey="hour"
              stroke="#444"
              tick={{ fontSize: 10, fill: '#666' }}
              tickFormatter={(val) => val % 3 === 0 ? formatTimeLabel(val) : ''}
              interval={0}
              axisLine={false}
              tickLine={false}
              dy={5}
            />
            <Tooltip
              cursor={{ fill: '#222' }}
              contentStyle={{ ...chartTooltip, fontSize: '12px' }}
              labelFormatter={(label) => `${formatTimeLabel(label)} - ${formatTimeLabel(label + 1)}`}
              formatter={(value) => [value, 'Games Played']}
              itemStyle={{ color: '#fff' }}
              labelStyle={{ color: '#ccc' }}
            />
            <Bar dataKey="count" radius={[2, 2, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={activeTab === 'all'
                    ? '#333' // Darker for aggregate view
                    : index === currentHour && showNowLine
                      ? colors.brand.DEFAULT
                      : '#262626'
                  }
                  stroke={index === currentHour && showNowLine ? colors.brand.hover : 'none'}
                  strokeWidth={index === currentHour && showNowLine ? 1 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ActivityGraph;
