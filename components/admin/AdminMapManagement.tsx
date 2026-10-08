import React from 'react';
import { RefreshCw, Map as MapIcon, PlusCircle } from 'lucide-react';
import type { AdminMaps } from '../../hooks/useAdminMaps';

interface AdminMapManagementProps {
    maps: AdminMaps;
}

const AdminMapManagement: React.FC<AdminMapManagementProps> = ({ maps }) => {
    const {
        syncingMaps,
        syncResult,
        totalMapsCount,
        newMapName,
        setNewMapName,
        newMapAuthor,
        setNewMapAuthor,
        newMapSize,
        setNewMapSize,
        newMapMaxPlayers,
        setNewMapMaxPlayers,
        newMapSupportsCtf,
        setNewMapSupportsCtf,
        newMapStyle,
        setNewMapStyle,
        newMapDownloadUrl,
        setNewMapDownloadUrl,
        newMapImageUrl,
        setNewMapImageUrl,
        addingMap,
        mapMessage,
        handleSyncMaps,
        handleAddMap
    } = maps;

    return (
        <div className="mt-8 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-gray-700 pb-4">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                        <MapIcon className="text-[#ff6600]" /> Map Database Management
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                        Manage the local catalog, sync upstream from overloadmaps.com, and register custom maps.
                        {totalMapsCount !== null && (
                            <span className="ml-2 px-2 py-0.5 rounded bg-gray-700 text-blue-400 font-mono text-xs">
                                {totalMapsCount} Maps in DB
                            </span>
                        )}
                    </p>
                </div>
                <button
                    onClick={handleSyncMaps}
                    disabled={syncingMaps}
                    className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm transition ${
                        syncingMaps ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-[#ff6600] hover:bg-[#ff7722] text-white'
                    }`}
                >
                    <RefreshCw className={`w-4 h-4 ${syncingMaps ? 'animate-spin' : ''}`} />
                    {syncingMaps ? 'Syncing Catalog...' : 'Sync Catalog from OverloadMaps.com'}
                </button>
            </div>

            {syncResult && (
                <div className={`p-3 rounded-lg text-sm mb-6 ${
                    syncResult.includes('failed') ? 'bg-red-900/50 text-red-200 border border-red-700' : 'bg-green-900/50 text-green-200 border border-green-700'
                }`}>
                    {syncResult}
                </div>
            )}

            {/* Add Custom Map Form */}
            <div className="bg-gray-900/60 p-6 rounded-lg border border-gray-700">
                <h4 className="font-bold text-gray-200 mb-4 flex items-center gap-2">
                    <PlusCircle size={18} className="text-green-400" /> Manually Add Custom Map
                </h4>

                {mapMessage && (
                    <div className={`p-3 rounded text-sm mb-4 ${
                        mapMessage.type === 'success' ? 'bg-green-900/50 text-green-200 border border-green-700' : 'bg-red-900/50 text-red-200 border border-red-700'
                    }`}>
                        {mapMessage.text}
                    </div>
                )}

                <form onSubmit={handleAddMap} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Map Name *</label>
                        <input
                            type="text"
                            required
                            value={newMapName}
                            onChange={(e) => setNewMapName(e.target.value)}
                            placeholder="e.g. Neon Citadel"
                            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white focus:outline-none focus:border-[#ff6600]"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Author</label>
                        <input
                            type="text"
                            value={newMapAuthor}
                            onChange={(e) => setNewMapAuthor(e.target.value)}
                            placeholder="e.g. PilotOne"
                            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white focus:outline-none focus:border-[#ff6600]"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Size</label>
                        <select
                            value={newMapSize}
                            onChange={(e) => setNewMapSize(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white focus:outline-none focus:border-[#ff6600]"
                        >
                            <option value="tiny">Tiny (1v1)</option>
                            <option value="small">Small (2-4)</option>
                            <option value="medium">Medium (4-8)</option>
                            <option value="large">Large (8+)</option>
                            <option value="gigantic">Gigantic (10+)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Style</label>
                        <select
                            value={newMapStyle}
                            onChange={(e) => setNewMapStyle(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white focus:outline-none focus:border-[#ff6600]"
                        >
                            <option value="mixed">Mixed</option>
                            <option value="tech">Tech</option>
                            <option value="organic">Organic</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Max Pilots</label>
                        <input
                            type="number"
                            min="2"
                            max="16"
                            value={newMapMaxPlayers}
                            onChange={(e) => setNewMapMaxPlayers(parseInt(e.target.value, 10) || 8)}
                            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white focus:outline-none focus:border-[#ff6600]"
                        />
                    </div>

                    <div className="flex items-center pt-5">
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                            <input
                                type="checkbox"
                                checked={newMapSupportsCtf}
                                onChange={(e) => setNewMapSupportsCtf(e.target.checked)}
                                className="w-4 h-4 rounded text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-500"
                            />
                            Supports CTF
                        </label>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs text-gray-400 mb-1">Download URL (.zip)</label>
                        <input
                            type="url"
                            value={newMapDownloadUrl}
                            onChange={(e) => setNewMapDownloadUrl(e.target.value)}
                            placeholder="https://.../map.zip"
                            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white focus:outline-none focus:border-[#ff6600]"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs text-gray-400 mb-1">Preview Image URL (.jpg / .png)</label>
                        <input
                            type="url"
                            value={newMapImageUrl}
                            onChange={(e) => setNewMapImageUrl(e.target.value)}
                            placeholder="https://.../map.jpg"
                            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white focus:outline-none focus:border-[#ff6600]"
                        />
                    </div>

                    <div className="md:col-span-2 flex items-end">
                        <button
                            type="submit"
                            disabled={addingMap}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm transition"
                        >
                            <PlusCircle size={16} />
                            {addingMap ? 'Adding...' : 'Save & Register Map'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminMapManagement;
