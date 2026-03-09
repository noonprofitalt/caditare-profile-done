import fs from 'fs';
import path from 'path';

export interface SecurityConfig {
    officeIp: string;
    workStartTime: string;
    workEndTime: string;
    blockSundays: boolean;
}

const configPath = path.resolve(process.cwd(), 'server', 'config', 'security.json');

export const SecurityConfigService = {
    getConfig: (): SecurityConfig => {
        try {
            if (!fs.existsSync(configPath)) {
                return {
                    officeIp: process.env.OFFICE_ROUTER_IP || '192.168.1.1',
                    workStartTime: '08:00',
                    workEndTime: '18:00',
                    blockSundays: true
                };
            }
            const data = fs.readFileSync(configPath, 'utf8');
            const parsed = JSON.parse(data);
            return {
                officeIp: parsed.officeIp || process.env.OFFICE_ROUTER_IP || '192.168.1.1',
                workStartTime: parsed.workStartTime || '08:00',
                workEndTime: parsed.workEndTime || '18:00',
                blockSundays: parsed.blockSundays !== undefined ? parsed.blockSundays : true
            };
        } catch (e) {
            console.error('Error reading security config', e);
            return {
                officeIp: process.env.OFFICE_ROUTER_IP || '192.168.1.1',
                workStartTime: '08:00',
                workEndTime: '18:00',
                blockSundays: true
            };
        }
    },

    saveConfig: (newConfig: Partial<SecurityConfig>): SecurityConfig => {
        try {
            const current = SecurityConfigService.getConfig();
            const updated = { ...current, ...newConfig };

            // Ensure config dir exists
            if (!fs.existsSync(path.dirname(configPath))) {
                fs.mkdirSync(path.dirname(configPath), { recursive: true });
            }

            fs.writeFileSync(configPath, JSON.stringify(updated, null, 2));
            return updated;
        } catch (e) {
            console.error('Error saving security config', e);
            throw new Error('Failed to save security configuration');
        }
    }
};
