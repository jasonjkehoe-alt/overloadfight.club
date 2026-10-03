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
        <div className="bg-[#111] border border-gray-800 rounded mb-8 overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-gray-800 bg-[#161616] flex items-center gap-2">
                <Calendar className="text-[#ff6600]" size={20} />
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
