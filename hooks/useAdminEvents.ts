import { useState } from 'react';
import { deleteAdminEvent, fetchAdminEvents, saveAdminEvent, FightNightEvent } from '../services/apiService';

// The admin page's fight-night schedule (S22): the stored events, and the
// add, change and delete calls. `save` and `remove` give back what went
// wrong, or null.
export function useAdminEvents() {
    const [events, setEvents] = useState<FightNightEvent[] | null>(null);
    const [failed, setFailed] = useState(false);

    const fetchEvents = async () => {
        setFailed(false);
        try {
            setEvents(await fetchAdminEvents());
        } catch {
            setFailed(true);
        }
    };

    // a write, then the list again; the server's sentence (or `fallback`) when it fails
    const mutate = async (call: Promise<unknown>, fallback: string): Promise<string | null> => {
        try {
            await call;
            await fetchEvents();
            return null;
        } catch (e: any) {
            return e?.response?.data?.error || fallback;
        }
    };
    const save = (event: Partial<FightNightEvent>) => mutate(saveAdminEvent(event), 'The event could not be saved.');
    const remove = (id: number) => mutate(deleteAdminEvent(id), 'The event could not be deleted.');

    return { events, failed, fetchEvents, save, remove };
}
