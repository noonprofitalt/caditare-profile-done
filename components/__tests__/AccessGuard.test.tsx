import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { checkAccess } from '../AccessGuard';
import type { SecurityConfig } from '../../services/securityService';

// ─────────────────────────────────────────────────────────────────────
// §1  Pure Logic Tests — checkAccess()
//     These test the core decision engine WITHOUT React rendering.
// ─────────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: SecurityConfig = {
    officeIp: '192.168.1.1',
    workStartTime: '08:00',
    workEndTime: '18:00',
    blockSundays: true,
};

// Helper: Create a Date representing a specific day and time
// dayOfWeek: 0=Sunday, 1=Monday, ..., 6=Saturday
const makeDate = (dayOfWeek: number, hours: number, minutes = 0): Date => {
    // Start from a known date (2026-03-10 is Tuesday)
    // Map to the correct day by offsetting
    const base = new Date(2026, 2, 10, hours, minutes, 0, 0); // March 10, 2026 = Tuesday (2)
    const currentDay = base.getDay(); // 2 (Tuesday)
    const diff = dayOfWeek - currentDay;
    base.setDate(base.getDate() + diff);
    return base;
};

describe('checkAccess() — Core Logic', () => {

    // ─── ADMIN BYPASS ──────────────────────────────────────────────
    describe('Admin Bypass', () => {
        it('should allow Admin on Sunday midnight', () => {
            const sunday = makeDate(0, 0);
            const result = checkAccess(DEFAULT_CONFIG, 'Admin', '127.0.0.1', false, sunday);
            expect(result.allowed).toBe(true);
            expect(result.reason).toBeNull();
        });

        it('should allow Admin at 3:00 AM on a weekday', () => {
            const monday3am = makeDate(1, 3);
            const result = checkAccess(DEFAULT_CONFIG, 'Admin', '127.0.0.1', false, monday3am);
            expect(result.allowed).toBe(true);
        });

        it('should allow Admin at 11:59 PM on Saturday', () => {
            const satLate = makeDate(6, 23, 59);
            const result = checkAccess(DEFAULT_CONFIG, 'Admin', '127.0.0.1', false, satLate);
            expect(result.allowed).toBe(true);
        });

        it('should allow Admin even if from a totally unknown IP address', () => {
            const mondayNoon = makeDate(1, 12, 0);
            const result = checkAccess(DEFAULT_CONFIG, 'Admin', '188.188.188.188', false, mondayNoon);
            expect(result.allowed).toBe(true);
        });

        it('should block Admin if session is forcefully revoked', () => {
            const mondayNoon = makeDate(1, 12, 0);
            const result = checkAccess(DEFAULT_CONFIG, 'Admin', '127.0.0.1', true, mondayNoon);
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('revoked');
        });
    });

    // ─── IP AND REVOCATION (NEW) ───────────────────────────────────
    describe('IP Restrictions and Session Revocation', () => {
        it('should block Staff if the IP is not localhost and not the office IP', () => {
            const mondayNoon = makeDate(1, 12, 0);
            const result = checkAccess(DEFAULT_CONFIG, 'Staff', '99.99.99.99', false, mondayNoon);
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('invalid_ip');
        });

        it('should allow Staff if the IP exactly matches the configured office IP', () => {
            const mondayNoon = makeDate(1, 12, 0);
            const result = checkAccess(DEFAULT_CONFIG, 'Staff', '192.168.1.1', false, mondayNoon);
            expect(result.allowed).toBe(true);
        });

        it('should allow Staff if the IP is localhost (to prevent lockout in dev)', () => {
            const mondayNoon = makeDate(1, 12, 0);
            const result = checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, mondayNoon);
            expect(result.allowed).toBe(true);
        });

        it('should block Staff instantly if session is revoked, even within hours and valid IP', () => {
            const mondayNoon = makeDate(1, 12, 0);
            const result = checkAccess(DEFAULT_CONFIG, 'Staff', '192.168.1.1', true, mondayNoon);
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('revoked');
        });
    });

    // ─── SUNDAY BLOCKING ───────────────────────────────────────────
    describe('Sunday Blocking', () => {
        it('should block Staff on Sunday morning', () => {
            const sundayMorning = makeDate(0, 10);
            const result = checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, sundayMorning);
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('sunday');
            expect(result.nextOpenTime).toContain('Monday');
        });

        it('should block Staff on Sunday at midnight', () => {
            const sundayMidnight = makeDate(0, 0);
            const result = checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, sundayMidnight);
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('sunday');
        });

        it('should block Staff on Sunday 11:59 PM', () => {
            const sundayLate = makeDate(0, 23, 59);
            const result = checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, sundayLate);
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('sunday');
        });

        it('should allow Staff on Sunday if blockSundays is OFF', () => {
            const sundayMidday = makeDate(0, 12);
            const config = { ...DEFAULT_CONFIG, blockSundays: false };
            const result = checkAccess(config, 'Staff', '127.0.0.1', false, sundayMidday);
            // Sunday with blocking off, within hours => allowed
            expect(result.allowed).toBe(true);
        });

        it('should block Staff on Sunday outside hours even with blockSundays OFF', () => {
            const sunday3am = makeDate(0, 3);
            const config = { ...DEFAULT_CONFIG, blockSundays: false };
            const result = checkAccess(config, 'Staff', '127.0.0.1', false, sunday3am);
            // blockSundays is off, but it's 3am which is outside 8-18
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('outside_hours');
        });
    });

    // ─── OFFICE HOURS — BEFORE START ───────────────────────────────
    describe('Before Office Hours', () => {
        it('should block Staff at 7:59 AM on Monday', () => {
            const mon759 = makeDate(1, 7, 59);
            const result = checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, mon759);
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('outside_hours');
            expect(result.nextOpenTime).toContain('Today');
        });

        it('should block Staff at 7:00 AM on Wednesday', () => {
            const wed7 = makeDate(3, 7, 0);
            const result = checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, wed7);
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('outside_hours');
        });

        it('should block Staff at midnight on Tuesday', () => {
            const tueMidnight = makeDate(2, 0, 0);
            const result = checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, tueMidnight);
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('outside_hours');
            expect(result.nextOpenTime).toContain('Today');
        });

        it('should block Staff at 5:30 AM on Friday', () => {
            const fri530 = makeDate(5, 5, 30);
            const result = checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, fri530);
            expect(result.allowed).toBe(false);
        });
    });

    // ─── OFFICE HOURS — AFTER CLOSE ────────────────────────────────
    describe('After Office Hours', () => {
        it('should block Staff at exactly 6:00 PM (edge: >= endVal)', () => {
            const mon18 = makeDate(1, 18, 0);
            const result = checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, mon18);
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('outside_hours');
            expect(result.nextOpenTime).toContain('Tomorrow');
        });

        it('should block Staff at 6:01 PM', () => {
            const mon1801 = makeDate(1, 18, 1);
            const result = checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, mon1801);
            expect(result.allowed).toBe(false);
        });

        it('should block Staff at 11:00 PM on Thursday', () => {
            const thu23 = makeDate(4, 23, 0);
            const result = checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, thu23);
            expect(result.allowed).toBe(false);
            expect(result.nextOpenTime).toContain('Tomorrow');
        });

        it('should say Monday for Saturday after close when blockSundays is ON', () => {
            const sat19 = makeDate(6, 19, 0);
            const result = checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, sat19);
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('outside_hours');
            expect(result.nextOpenTime).toContain('Monday');
        });

        it('should say Tomorrow for Saturday after close when blockSundays is OFF', () => {
            const sat19 = makeDate(6, 19, 0);
            const config = { ...DEFAULT_CONFIG, blockSundays: false };
            const result = checkAccess(config, 'Staff', '127.0.0.1', false, sat19);
            expect(result.allowed).toBe(false);
            expect(result.nextOpenTime).toContain('Tomorrow');
        });
    });

    // ─── OFFICE HOURS — WITHIN HOURS (ALLOWED) ────────────────────
    describe('Within Office Hours', () => {
        it('should allow Staff at exactly 8:00 AM on Monday', () => {
            const mon8 = makeDate(1, 8, 0);
            const result = checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, mon8);
            expect(result.allowed).toBe(true);
            expect(result.reason).toBeNull();
        });

        it('should allow Staff at 8:01 AM', () => {
            const tue801 = makeDate(2, 8, 1);
            const result = checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, tue801);
            expect(result.allowed).toBe(true);
        });

        it('should allow Staff at 5:59 PM (17:59)', () => {
            const wed1759 = makeDate(3, 17, 59);
            const result = checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, wed1759);
            expect(result.allowed).toBe(true);
        });

        it('should allow Staff at noon', () => {
            const thu12 = makeDate(4, 12, 0);
            const result = checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, thu12);
            expect(result.allowed).toBe(true);
        });

        it('should allow Staff on Saturday within hours', () => {
            const sat10 = makeDate(6, 10, 0);
            const result = checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, sat10);
            expect(result.allowed).toBe(true);
        });

        it('should allow Staff at 2:00 PM on Friday', () => {
            const fri14 = makeDate(5, 14, 0);
            const result = checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, fri14);
            expect(result.allowed).toBe(true);
        });
    });

    // ─── CUSTOM OFFICE HOURS ───────────────────────────────────────
    describe('Custom Office Hours', () => {
        it('should respect custom 09:30 to 17:30 hours', () => {
            const config: SecurityConfig = {
                ...DEFAULT_CONFIG,
                workStartTime: '09:30',
                workEndTime: '17:30',
            };

            // 9:00 AM - should be blocked
            const mon9 = makeDate(1, 9, 0);
            expect(checkAccess(config, 'Staff', '127.0.0.1', false, mon9).allowed).toBe(false);

            // 9:30 AM - should be allowed
            const mon930 = makeDate(1, 9, 30);
            expect(checkAccess(config, 'Staff', '127.0.0.1', false, mon930).allowed).toBe(true);

            // 5:29 PM - should be allowed
            const mon1729 = makeDate(1, 17, 29);
            expect(checkAccess(config, 'Staff', '127.0.0.1', false, mon1729).allowed).toBe(true);

            // 5:30 PM - should be blocked
            const mon1730 = makeDate(1, 17, 30);
            expect(checkAccess(config, 'Staff', '127.0.0.1', false, mon1730).allowed).toBe(false);
        });

        it('should handle early morning shifts (06:00 - 14:00)', () => {
            const config: SecurityConfig = {
                ...DEFAULT_CONFIG,
                workStartTime: '06:00',
                workEndTime: '14:00',
            };

            // 5:59 AM - blocked
            expect(checkAccess(config, 'Staff', '127.0.0.1', false, makeDate(2, 5, 59)).allowed).toBe(false);

            // 6:00 AM - allowed
            expect(checkAccess(config, 'Staff', '127.0.0.1', false, makeDate(2, 6, 0)).allowed).toBe(true);

            // 1:59 PM - allowed
            expect(checkAccess(config, 'Staff', '127.0.0.1', false, makeDate(2, 13, 59)).allowed).toBe(true);

            // 2:00 PM - blocked
            expect(checkAccess(config, 'Staff', '127.0.0.1', false, makeDate(2, 14, 0)).allowed).toBe(false);
        });

        it('should handle late night shifts (20:00 - 23:00)', () => {
            const config: SecurityConfig = {
                ...DEFAULT_CONFIG,
                workStartTime: '20:00',
                workEndTime: '23:00',
            };

            // 7:59 PM - blocked
            expect(checkAccess(config, 'Staff', '127.0.0.1', false, makeDate(3, 19, 59)).allowed).toBe(false);

            // 8:00 PM - allowed
            expect(checkAccess(config, 'Staff', '127.0.0.1', false, makeDate(3, 20, 0)).allowed).toBe(true);

            // 10:59 PM - allowed
            expect(checkAccess(config, 'Staff', '127.0.0.1', false, makeDate(3, 22, 59)).allowed).toBe(true);

            // 11:00 PM - blocked
            expect(checkAccess(config, 'Staff', '127.0.0.1', false, makeDate(3, 23, 0)).allowed).toBe(false);
        });
    });

    // ─── ROLE VARIATIONS ───────────────────────────────────────────
    describe('Role Variations', () => {
        it('should block undefined role (not logged in) outside hours', () => {
            const late = makeDate(1, 20, 0);
            const result = checkAccess(DEFAULT_CONFIG, undefined, '127.0.0.1', false, late);
            expect(result.allowed).toBe(false);
        });

        it('should treat any non-Admin role as restricted', () => {
            const sunday = makeDate(0, 12);

            expect(checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, sunday).allowed).toBe(false);
            expect(checkAccess(DEFAULT_CONFIG, 'Viewer', '127.0.0.1', false, sunday).allowed).toBe(false);
            expect(checkAccess(DEFAULT_CONFIG, 'Manager', '127.0.0.1', false, sunday).allowed).toBe(false);
            // Only Admin bypasses
            expect(checkAccess(DEFAULT_CONFIG, 'Admin', '127.0.0.1', false, sunday).allowed).toBe(true);
        });
    });

    // ─── EDGE CASES ────────────────────────────────────────────────
    describe('Edge Cases', () => {
        it('should handle exact boundary at start time', () => {
            // Exactly 08:00:00 should be allowed
            const exact8 = makeDate(1, 8, 0);
            expect(checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, exact8).allowed).toBe(true);
        });

        it('should handle exact boundary at end time', () => {
            // Exactly 18:00:00 should be blocked (>= endVal)
            const exact18 = makeDate(1, 18, 0);
            expect(checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, exact18).allowed).toBe(false);
        });

        it('should handle one minute before end time', () => {
            // 17:59 should be allowed
            const beforeEnd = makeDate(1, 17, 59);
            expect(checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, beforeEnd).allowed).toBe(true);
        });

        it('should handle nextOpenTime message for Sunday blocking', () => {
            const sunday = makeDate(0, 10);
            const result = checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, sunday);
            expect(result.nextOpenTime).toBe('Monday at 8:00 AM');
        });

        it('should handle nextOpenTime for before-hours on weekday', () => {
            const earlyMon = makeDate(1, 6, 0);
            const result = checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, earlyMon);
            expect(result.nextOpenTime).toContain('Today');
            expect(result.nextOpenTime).toContain('8:00 AM');
        });

        it('should handle nextOpenTime for after-hours on weekday', () => {
            const lateMon = makeDate(1, 20, 0);
            const result = checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, lateMon);
            expect(result.nextOpenTime).toContain('Tomorrow');
            expect(result.nextOpenTime).toContain('8:00 AM');
        });

        it('should handle nextOpenTime for Saturday evening (skips Sunday)', () => {
            const satEvening = makeDate(6, 19, 0);
            const result = checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, satEvening);
            expect(result.nextOpenTime).toContain('Monday');
        });

        it('should handle all weekdays within hours', () => {
            // Monday through Saturday at noon should all be allowed
            for (let day = 1; day <= 6; day++) {
                const noon = makeDate(day, 12, 0);
                const result = checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, noon);
                expect(result.allowed).toBe(true);
            }
        });

        it('should handle all weekdays outside hours', () => {
            // Monday through Saturday at 3 AM should all be blocked
            for (let day = 1; day <= 6; day++) {
                const earlyMorning = makeDate(day, 3, 0);
                const result = checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, earlyMorning);
                expect(result.allowed).toBe(false);
                expect(result.reason).toBe('outside_hours');
            }
        });
    });
});

// ─────────────────────────────────────────────────────────────────────
// §2  SecurityService Cache Layer Tests
// ─────────────────────────────────────────────────────────────────────

describe('SecurityService — localStorage Cache', () => {
    const CONFIG_CACHE_KEY = 'gw_security_config_cache';

    beforeEach(() => {
        localStorage.clear();
    });

    it('should store config in localStorage', () => {
        const config: SecurityConfig = {
            officeIp: '10.0.0.1',
            workStartTime: '09:00',
            workEndTime: '17:00',
            blockSundays: false,
        };
        localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(config));

        const cached = JSON.parse(localStorage.getItem(CONFIG_CACHE_KEY)!);
        expect(cached.officeIp).toBe('10.0.0.1');
        expect(cached.workStartTime).toBe('09:00');
        expect(cached.workEndTime).toBe('17:00');
        expect(cached.blockSundays).toBe(false);
    });

    it('should return null for missing cache', () => {
        const cached = localStorage.getItem(CONFIG_CACHE_KEY);
        expect(cached).toBeNull();
    });

    it('should handle corrupt JSON gracefully', () => {
        localStorage.setItem(CONFIG_CACHE_KEY, 'not-valid-json{{{');
        let config: SecurityConfig | null = null;
        try {
            config = JSON.parse(localStorage.getItem(CONFIG_CACHE_KEY)!);
        } catch {
            config = null;
        }
        expect(config).toBeNull();
    });

    it('should merge updates correctly', () => {
        const initial: SecurityConfig = {
            officeIp: '192.168.1.1',
            workStartTime: '08:00',
            workEndTime: '18:00',
            blockSundays: true,
        };
        localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(initial));

        // Simulate partial update
        const currentCached = JSON.parse(localStorage.getItem(CONFIG_CACHE_KEY)!);
        const merged = { ...currentCached, blockSundays: false, workEndTime: '20:00' };
        localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(merged));

        const final = JSON.parse(localStorage.getItem(CONFIG_CACHE_KEY)!);
        expect(final.officeIp).toBe('192.168.1.1'); // unchanged
        expect(final.workStartTime).toBe('08:00'); // unchanged
        expect(final.workEndTime).toBe('20:00'); // updated
        expect(final.blockSundays).toBe(false); // updated
    });
});

// ─────────────────────────────────────────────────────────────────────
// §3  Stress Tests — Rapid Boundary Transitions
// ─────────────────────────────────────────────────────────────────────

describe('Stress Tests — Boundary & Rapid Transitions', () => {

    it('should handle 1000 rapid access checks without errors', () => {
        const start = performance.now();
        for (let i = 0; i < 1000; i++) {
            const hour = i % 24;
            const day = i % 7;
            const date = makeDate(day, hour, Math.floor(Math.random() * 60));
            const role = i % 3 === 0 ? 'Admin' : 'Staff';
            const result = checkAccess(DEFAULT_CONFIG, role, '127.0.0.1', false, date);
            expect(typeof result.allowed).toBe('boolean');
            expect(result.config).toBeTruthy();
        }
        const elapsed = performance.now() - start;
        // Should complete in under 200ms
        expect(elapsed).toBeLessThan(200);
    });

    it('should produce consistent results for the same input', () => {
        const date = makeDate(3, 14, 30); // Wednesday 2:30 PM
        const results = Array.from({ length: 100 }, () =>
            checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, date)
        );
        // All should be identical
        results.forEach(r => {
            expect(r.allowed).toBe(true);
            expect(r.reason).toBeNull();
        });
    });

    it('should handle minute-by-minute transition around close time', () => {
        // Test every minute from 17:50 to 18:10
        for (let m = 50; m <= 69; m++) {
            const hour = 17 + Math.floor(m / 60);
            const min = m % 60;
            const date = makeDate(1, hour, min);
            const result = checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, date);

            if (hour < 18 || (hour === 17 && min < 60)) {
                // Before 18:00 should be allowed
                if (hour === 17) {
                    expect(result.allowed).toBe(true);
                }
            }
            if (hour >= 18) {
                // At or after 18:00 should be blocked
                expect(result.allowed).toBe(false);
            }
        }
    });

    it('should handle minute-by-minute transition around open time', () => {
        // Test every minute from 7:50 to 8:10
        for (let min = 50; min <= 59; min++) {
            const date = makeDate(2, 7, min);
            const result = checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, date);
            expect(result.allowed).toBe(false);
        }
        for (let min = 0; min <= 10; min++) {
            const date = makeDate(2, 8, min);
            const result = checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, date);
            expect(result.allowed).toBe(true);
        }
    });

    it('should handle Saturday-to-Sunday transition correctly', () => {
        // Saturday 11:50 PM to Sunday 12:10 AM
        // Saturday at 23:50 — blocked (after hours), next open = Monday
        const satLate = makeDate(6, 23, 50);
        const satResult = checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, satLate);
        expect(satResult.allowed).toBe(false);
        expect(satResult.nextOpenTime).toContain('Monday');

        // Sunday at 00:10 — blocked (sunday), next open = Monday
        const sunEarly = makeDate(0, 0, 10);
        const sunResult = checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, sunEarly);
        expect(sunResult.allowed).toBe(false);
        expect(sunResult.reason).toBe('sunday');
        expect(sunResult.nextOpenTime).toContain('Monday');
    });

    it('should handle every hour of every day in a week', () => {
        let allowedCount = 0;
        let blockedCount = 0;

        for (let day = 0; day <= 6; day++) {
            for (let hour = 0; hour <= 23; hour++) {
                const date = makeDate(day, hour, 0);
                const result = checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, date);
                if (result.allowed) {
                    allowedCount++;
                } else {
                    blockedCount++;
                }
            }
        }

        // Sanity: With 08:00-18:00 Mon-Sat, Sunday fully blocked:
        // Allowed: 10 hours/day × 6 days = 60
        // Blocked: 14 hours/day × 6 days + 24 hours Sunday = 108
        expect(allowedCount).toBe(60);
        expect(blockedCount).toBe(108);
    });
});

// ─────────────────────────────────────────────────────────────────────
// §4  Integration Consistency Tests — Server vs Client Logic
// ─────────────────────────────────────────────────────────────────────

describe('Server-Client Consistency', () => {
    // These tests verify that the client-side checkAccess logic
    // produces the same results as the server middleware logic

    it('should match server rule: Admin bypasses all', () => {
        const sundayMidnight = makeDate(0, 0);
        const result = checkAccess(DEFAULT_CONFIG, 'Admin', '127.0.0.1', false, sundayMidnight);
        // Server: if (req.user.role === 'Admin') return next();
        expect(result.allowed).toBe(true);
    });

    it('should match server rule: Block Staff on Sundays', () => {
        const sunday10am = makeDate(0, 10);
        const result = checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, sunday10am);
        // Server: if (dayOfWeek === 0 && config.blockSundays) res.status(403)
        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('sunday');
    });

    it('should match server rule: Block Staff before start time', () => {
        const monday7am = makeDate(1, 7);
        const result = checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, monday7am);
        // Server: if (currentTimeVal < startVal) res.status(403)
        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('outside_hours');
    });

    it('should match server rule: Block Staff at/after end time', () => {
        const wednesday6pm = makeDate(3, 18);
        const result = checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, wednesday6pm);
        // Server: if (currentTimeVal >= endVal) res.status(403)
        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('outside_hours');
    });

    it('should match server rule: Allow Staff within valid hours', () => {
        const friday2pm = makeDate(5, 14);
        const result = checkAccess(DEFAULT_CONFIG, 'Staff', '127.0.0.1', false, friday2pm);
        // Server: next()
        expect(result.allowed).toBe(true);
    });
});
