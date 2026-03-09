import fs from 'fs';
import path from 'path';

export interface ActiveSession {
    id: string;
    userId: string;
    userName: string;
    ip: string;
    userAgent: string;
    location: string;
    lastActive: number;
    status: 'active' | 'revoked';
}

const dbPath = path.resolve(process.cwd(), 'server', 'data', 'sessions.json');

export const SessionStore = {
    loadSessions: (): Map<string, ActiveSession> => {
        try {
            if (!fs.existsSync(dbPath)) {
                return new Map();
            }
            const data = fs.readFileSync(dbPath, 'utf8');
            const arr = JSON.parse(data);
            const map = new Map<string, ActiveSession>();
            arr.forEach((s: ActiveSession) => map.set(s.id, s));
            return map;
        } catch (e) {
            console.error('Failed to load session DB', e);
            return new Map();
        }
    },

    saveSessions: (sessions: Map<string, ActiveSession>) => {
        try {
            if (!fs.existsSync(path.dirname(dbPath))) {
                fs.mkdirSync(path.dirname(dbPath), { recursive: true });
            }
            const arr = Array.from(sessions.values());
            fs.writeFileSync(dbPath, JSON.stringify(arr, null, 2));
        } catch (e) {
            console.error('Failed to save session DB', e);
        }
    }
};
