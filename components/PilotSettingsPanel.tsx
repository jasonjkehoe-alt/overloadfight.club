import React, { useState } from 'react';
import { AlertTriangle, Lock } from 'lucide-react';
import { clsx } from 'clsx';
import { useOverloadFs } from '../context/OverloadFsContext';
import { usePilotSettings } from '../hooks/usePilotSettings';
import { useKeyRebind } from '../hooks/useKeyRebind';
import { usePilotSettingsRawEntries } from '../hooks/usePilotSettingsRawEntries';
import { usePilotSettingsAutoselect } from '../hooks/usePilotSettingsAutoselect';
import { usePilotSettingsSave } from '../hooks/usePilotSettingsSave';
import { SettingsTab } from './pilotSettings/types';
import { PilotSettingsHeader } from './pilotSettings/PilotSettingsHeader';
import { XpEditorCard } from './pilotSettings/XpEditorCard';
import { SettingsTabNav } from './pilotSettings/SettingsTabNav';
import { AutoselectTab } from './pilotSettings/AutoselectTab';
import { ControlsTab } from './pilotSettings/ControlsTab';
import { AudioTab } from './pilotSettings/AudioTab';
import { GraphicsTab } from './pilotSettings/GraphicsTab';
import { OlmodTab } from './pilotSettings/OlmodTab';
import { RawSettingsTab } from './pilotSettings/RawSettingsTab';
import { SaveActionBar } from './pilotSettings/SaveActionBar';
import { KeyRebindDialog } from './pilotSettings/KeyRebindDialog';

export const PilotSettingsPanel: React.FC = () => {
    const {
        isSupported,
        isClientConnected,
        isServerNative,
        pilots,
        activePilot,
        setActivePilot,
        dirHandle,
        connectLocalFolder
    } = useOverloadFs();

    const [activeTab, setActiveTab] = useState<SettingsTab>('controls');

    const settings = usePilotSettings({ activePilot, dirHandle, isServerNative });
    const {
        selectedPilot,
        setSelectedPilot,
        loading,
        statusMessage,
        setStatusMessage,
        gameRunning,
        xprefs,
        xprefsmod,
        xconfig,
        autoselectConfig,
        setAutoselectConfig,
        pendingPrefs,
        pendingMod,
        xpInput,
        setXpInput,
        loadPilotFiles,
        getPrefVal,
        getPrefBool,
        setPrefVal,
        getActionBinding,
        isAutoselectDirty,
        dirtyCount,
        handleDiscard
    } = settings;
    const { rebindAction, setRebindAction, rebindDialog } = useKeyRebind(settings.setPendingBindings);
    const { rawSearchQuery, setRawSearchQuery, rawFilterSource, setRawFilterSource, allRawEntries } =
        usePilotSettingsRawEntries({ xprefs, xprefsmod, pendingPrefs, pendingMod });
    const autoselect = usePilotSettingsAutoselect(autoselectConfig, setAutoselectConfig, setStatusMessage);
    const { xpSaving, backingUp, handleSaveXP, handleSaveAll, handleBackupAll } =
        usePilotSettingsSave(settings, { dirHandle, isServerNative, pilots });

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 font-mono text-gray-200">
            {/* Top Header Card */}
            <PilotSettingsHeader
                gameRunning={gameRunning}
                selectedPilot={selectedPilot}
                setSelectedPilot={setSelectedPilot}
                setActivePilot={setActivePilot}
                pilots={pilots}
                activePilot={activePilot}
                handleBackupAll={handleBackupAll}
                backingUp={backingUp}
                dirHandle={dirHandle}
                isServerNative={isServerNative}
                loadPilotFiles={loadPilotFiles}
                loading={loading}
            />

            {/* Overload Running Warning Alert Banner */}
            {gameRunning && (
                <div className="bg-red-950/40 border border-red-500/50 rounded-xl p-4 flex items-center justify-between gap-4 text-red-200 text-xs">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                        <div>
                            <span className="font-bold text-white uppercase tracking-wider">Writes are guarded:</span>
                            <span className="ml-2">Close Overload to change settings. Overload overwrites pilot configuration when exiting.</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Feedback Toast */}
            {statusMessage && (
                <div className={clsx(
                    "p-3 rounded-xl border text-xs flex items-center justify-between",
                    statusMessage.type === 'success' && "bg-emerald-950/40 border-emerald-500/40 text-emerald-300",
                    statusMessage.type === 'error' && "bg-red-950/40 border-red-500/40 text-red-300",
                    statusMessage.type === 'info' && "bg-blue-950/40 border-blue-500/40 text-blue-300"
                )}>
                    <span>{statusMessage.text}</span>
                    <button onClick={() => setStatusMessage(null)} className="opacity-60 hover:opacity-100 ml-3">✕</button>
                </div>
            )}

            {/* Folder Connection Warning if not connected */}
            {!dirHandle && !isServerNative && (
                <div className="bg-[#121215] border border-dashed border-gray-700 rounded-2xl p-8 text-center space-y-4">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-[#ff6600]/10 border border-[#ff6600]/30 flex items-center justify-center text-[#ff6600]">
                        <Lock className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white brand-font tracking-wider">
                            OVERLOAD FOLDER NOT CONNECTED
                        </h3>
                        <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
                            Connect your Overload configuration directory (<code className="text-[#ff6600]">%LocalLow%\Revival\Overload</code>) to view and edit pilot settings directly.
                        </p>
                    </div>
                    <button
                        onClick={connectLocalFolder}
                        className="px-5 py-2.5 rounded-xl bg-[#ff6600] hover:bg-[#ff8533] text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#ff6600]/20 transition-all inline-flex items-center gap-2"
                    >
                        <span>Connect Overload Folder</span>
                    </button>
                </div>
            )}

            {/* Main Editor Tabs & Interface */}
            {(dirHandle || isServerNative) && (
                <div className="space-y-6">
                    {/* Pilot XP Quick Editor Card (Item 6) */}
                    <XpEditorCard
                        xpInput={xpInput}
                        setXpInput={setXpInput}
                        handleSaveXP={handleSaveXP}
                        xpSaving={xpSaving}
                        gameRunning={gameRunning}
                    />

                    {/* Sub-Tab Navigation */}
                    <SettingsTabNav
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        isAutoselectDirty={isAutoselectDirty}
                        allRawEntries={allRawEntries}
                    />

                    {/* TAB: Weapon Autoselect & Cycling Matrix */}
                    {activeTab === 'autoselect' && (
                        <AutoselectTab autoselectConfig={autoselectConfig} {...autoselect} />
                    )}

                    {/* TAB 1: Controls & Keybindings (.xconfig) */}
                    {activeTab === 'controls' && (
                        <ControlsTab
                            getPrefVal={getPrefVal}
                            getPrefBool={getPrefBool}
                            setPrefVal={setPrefVal}
                            xconfig={xconfig}
                            getActionBinding={getActionBinding}
                            setRebindAction={setRebindAction}
                        />
                    )}

                    {/* TAB 2: General & Audio */}
                    {activeTab === 'audio' && (
                        <AudioTab getPrefVal={getPrefVal} setPrefVal={setPrefVal} />
                    )}

                    {/* TAB 3: Graphics & Video */}
                    {activeTab === 'graphics' && (
                        <GraphicsTab getPrefVal={getPrefVal} setPrefVal={setPrefVal} />
                    )}

                    {/* TAB 4: OLMOD Preferences */}
                    {activeTab === 'olmod' && (
                        <OlmodTab getPrefVal={getPrefVal} getPrefBool={getPrefBool} setPrefVal={setPrefVal} />
                    )}

                    {/* TAB 5: Raw Settings Search & Table */}
                    {activeTab === 'raw' && (
                        <RawSettingsTab
                            rawSearchQuery={rawSearchQuery}
                            setRawSearchQuery={setRawSearchQuery}
                            rawFilterSource={rawFilterSource}
                            setRawFilterSource={setRawFilterSource}
                            allRawEntries={allRawEntries}
                            setPrefVal={setPrefVal}
                        />
                    )}

                    {/* Bottom Save & Discard Action Bar */}
                    <SaveActionBar
                        dirtyCount={dirtyCount}
                        handleDiscard={handleDiscard}
                        handleSaveAll={handleSaveAll}
                        loading={loading}
                        gameRunning={gameRunning}
                    />
                </div>
            )}

            {/* Key Rebind Listener Modal */}
            {rebindAction && (
                <KeyRebindDialog
                    rebindAction={rebindAction}
                    setRebindAction={setRebindAction}
                    rebindDialog={rebindDialog}
                />
            )}
        </div>
    );
};

export default PilotSettingsPanel;
