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

    const save = async (event: Partial<FightNightEvent>): Promise<string | null> => {
        try {
            await saveAdminEvent(event);
            await fetchEvents();
            return null;
        } catch (e: any) {
            return e?.response?.data?.error || 'The event could not be saved.';
        }
    };

    const remove = async (id: number): Promise<string | null> => {
        try {
            await deleteAdminEvent(id);
            await fetchEvents();
            return null;
        } catch (e: any) {
            return e?.response?.data?.error || 'The event could not be deleted.';
        }
    };

    return { events, failed, fetchEvents, save, remove };
}
