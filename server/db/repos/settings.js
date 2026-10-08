import { hotDb } from '../connection.js';
import '../migrations.js';

export const getAdminSetting = hotDb.prepare('SELECT value FROM admin_settings WHERE key = ?');

export const setAdminSetting = hotDb.prepare('INSERT OR REPLACE INTO admin_settings (key, value) VALUES (?, ?)');
