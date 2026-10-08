export type SettingsTab = 'autoselect' | 'controls' | 'audio' | 'graphics' | 'olmod' | 'raw';

// Read and write one .xprefs (isMod false) or .xprefsmod (isMod true) value,
// pending edits first. Implemented in hooks/usePilotSettings.ts.
export interface PrefAccessors {
    getPrefVal: (key: string, isMod?: boolean) => string;
    getPrefBool: (key: string, isMod?: boolean) => boolean;
    setPrefVal: (key: string, val: string | number | boolean, isMod?: boolean) => void;
}
