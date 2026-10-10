import React, { useState } from 'react';
import { CalendarDays, Pencil, Trash2 } from 'lucide-react';
import { EmptyState, ErrorState, Loading, secondaryButtonClass } from '../States';
import type { FightNightEvent } from '../../services/apiService';
import type { useAdminEvents } from '../../hooks/useAdminEvents';
import { FIGHT_NIGHT_DAY, WEEKDAYS } from '../../server/lib/gameParse.js';
import { SCHEDULE } from '../../server/lib/fightNightSchedule.js';
import { clockLabel, dayLabel, plural } from '../../server/lib/matchResult.js';

type Draft = { id?: number; kind: 'weekly' | 'once'; weekday: number; date: string; time: string; minutes: number; title: string; notes: string };
const blank = (): Draft => ({ kind: 'weekly', weekday: 5, date: '', time: '20:00', minutes: SCHEDULE.defaultMinutes, title: '', notes: '' });
const toDraft = (e: FightNightEvent): Draft => ({ id: e.id, kind: e.kind, weekday: e.weekday ?? 5, date: e.date ?? '', time: e.time, minutes: e.minutes, title: e.title, notes: e.notes });

// "Every Saturday" or "Sat, Oct 17, 2026"
const whenLabel = (e: FightNightEvent) => (e.kind === 'weekly' ? `Every ${WEEKDAYS[e.weekday ?? 0]}` : dayLabel(e.date!));

const inputClass = 'w-full bg-surface-raised border border-gray-700 focus:border-brand rounded-control px-2 py-1 text-sm text-white';
const labelClass = 'block text-2xs text-gray-400 uppercase tracking-wider mb-1';

interface AdminFightNightsProps {
    events: ReturnType<typeof useAdminEvents>;
}

// The scheduled fight nights (S22): the stored events with edit and delete,
// and a form for a new or changed one. The dashboard card and the .ics feed
// read what is saved here.
const AdminFightNights: React.FC<AdminFightNightsProps> = ({ events: { events, failed, fetchEvents, save, remove } }) => {
    const [draft, setDraft] = useState<Draft | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    // the event whose Delete was pressed once; a second press deletes it
    const [confirming, setConfirming] = useState<number | null>(null);

    const set = (patch: Partial<Draft>) => setDraft(d => d && { ...d, ...patch });
    // opens the form on a draft (or closes it) with a clean slate
    const open = (d: Draft | null) => { setDraft(d); setError(null); setConfirming(null); };

    // the server keeps the field its kind needs and ignores the other
    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!draft) return;
        setSaving(true);
        const problem = await save(draft);
        setSaving(false);
        setError(problem);
        if (!problem) setDraft(null);
    };

    const del = async (id: number) => {
        if (confirming !== id) return setConfirming(id);
        setConfirming(null);
        setError(await remove(id));
    };

    return (
        <section className="mt-8 max-w-2xl bg-surface-card border border-line rounded-card p-4 sm:p-6" aria-labelledby="admin-fight-nights-title">
            <h3 id="admin-fight-nights-title" className="text-xl font-bold mb-1 flex items-center gap-2">
                <CalendarDays className="text-brand" aria-hidden /> Fight-night schedule
            </h3>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                The nights the dashboard counts down to and the calendar feed carries. Times are {FIGHT_NIGHT_DAY.label}; a weekly rule repeats on its weekday, a one-off happens once. Discord gets a reminder {plural(SCHEDULE.reminderMinutes, 'minute', 'minutes')} before each night while posting is on.
            </p>

            {failed ? (
                <ErrorState compact title="Could not load the schedule" onRetry={fetchEvents} />
            ) : !events ? (
                <Loading compact label="Loading the schedule..." />
            ) : events.length === 0 ? (
                <EmptyState compact title="Nothing scheduled" message="Add a weekly rule or a one-off night below." />
            ) : (
                <ul className="divide-y divide-line border border-line rounded-control text-xs">
                    {events.map(e => (
                        <li key={e.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-2">
                            <span className="min-w-0">
                                <span className="text-white font-bold">{e.title}</span>
                                <span className="text-gray-400 font-mono"> · {whenLabel(e)}, {clockLabel(e.time)}, {plural(e.minutes, 'minute', 'minutes')}</span>
                                {e.notes && <span className="block text-gray-500 truncate">{e.notes}</span>}
                            </span>
                            <span className="flex gap-2 shrink-0">
                                <button type="button" onClick={() => open(toDraft(e))} className="inline-flex items-center gap-1 text-gray-400 hover:text-white rounded-control" aria-label={`Edit ${e.title}`}>
                                    <Pencil className="w-3 h-3" aria-hidden /> Edit
                                </button>
                                <button type="button" onClick={() => del(e.id)} className={`inline-flex items-center gap-1 rounded-control ${confirming === e.id ? 'text-red-400 font-bold' : 'text-gray-400 hover:text-red-400'}`} aria-label={confirming === e.id ? `Confirm deleting ${e.title}` : `Delete ${e.title}`}>
                                    <Trash2 className="w-3 h-3" aria-hidden /> {confirming === e.id ? 'Confirm delete' : 'Delete'}
                                </button>
                            </span>
                        </li>
                    ))}
                </ul>
            )}

            {error && <p role="alert" className="text-xs text-red-400 mt-3">{error}</p>}

            {draft ? (
                <form onSubmit={submit} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3" aria-label={draft.id ? 'Edit the event' : 'New event'}>
                    <div>
                        <label htmlFor="event-kind" className={labelClass}>Repeats</label>
                        <select id="event-kind" value={draft.kind} onChange={e => set({ kind: e.target.value as Draft['kind'] })} className={inputClass}>
                            <option value="weekly">Every week</option>
                            <option value="once">Once</option>
                        </select>
                    </div>
                    {draft.kind === 'weekly' ? (
                        <div>
                            <label htmlFor="event-weekday" className={labelClass}>Weekday</label>
                            <select id="event-weekday" value={draft.weekday} onChange={e => set({ weekday: Number(e.target.value) })} className={inputClass}>
                                {WEEKDAYS.map((name, i) => <option key={name} value={i}>{name}</option>)}
                            </select>
                        </div>
                    ) : (
                        <div>
                            <label htmlFor="event-date" className={labelClass}>Date</label>
                            <input id="event-date" type="date" required value={draft.date} onChange={e => set({ date: e.target.value })} className={inputClass} />
                        </div>
                    )}
                    <div>
                        <label htmlFor="event-time" className={labelClass}>Starts ({FIGHT_NIGHT_DAY.label})</label>
                        <input id="event-time" type="time" required value={draft.time} onChange={e => set({ time: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                        <label htmlFor="event-minutes" className={labelClass}>Length in minutes</label>
                        <input id="event-minutes" type="number" min={SCHEDULE.minMinutes} max={SCHEDULE.maxMinutes} step={15} required value={draft.minutes} onChange={e => set({ minutes: Number(e.target.value) })} className={inputClass} />
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor="event-title" className={labelClass}>Title</label>
                        <input id="event-title" type="text" required maxLength={SCHEDULE.titleMax} value={draft.title} onChange={e => set({ title: e.target.value })} className={inputClass} />
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor="event-notes" className={labelClass}>Notes</label>
                        <textarea id="event-notes" rows={2} maxLength={SCHEDULE.notesMax} value={draft.notes} onChange={e => set({ notes: e.target.value })} className={inputClass} />
                    </div>
                    <div className="sm:col-span-2 flex flex-wrap gap-3">
                        <button type="submit" disabled={saving} className={`${secondaryButtonClass} disabled:opacity-40`}>{saving ? 'Saving...' : draft.id ? 'Save changes' : 'Add night'}</button>
                        <button type="button" onClick={() => open(null)} className="text-xs text-gray-400 hover:text-white rounded-control">Cancel</button>
                    </div>
                </form>
            ) : (
                <button type="button" onClick={() => open(blank())} className={`${secondaryButtonClass} mt-4`}>Add a night</button>
            )}
        </section>
    );
};

export default AdminFightNights;
