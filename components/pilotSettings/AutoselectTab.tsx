import React from 'react';
import { RotateCcw, Crosshair, Zap } from 'lucide-react';
import { clsx } from 'clsx';
import { PilotAutoselectConfig } from '../../utils/pilotSettingsBridge';
import { usePilotSettingsAutoselect } from '../../hooks/usePilotSettingsAutoselect';
import { AutoselectPrimaryList } from './AutoselectPrimaryList';
import { AutoselectSecondaryList } from './AutoselectSecondaryList';

type AutoselectTabProps = ReturnType<typeof usePilotSettingsAutoselect> & {
    autoselectConfig: PilotAutoselectConfig | null;
};

// TAB: Weapon Autoselect & Cycling Matrix (header, logic switches, both priority lists).
export const AutoselectTab: React.FC<AutoselectTabProps> = ({
    autoselectConfig,
    handleResetAutoselectDefaults,
    toggleAutoselectSwitch,
    movePrimaryPriority,
    togglePrimaryNeverSelect,
    togglePrimaryCycle,
    moveSecondaryPriority,
    toggleSecondaryNeverSelect,
    toggleSecondaryCycle
}) => {
    return (
        <div className="space-y-6">
            {/* Autoselect Header & Reset Action */}
            <div className="bg-[#121215] border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white brand-font tracking-wider flex items-center gap-2">
                            <Crosshair className="w-5 h-5 text-[#ff6600]" />
                            <span>WEAPON AUTOSELECT &amp; CYCLING MATRIX</span>
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ff6600]/10 text-[#ff6600] border border-[#ff6600]/30 uppercase">
                            OLMOD Enhanced
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 max-w-2xl">
                        Configure automatic weapon swap priority, dual inclusion switches (Pickup Autoselect &amp; Manual Next/Prev Cycling), and combat swap logic.
                    </p>
                </div>

                <button
                    onClick={handleResetAutoselectDefaults}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 hover:text-white transition-all shadow-md shrink-0"
                    title="Restore olmod default weapon priorities, cycling, and logic switches"
                >
                    <RotateCcw className="w-4 h-4 text-[#ff6600]" />
                    <span>Reset to Defaults</span>
                </button>
            </div>

            {/* 6 Logic Switches Grid */}
            <div className="bg-[#121215] border border-gray-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                        <Zap className="w-4 h-4 text-[#ff6600]" />
                        <span>Combat Swap Logic &amp; Behavior Switches</span>
                    </h4>
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-400">Master Status:</span>
                        <button
                            onClick={() => toggleAutoselectSwitch('status')}
                            className={clsx(
                                "px-2.5 py-0.5 rounded text-[11px] font-bold uppercase transition-all",
                                autoselectConfig?.switches.status
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                    : "bg-red-500/20 text-red-400 border border-red-500/40"
                            )}
                        >
                            {autoselectConfig?.switches.status ? 'Active' : 'Inactive'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Switch 1: Primary Weapon Logic */}
                    <div className="bg-black/50 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between gap-3">
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white">Primary Weapon Logic</span>
                                <span className={clsx("text-[10px] font-bold px-1.5 py-0.5 rounded", autoselectConfig?.switches.weaponLogic ? "bg-[#ff6600]/20 text-[#ff6600]" : "bg-white/5 text-gray-400")}>
                                    {autoselectConfig?.switches.weaponLogic ? 'ON' : 'OFF'}
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                Automatically equips higher-priority primary weapons when picked up or when ammo is replenished.
                            </p>
                        </div>
                        <button
                            onClick={() => toggleAutoselectSwitch('weaponLogic')}
                            className={clsx(
                                "w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all border text-center",
                                autoselectConfig?.switches.weaponLogic
                                    ? "bg-[#ff6600]/15 border-[#ff6600]/40 text-[#ff6600] hover:bg-[#ff6600]/25"
                                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                            )}
                        >
                            {autoselectConfig?.switches.weaponLogic ? 'Disable Weapon Logic' : 'Enable Weapon Logic'}
                        </button>
                    </div>

                    {/* Switch 2: Secondary Missile Logic */}
                    <div className="bg-black/50 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between gap-3">
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white">Secondary Missile Logic</span>
                                <span className={clsx("text-[10px] font-bold px-1.5 py-0.5 rounded", autoselectConfig?.switches.missileLogic ? "bg-[#ff6600]/20 text-[#ff6600]" : "bg-white/5 text-gray-400")}>
                                    {autoselectConfig?.switches.missileLogic ? 'ON' : 'OFF'}
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                Automatically equips higher-priority secondary missiles when collected during combat.
                            </p>
                        </div>
                        <button
                            onClick={() => toggleAutoselectSwitch('missileLogic')}
                            className={clsx(
                                "w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all border text-center",
                                autoselectConfig?.switches.missileLogic
                                    ? "bg-[#ff6600]/15 border-[#ff6600]/40 text-[#ff6600] hover:bg-[#ff6600]/25"
                                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                            )}
                        >
                            {autoselectConfig?.switches.missileLogic ? 'Disable Missile Logic' : 'Enable Missile Logic'}
                        </button>
                    </div>

                    {/* Switch 3: Don't Swap While Firing */}
                    <div className="bg-black/50 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between gap-3">
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white">Don't Swap While Firing</span>
                                <span className={clsx("text-[10px] font-bold px-1.5 py-0.5 rounded", autoselectConfig?.switches.swapWhileFiring ? "bg-[#ff6600]/20 text-[#ff6600]" : "bg-white/5 text-gray-400")}>
                                    {autoselectConfig?.switches.swapWhileFiring ? 'ON' : 'OFF'}
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                Delays automatic weapon switches while primary or secondary fire is active, preventing interrupted attack bursts.
                            </p>
                        </div>
                        <button
                            onClick={() => toggleAutoselectSwitch('swapWhileFiring')}
                            className={clsx(
                                "w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all border text-center",
                                autoselectConfig?.switches.swapWhileFiring
                                    ? "bg-[#ff6600]/15 border-[#ff6600]/40 text-[#ff6600] hover:bg-[#ff6600]/25"
                                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                            )}
                        >
                            {autoselectConfig?.switches.swapWhileFiring ? 'Disable Swap Delay' : 'Enable Swap Delay'}
                        </button>
                    </div>

                    {/* Switch 4: Retry Swap After Firing */}
                    <div className="bg-black/50 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between gap-3">
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white">Retry Swap After Firing</span>
                                <span className={clsx("text-[10px] font-bold px-1.5 py-0.5 rounded", autoselectConfig?.switches.dontAutoselectAfterFiring ? "bg-[#ff6600]/20 text-[#ff6600]" : "bg-white/5 text-gray-400")}>
                                    {autoselectConfig?.switches.dontAutoselectAfterFiring ? 'ON' : 'OFF'}
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                Attempts to execute a deferred weapon switch immediately after releasing the firing trigger.
                            </p>
                        </div>
                        <button
                            onClick={() => toggleAutoselectSwitch('dontAutoselectAfterFiring')}
                            className={clsx(
                                "w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all border text-center",
                                autoselectConfig?.switches.dontAutoselectAfterFiring
                                    ? "bg-[#ff6600]/15 border-[#ff6600]/40 text-[#ff6600] hover:bg-[#ff6600]/25"
                                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                            )}
                        >
                            {autoselectConfig?.switches.dontAutoselectAfterFiring ? 'Disable Retry' : 'Enable Retry'}
                        </button>
                    </div>

                    {/* Switch 5: Devastator Alert */}
                    <div className="bg-black/50 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between gap-3">
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white">Devastator Missile Alert</span>
                                <span className={clsx("text-[10px] font-bold px-1.5 py-0.5 rounded", autoselectConfig?.switches.devAlert ? "bg-[#ff6600]/20 text-[#ff6600]" : "bg-white/5 text-gray-400")}>
                                    {autoselectConfig?.switches.devAlert ? 'ON' : 'OFF'}
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                Triggers acoustic and HUD alert signals whenever an opponent launches a Devastator missile in your vicinity.
                            </p>
                        </div>
                        <button
                            onClick={() => toggleAutoselectSwitch('devAlert')}
                            className={clsx(
                                "w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all border text-center",
                                autoselectConfig?.switches.devAlert
                                    ? "bg-[#ff6600]/15 border-[#ff6600]/40 text-[#ff6600] hover:bg-[#ff6600]/25"
                                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                            )}
                        >
                            {autoselectConfig?.switches.devAlert ? 'Disable Alert' : 'Enable Alert'}
                        </button>
                    </div>

                    {/* Switch 6: Reduced HUD */}
                    <div className="bg-black/50 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between gap-3">
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white">Reduced HUD Indicators</span>
                                <span className={clsx("text-[10px] font-bold px-1.5 py-0.5 rounded", autoselectConfig?.switches.reducedHud ? "bg-[#ff6600]/20 text-[#ff6600]" : "bg-white/5 text-gray-400")}>
                                    {autoselectConfig?.switches.reducedHud ? 'ON' : 'OFF'}
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                Simplifies autoselect weapon swap HUD notifications to minimal indicators during intense combat.
                            </p>
                        </div>
                        <button
                            onClick={() => toggleAutoselectSwitch('reducedHud')}
                            className={clsx(
                                "w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all border text-center",
                                autoselectConfig?.switches.reducedHud
                                    ? "bg-[#ff6600]/15 border-[#ff6600]/40 text-[#ff6600] hover:bg-[#ff6600]/25"
                                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                            )}
                        >
                            {autoselectConfig?.switches.reducedHud ? 'Disable Reduced HUD' : 'Enable Reduced HUD'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Dual Weapon Priority & Inclusion Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Primary Weapons */}
                <AutoselectPrimaryList
                    autoselectConfig={autoselectConfig}
                    movePrimaryPriority={movePrimaryPriority}
                    togglePrimaryNeverSelect={togglePrimaryNeverSelect}
                    togglePrimaryCycle={togglePrimaryCycle}
                />

                {/* Right Column: Secondary Missiles */}
                <AutoselectSecondaryList
                    autoselectConfig={autoselectConfig}
                    moveSecondaryPriority={moveSecondaryPriority}
                    toggleSecondaryNeverSelect={toggleSecondaryNeverSelect}
                    toggleSecondaryCycle={toggleSecondaryCycle}
                />
            </div>
        </div>
    );
};
