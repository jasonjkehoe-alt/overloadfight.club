import React from 'react';
import { LayoutDashboard } from 'lucide-react';

interface AdminDashboardConfigProps {
    showColdStorage: boolean;
    setShowColdStorage: (show: boolean) => void;
    saveSetting: (key: string, value: string) => void;
}

const AdminDashboardConfig: React.FC<AdminDashboardConfigProps> = ({ showColdStorage, setShowColdStorage, saveSetting }) => {
    return (
        <div className="mt-8">
            {/* Dashboard Settings */}
            <div className="max-w-md bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <LayoutDashboard className="text-orange-400" /> Dashboard Config
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                        <div>
                            <p className="font-bold text-white text-sm">Show Archive</p>
                            <p className="text-xs text-gray-400">Show the Archive link on the dashboard</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={showColdStorage}
                                onChange={(e) => {
                                    setShowColdStorage(e.target.checked);
                                    saveSetting('show_cold_storage', String(e.target.checked));
                                }}
                            />
                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardConfig;
