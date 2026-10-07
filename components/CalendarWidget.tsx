import React, { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';

const CalendarWidget: React.FC = () => {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/calendar-url')
            .then(res => res.json())
            .then(data => setUrl(data.url))
            .catch(err => console.error(err));
    }, []);

    if (!url) return null;

    return (
        <div className="bg-surface-card border border-line rounded-card mb-8 overflow-hidden">
            <div className="p-4 border-b border-line bg-surface-raised flex items-center gap-2">
                <Calendar className="text-brand" size={20} />
                <h3 className="text-white font-bold uppercase text-sm">Upcoming Events</h3>
            </div>
            <div className="p-1 bg-white">
                <iframe
                    src={url}
                    style={{ border: 0 }}
                    width="100%"
                    height="400"
                    frameBorder="0"
                    scrolling="no"
                ></iframe>
            </div>
        </div>
    );
};

export default CalendarWidget;
