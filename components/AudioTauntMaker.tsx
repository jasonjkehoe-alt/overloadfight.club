import React, { useState } from 'react';
import { TauntHeader } from './TauntHeader';
import { AudioEditor } from './AudioEditor';
import { OverloadVault, GameTauntItem } from './OverloadVault';
import { LoadoutManager, PendingSlotAssignment } from './LoadoutManager';
import { AudioManual } from './AudioManual';
import { ErrorBoundary } from './ErrorBoundary';
import { useQueryParam } from '../hooks/useLocation';
import { urlFor } from '../server/lib/siteRoutes.js';

type TauntTab = 'editor' | 'vault' | 'loadout' | 'manual';

export const AudioTauntMaker: React.FC = () => {
    const [tabParam, setActiveTab] = useQueryParam('tab', 'vault');
    const activeTab = (['editor', 'vault', 'loadout', 'manual'].includes(tabParam) ? tabParam : 'vault') as TauntTab;
    const [editorFile, setEditorFile] = useState<File | null>(null);
    const [pendingSlotAssignment, setPendingSlotAssignment] = useState<PendingSlotAssignment | null>(null);
    // The editor loads the 30 MB ffmpeg core on mount, so mount it the first time its
    // tab opens, then keep it mounted so an edit survives a tab switch.
    const [editorOpened, setEditorOpened] = useState(false);
    if (activeTab === 'editor' && !editorOpened) setEditorOpened(true);

    const handleLoadIntoEditor = (file: File) => {
        setEditorFile(file);
        setActiveTab('editor');
    };

    const handleEquipFromVault = (item: GameTauntItem, slotNum: number) => {
        setPendingSlotAssignment({
            slotNum,
            tauntId: item.id,
            tauntName: item.cleanName,
            audioUrl: item.audioUrl || null,
            timestamp: Date.now()
        });
        setActiveTab('loadout');
    };

    return (
        <ErrorBoundary>
            <div className="w-full text-gray-200 flex flex-col selection:bg-[#ff6600] selection:text-black animate-fade-in pb-12">
                <TauntHeader activeTab={activeTab} onSelectTab={setActiveTab} />

                <div className="w-full">
                    {editorOpened && (
                        <div className={activeTab === 'editor' ? 'block' : 'hidden'}>
                            <AudioEditor 
                                initialFile={editorFile} 
                            />
                        </div>
                    )}
                    <div className={activeTab === 'vault' ? 'block' : 'hidden'}>
                        <OverloadVault 
                            onLoadIntoEditor={handleLoadIntoEditor}
                            onEquipToSlot={handleEquipFromVault}
                            settingsUrl={urlFor('pilot-manager')}
                        />
                    </div>
                    <div className={activeTab === 'loadout' ? 'block' : 'hidden'}>
                        <LoadoutManager 
                            pendingAssignment={pendingSlotAssignment}
                            onLoadTauntIntoEditor={handleLoadIntoEditor}
                        />
                    </div>
                    {activeTab === 'manual' && <AudioManual />}
                </div>

                <div className="mt-12 border-t border-gray-800/80 pt-6 text-center text-xs font-mono text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p>
                        Overload Audio Taunt Maker 2.0 &bull; Live Game Bridge &bull; Automated Backup Engine
                    </p>
                    <p className="text-[11px] text-gray-600">
                        Tailored for Revival Productions Overload 6-DOF &amp; OLMod
                    </p>
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default AudioTauntMaker;
