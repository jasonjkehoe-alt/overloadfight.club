import React from 'react';
import { Gamepad2, Keyboard } from 'lucide-react';
import { clsx } from 'clsx';
import { ParsedXConfig, getUnityKeyName } from '../../utils/pilotSettingsBridge';
import { PrefAccessors } from './types';

type ControlsTabProps = PrefAccessors & {
    xconfig: ParsedXConfig | null;
    getActionBinding: (actionName: string, slot: 1 | 2) => number;
    setRebindAction: (action: { actionName: string; slot: 1 | 2 }) => void;
};

// Actions list for Keybindings display
const actionGroups = [
    {
        title: 'Movement & 6-DOF Flight',
        actions: [
            { id: 'MOVE_FORE', label: 'Move Forward (Thrust)' },
            { id: 'MOVE_BACK', label: 'Move Backward (Reverse)' },
            { id: 'SLIDE_LEFT', label: 'Slide Left (Strafe)' },
            { id: 'SLIDE_RIGHT', label: 'Slide Right (Strafe)' },
            { id: 'SLIDE_UP', label: 'Slide Up (Levitate)' },
            { id: 'SLIDE_DOWN', label: 'Slide Down (Descend)' },
            { id: 'ROLL_LEFT', label: 'Roll Counter-Clockwise' },
            { id: 'ROLL_RIGHT', label: 'Roll Clockwise' },
            { id: 'TURN_LEFT', label: 'Turn Left (Yaw)' },
            { id: 'TURN_RIGHT', label: 'Turn Right (Yaw)' },
            { id: 'PITCH_UP', label: 'Pitch Up (Nose Up)' },
            { id: 'PITCH_DOWN', label: 'Pitch Down (Nose Down)' }
        ]
    },
    {
        title: 'Combat & Ordnance',
        actions: [
            { id: 'FIRE_WEAPON', label: 'Primary Weapon (Laser/Cannon)' },
            { id: 'FIRE_MISSILE', label: 'Secondary Missile (Launch)' },
            { id: 'SWITCH_WEAPON', label: 'Next Primary Weapon' },
            { id: 'SWITCH_MISSILE', label: 'Next Secondary Missile' },
            { id: 'FIRE_FLARE', label: 'Deploy Flare / Countermeasure' },
            { id: 'USE_BOOST', label: 'Afterburner / Speed Boost' },
            { id: 'SMASH_ATTACK', label: 'Smash Attack (Melee/Ram)' }
        ]
    },
    {
        title: 'Tactical & Cockpit Views',
        actions: [
            { id: 'REAR_VIEW', label: 'Rear View Mirror' },
            { id: 'VIEW_MAP', label: 'Guidebot / Auto-Map' },
            { id: 'TOGGLE_HEADLIGHT', label: 'Headlight Toggle' },
            { id: 'TOGGLE_COCKPIT', label: 'Cockpit Geometry View' },
            { id: 'TOGGLE_HUD', label: 'HUD Overlay Toggle' },
            { id: 'FULL_CHAT', label: 'Open Multiplayer Chat' }
        ]
    }
];

// TAB 1: Controls & Keybindings (.xconfig).
export const ControlsTab: React.FC<ControlsTabProps> = ({
    getPrefVal,
    getPrefBool,
    setPrefVal,
    xconfig,
    getActionBinding,
    setRebindAction
}) => {
    return (
        <div className="space-y-6">
            {/* Sensitivity and Flight controls card */}
            <div className="bg-[#121215] border border-gray-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-[#ff6600]" />
                    <span>FLIGHT &amp; SENSITIVITY CONFIGURATION</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-300">Mouse Sensitivity X</span>
                            <span className="text-[#ff6600] font-bold">{getPrefVal('O_MOUSE_SENS_X') || '100'}%</span>
                        </div>
                        <input
                            type="range"
                            min="10"
                            max="300"
                            value={getPrefVal('O_MOUSE_SENS_X') || '100'}
                            onChange={(e) => setPrefVal('O_MOUSE_SENS_X', e.target.value)}
                            className="w-full accent-[#ff6600]"
                        />
                    </div>

                    <div className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-300">Mouse Sensitivity Y</span>
                            <span className="text-[#ff6600] font-bold">{getPrefVal('O_MOUSE_SENS_Y') || '100'}%</span>
                        </div>
                        <input
                            type="range"
                            min="10"
                            max="300"
                            value={getPrefVal('O_MOUSE_SENS_Y') || '100'}
                            onChange={(e) => setPrefVal('O_MOUSE_SENS_Y', e.target.value)}
                            className="w-full accent-[#ff6600]"
                        />
                    </div>

                    <div className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-300">Joystick Speed</span>
                            <span className="text-[#ff6600] font-bold">{getPrefVal('O_JOY_SPEED') || '7'}</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="15"
                            value={getPrefVal('O_JOY_SPEED') || '7'}
                            onChange={(e) => setPrefVal('O_JOY_SPEED', e.target.value)}
                            className="w-full accent-[#ff6600]"
                        />
                    </div>

                    <label className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between cursor-pointer">
                        <span className="text-xs text-gray-300">Invert Pitch (Mouse Y)</span>
                        <input
                            type="checkbox"
                            checked={getPrefVal('O_INVERT_MOUSE') === '1' || getPrefVal('O_INVERT_MOUSE') === 'T'}
                            onChange={(e) => setPrefVal('O_INVERT_MOUSE', e.target.checked ? '1' : '0')}
                            className="accent-[#ff6600] w-4 h-4"
                        />
                    </label>

                    <label className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between cursor-pointer">
                        <span className="text-xs text-gray-300">Auto-Leveling</span>
                        <input
                            type="checkbox"
                            checked={getPrefVal('O_AUTO_LEVEL') === '1' || getPrefVal('O_AUTO_LEVEL') === 'T'}
                            onChange={(e) => setPrefVal('O_AUTO_LEVEL', e.target.checked ? '1' : '0')}
                            className="accent-[#ff6600] w-4 h-4"
                        />
                    </label>

                    <label className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between cursor-pointer">
                        <span className="text-xs text-gray-300">OLMOD Mouse Roll Fix</span>
                        <input
                            type="checkbox"
                            checked={getPrefBool('MOUSE_ROLL_FIX', true)}
                            onChange={(e) => setPrefVal('MOUSE_ROLL_FIX', e.target.checked, true)}
                            className="accent-[#ff6600] w-4 h-4"
                        />
                    </label>
                </div>
            </div>

            {/* Keybindings Table from .xconfig */}
            <div className="bg-[#121215] border border-gray-800 rounded-2xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-4">
                    <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Keyboard className="w-4 h-4 text-[#ff6600]" />
                            <span>INPUT &amp; CONTROLLER BINDINGS (.XCONFIG)</span>
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                            Click any button to listen for keyboard or mouse button input to rebind.
                        </p>
                    </div>
                    {xconfig?.controllers && xconfig.controllers.length > 0 && (
                        <div className="text-[11px] text-gray-400 bg-black/60 px-3 py-1.5 rounded-lg border border-white/10">
                            Detected: {xconfig.controllers.join(', ')}
                        </div>
                    )}
                </div>

                {actionGroups.map(group => (
                    <div key={group.title} className="space-y-3">
                        <h4 className="text-xs font-bold text-[#ff6600] uppercase tracking-wider">
                            {group.title}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {group.actions.map(act => {
                                const k1 = getActionBinding(act.id, 1);
                                const k2 = getActionBinding(act.id, 2);

                                return (
                                    <div
                                        key={act.id}
                                        className="bg-black/40 border border-white/5 hover:border-white/15 p-3 rounded-xl flex items-center justify-between gap-3 text-xs"
                                    >
                                        <div className="truncate">
                                            <div className="font-bold text-white">{act.label}</div>
                                            <div className="text-[10px] text-gray-500 font-mono">{act.id}</div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {/* Primary Key Button */}
                                            <button
                                                onClick={() => setRebindAction({ actionName: act.id, slot: 1 })}
                                                className={clsx(
                                                    "px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border",
                                                    k1 > 0 
                                                        ? "bg-white/10 border-white/20 text-white hover:border-[#ff6600]" 
                                                        : "bg-black/60 border-white/10 text-gray-500 hover:text-white"
                                                )}
                                            >
                                                {getUnityKeyName(k1)}
                                            </button>

                                            {/* Secondary Key Button */}
                                            <button
                                                onClick={() => setRebindAction({ actionName: act.id, slot: 2 })}
                                                className={clsx(
                                                    "px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border",
                                                    k2 > 0 
                                                        ? "bg-white/10 border-white/20 text-white hover:border-[#ff6600]" 
                                                        : "bg-black/60 border-white/10 text-gray-500 hover:text-white"
                                                )}
                                            >
                                                {getUnityKeyName(k2)}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
