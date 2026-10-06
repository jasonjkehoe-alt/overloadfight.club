import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { getPilotData, isValidPilotName } from './overloadBridge.js';

describe('isValidPilotName', () => {
    it('accepts names made of letters, digits, space, underscore, dot and dash', () => {
        for (const name of ['Soup', 'Pilot 2', 'kehoe_j', 'a.b-c', 'x'.repeat(32)]) {
            expect(isValidPilotName(name), name).toBe(true);
        }
    });

    it('rejects path separators, empty, overlong and non-string names', () => {
        for (const name of ['../evil', '..\\evil', 'a/b', '/etc/passwd', 'C:evil', 'nul\0byte', '', 'x'.repeat(33), undefined, null, 42, ['Soup']]) {
            expect(isValidPilotName(name), String(name)).toBe(false);
        }
    });

    it('stops getPilotData from reading a file outside the Overload folder', () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ofc-bridge-'));
        const overloadDir = path.join(root, 'Overload');
        fs.mkdirSync(overloadDir);
        fs.writeFileSync(path.join(root, 'secret.extendedconfig'), 'not yours');
        try {
            expect(getPilotData(overloadDir, '../secret')).toBeNull();
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    });
});
