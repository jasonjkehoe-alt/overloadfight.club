import React, { useState } from 'react';
import { User, HardDrive, FolderOpen, Check, Unplug, RefreshCw, Sliders } from 'lucide-react';
import { useOverloadFs } from '../context/OverloadFsContext';
import { PilotSettingsPanel } from './PilotSettingsPanel';
import { ErrorBoundary } from './ErrorBoundary';

export const PilotManager: React.FC = () => {
    const {
        isSupported,
        isServerNative,
        isClientConnected,
        isConnecting,
        folderName,
        activePilot,
        connectLocalFolder,
        disconnectLocalFolder
    } = useOverloadFs();

    const [copiedPath, setCopiedPath] = useState(false);

    const handleCopyPath = () => {
        navigator.clipboard.writeText('%LOCALAPPDATA%Low\\Revival\\Overload');
        setCopiedPath(true);
        setTimeout(() => setCopiedPath(false), 2000);
    };

    return (
        <ErrorBoundary>
            <div className="w-full text-gray-200 flex flex-col selection:bg-brand selection:text-black pb-16 space-y-6">
                {/* Dedicated Top-Level Pilot Bar */}
                <div className="border-b border-gray-800 bg-[#0d0d0f]/90 backdrop-blur-md sticky top-16 z-30 font-mono rounded-t-xl">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                        {/* Title & Badge */}
                        <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-xl bg-[#ff6600]/10 border border-[#ff6600]/40 flex items-center justify-center text-[#ff6600] shadow-[0_0_15px_rgba(255,102,0,0.2)]">
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-lg md:text-xl font-bold tracking-wider brand-font text-white flex items-center gap-2">
                                    PILOT <span className="text-[#ff6600]">MANAGER</span>
                                </h1>
                                <p className="text-[10px] text-gray-500 hidden sm:block uppercase tracking-widest">
                                    Local Configuration &bull; Weapon Autoselect &bull; Controls
                                </p>
                            </div>
                        </div>

                        {/* Game Path and Connection Controls */}
                        <div className="flex items-center space-x-2 sm:space-x-3 text-xs">
                            {isClientConnected ? (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/30 text-emerald-300">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    <span className="hidden lg:inline font-semibold">Connected:</span>
                                    <span className="truncate max-w-[120px] font-bold text-white">{activePilot || folderName}</span>
                                    <button
                                        onClick={disconnectLocalFolder}
                                        className="ml-1 text-emerald-400/60 hover:text-red-400 p-0.5 rounded transition-colors"
                                        title="Disconnect local PC folder"
                                    >
                                        <Unplug className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ) : isServerNative ? (
                                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-500/40 bg-blue-950/30 text-blue-300">
                                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                    <span>Local Bridge Active</span>
                                </div>
                            ) : (
                                <button
                                    onClick={connectLocalFolder}
                                    disabled={isConnecting}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#ff6600]/60 bg-[#ff6600]/15 hover:bg-[#ff6600]/25 text-[#ff6600] hover:text-white font-bold transition-all shadow-[0_0_12px_rgba(255,102,0,0.15)]"
                                    title="Connect to %LocalLow%\Revival\Overload on your PC"
                                >
                                    {isConnecting ? (
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <HardDrive className="w-3.5 h-3.5" />
                                    )}
                                    <span>{isConnecting ? 'Connecting...' : 'Connect PC Folder'}</span>
                                </button>
                            )}

                            <button
                                onClick={handleCopyPath}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-800 hover:border-[#ff6600]/40 text-gray-400 hover:text-white transition-all"
                                title="Copy game root configuration path: %LOCALAPPDATA%Low\Revival\Overload"
                            >
                                {copiedPath ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FolderOpen className="w-3.5 h-3.5 text-[#ff6600]" />}
                                <span>{copiedPath ? 'Path Copied' : 'Game Path'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Pilot Settings Panel */}
                <PilotSettingsPanel />
            </div>
        </ErrorBoundary>
    );
};

export default PilotManager;
