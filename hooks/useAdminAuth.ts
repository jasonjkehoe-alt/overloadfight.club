import React, { useState } from 'react';
import { fetchAdminAuthStatus, submitAdminLogin } from '../services/apiService';

// Admin session: whether the panel is logged in, the password field, and the
// panel's shared error message (the login form and the stats load both set it).
export function useAdminAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const checkAuth = async () => {
        try {
            const data = await fetchAdminAuthStatus();
            setIsAuthenticated(data.isAuthenticated);
        } catch (e) {
            setIsAuthenticated(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await submitAdminLogin(password);
            setIsAuthenticated(true);
            setError('');
        } catch (e) {
            setError('Invalid password');
        }
    };

    return { isAuthenticated, setIsAuthenticated, password, setPassword, error, setError, checkAuth, handleLogin };
}
