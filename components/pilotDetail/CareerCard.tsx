import React from 'react';
import { History } from 'lucide-react';
import { Loading, EmptyState, ErrorState } from '../States';
import { PilotCareer } from '../../services/apiService';
import { useLoad } from '../../hooks/useLoad';
import LastTimeOut from './LastTimeOut';
import CareerArc from './CareerArc';
import ActivityCalendar from './ActivityCalendar';

// The pilot page's career block: the last time out, the career arc and the
// activity calendar, from /api/pilot/:name/career. PilotDetail loads it
// (useLoad) beside its own requests, so a change of mode does not ask again.
const CareerCard: React.FC<{ load: ReturnType<typeof useLoad<PilotCareer>> }> = ({ load: { data: career, failed, retry } }) => {
    if (failed) return <ErrorState compact title="Career unavailable" message="Could not load this pilot's career." onRetry={retry} />;

    return (
        <section className="bg-surface-card border border-line rounded-card p-4 font-mono space-y-6" aria-labelledby="career-title">
            <h3 id="career-title" className="text-gray-300 font-bold flex items-center gap-2">
                <History size={16} className="text-brand" aria-hidden /> Career
            </h3>
            {!career ? (
                <Loading compact label="Loading career..." />
            ) : !career.lastOut && career.calendar.days.length === 0 && career.months.length === 0 ? (
                <EmptyState compact title="No matches yet" />
            ) : (
                <>
                    {career.lastOut && <LastTimeOut lastOut={career.lastOut} today={career.calendar.until} />}
                    {career.months.length > 0
                        ? <CareerArc months={career.months} />
                        : <EmptyState compact title="No ranked match yet" message="The career arc counts matches the career cards count." />}
                    <ActivityCalendar calendar={career.calendar} />
                </>
            )}
        </section>
    );
};

export default CareerCard;
