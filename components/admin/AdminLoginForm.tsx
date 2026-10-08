import React from 'react';
import { LayoutDashboard } from 'lucide-react';

interface AdminLoginFormProps {
    error: string;
    password: string;
    setPassword: (password: string) => void;
    handleLogin: (e: React.FormEvent) => void;
}

const AdminLoginForm: React.FC<AdminLoginFormProps> = ({ error, password, setPassword, handleLogin }) => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
            <form onSubmit={handleLogin} className="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <LayoutDashboard className="text-blue-500" /> Admin Access
                </h2>
                {error && <div className="bg-red-500/20 text-red-400 p-3 rounded mb-4">{error}</div>}
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Admin Password"
                    className="w-full bg-gray-700 border border-gray-600 rounded p-3 mb-4 text-white focus:outline-none focus:border-blue-500"
                />
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded transition">
                    Login
                </button>
            </form>
        </div>
    );
};

export default AdminLoginForm;
