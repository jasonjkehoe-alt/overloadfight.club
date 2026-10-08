import { useEffect } from 'react';
import { useAdminAuth } from './useAdminAuth';
import { useAdminStats } from './useAdminStats';
import { useAdminSettings } from './useAdminSettings';
import { useAdminMaps } from './useAdminMaps';
import { useAdminArchiveSync } from './useAdminArchiveSync';

// The admin page's state, grouped by section. On mount it checks the session
// and loads the build version; once authenticated it loads every section and
// polls stats and archive status every 2 s until logged out or unmounted.
export function useAdminPanel() {
    const auth = useAdminAuth();
    const overview = useAdminStats({ setError: auth.setError, setIsAuthenticated: auth.setIsAuthenticated });
    const settings = useAdminSettings();
    const maps = useAdminMaps();
    const archive = useAdminArchiveSync();

    const { isAuthenticated, checkAuth } = auth;
    const { fetchVersion, fetchStats } = overview;
    const { fetchSettings } = settings;
    const { fetchMapCount } = maps;
    const { fetchArchiveStatus } = archive;

    useEffect(() => {
        checkAuth();
        fetchVersion();
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchStats();
            fetchSettings();
            fetchMapCount();
            fetchArchiveStatus();
            const interval = setInterval(() => {
                fetchStats();
                fetchArchiveStatus();
            }, 2000); // Poll for updates
            return () => clearInterval(interval);
        }
    }, [isAuthenticated]);

    return { auth, overview, settings, maps, archive };
}
