import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { SecurityService, SecurityConfig } from '../services/securityService';
import { Lock, Clock, Calendar, Shield, Sun, LogOut, Loader2 } from 'lucide-react';

interface AccessGuardProps {
    children: React.ReactNode;
}

interface AccessStatus {
    allowed: boolean;
    reason: 'sunday' | 'outside_hours' | 'invalid_ip' | 'revoked' | null;
    config: SecurityConfig | null;
    nextOpenTime: string | null;
}

const CACHE_KEY = 'gw_security_config_cache';

const getCachedConfig = (): SecurityConfig | null => {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        return cached ? JSON.parse(cached) : null;
    } catch { return null; }
};

const cacheConfig = (config: SecurityConfig) => {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(config)); } catch { /* silently fail */ }
};

const parseTime = (timeStr?: string): number => {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) + ((m || 0) / 60);
};

const formatTimeDisplay = (timeStr?: string): string => {
    if (!timeStr || typeof timeStr !== 'string') return 'N/A';
    const [h, m] = timeStr.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${(m || 0).toString().padStart(2, '0')} ${suffix}`;
};

export const checkAccess = (
    config: SecurityConfig,
    userRole: string | undefined,
    clientIp: string = '127.0.0.1',
    sessionRevoked: boolean = false,
    now?: Date
): AccessStatus => {
    // 1. Hard revoke check (applies to EVERYONE, even Admins, though Admins shouldn't be revoked typically)
    if (sessionRevoked) {
        return { allowed: false, reason: 'revoked', config, nextOpenTime: null };
    }

    // Admins always bypass IP and Time restrictions
    if (userRole === 'Admin') {
        return { allowed: true, reason: null, config, nextOpenTime: null };
    }

    const safeConfig = config || { officeIp: '192.168.1.1', workStartTime: '08:00', workEndTime: '18:00', blockSundays: true };

    // 2. IP check (Only restrict if IP is not localhost and not matching the office IP)
    // Localhost fallback ensures we don't lock ourselves out in local dev if config is wrong
    if (safeConfig.officeIp && safeConfig.officeIp.trim() !== '') {
        if (clientIp !== '127.0.0.1' && clientIp !== '::1' && clientIp !== 'localhost' && clientIp !== 'unknown' && clientIp !== safeConfig.officeIp) {
            return { allowed: false, reason: 'invalid_ip', config: safeConfig, nextOpenTime: null };
        }
    }

    const currentDate = now || new Date();
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday
    const currentHour = currentDate.getHours();
    const currentMinute = currentDate.getMinutes();
    const currentTimeVal = currentHour + (currentMinute / 60);

    const startVal = parseTime(safeConfig.workStartTime || '08:00');
    const endVal = parseTime(safeConfig.workEndTime || '18:00');

    // Sunday check
    if (dayOfWeek === 0 && safeConfig.blockSundays) {
        return {
            allowed: false,
            reason: 'sunday',
            config: safeConfig,
            nextOpenTime: `Monday at ${formatTimeDisplay(safeConfig.workStartTime || '08:00')}`
        };
    }

    // Office hours check
    if (currentTimeVal < startVal || currentTimeVal >= endVal) {
        const isAfterClose = currentTimeVal >= endVal;
        if (isAfterClose) {
            // If it's Saturday after close and Sundays are blocked, next open is Monday
            if (dayOfWeek === 6 && safeConfig.blockSundays) {
                return {
                    allowed: false, reason: 'outside_hours', config: safeConfig,
                    nextOpenTime: `Monday at ${formatTimeDisplay(safeConfig.workStartTime || '08:00')}`
                };
            }
            return {
                allowed: false, reason: 'outside_hours', config: safeConfig,
                nextOpenTime: `Tomorrow at ${formatTimeDisplay(safeConfig.workStartTime || '08:00')}`
            };
        }
        return {
            allowed: false, reason: 'outside_hours', config: safeConfig,
            nextOpenTime: `Today at ${formatTimeDisplay(safeConfig.workStartTime || '08:00')}`
        };
    }

    return { allowed: true, reason: null, config: safeConfig, nextOpenTime: null };
};

const AccessGuard: React.FC<AccessGuardProps> = ({ children }) => {
    const { user, logout } = useAuth();
    const [status, setStatus] = useState<AccessStatus>({ allowed: true, reason: null, config: null, nextOpenTime: null });
    const [currentTime, setCurrentTime] = useState(new Date());
    const [configLoaded, setConfigLoaded] = useState(false);

    const evaluateAccess = useCallback(async () => {
        try {
            const data = await SecurityService.getStatus();
            cacheConfig(data.config);

            const accessResult = checkAccess(data.config, user?.role, data.clientIp, data.sessionRevoked);
            setStatus(accessResult);

            // If session is revoked, forcefully log the user out on the client side
            if (accessResult.reason === 'revoked') {
                logout();
            }
        } catch {
            // Fall back to cached config
            const cached = getCachedConfig();
            if (cached) {
                setStatus(checkAccess(cached, user?.role, '127.0.0.1', false));
            }
        }
        setConfigLoaded(true);
    }, [user?.role, logout]);

    // Initial check + periodic re-check every 30 seconds
    useEffect(() => {
        evaluateAccess();
        const interval = setInterval(() => {
            evaluateAccess();
            setCurrentTime(new Date());
        }, 30_000);
        return () => clearInterval(interval);
    }, [evaluateAccess]);

    // Live clock tick every second for the lock screen
    useEffect(() => {
        if (!status.allowed) {
            const tick = setInterval(() => setCurrentTime(new Date()), 1000);
            return () => clearInterval(tick);
        }
    }, [status.allowed]);

    // Block completely with a loader while fetching config on first run
    // Prevents 'flash of unprotected content' and accidental Supabase queries
    if (!configLoaded) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
        );
    }

    // If access is allowed, render normally
    if (status.allowed) return <>{children}</>;

    // ─── Lock Screen ───
    const timeString = currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
    const dateString = currentTime.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const isSunday = status.reason === 'sunday';
    const isInvalidIp = status.reason === 'invalid_ip';
    const isRevoked = status.reason === 'revoked';

    return (
        <div className="access-guard-overlay">
            {/* Animated Background */}
            <div className="access-guard-bg">
                <div className="access-guard-orb access-guard-orb-1" />
                <div className="access-guard-orb access-guard-orb-2" />
                <div className="access-guard-orb access-guard-orb-3" />
                <div className="access-guard-grid" />
            </div>

            {/* Lock Card */}
            <div className="access-guard-card">
                {/* Glowing Lock Icon */}
                <div className="access-guard-icon-ring" style={{ borderColor: isInvalidIp || isRevoked ? '#ef4444' : undefined }}>
                    <div className="access-guard-icon-inner" style={{ backgroundColor: isInvalidIp || isRevoked ? '#fee2e2' : undefined, color: isInvalidIp || isRevoked ? '#dc2626' : undefined }}>
                        {isSunday ? <Sun size={32} /> : (isInvalidIp ? <Shield size={32} /> : <Lock size={32} />)}
                    </div>
                    <div className="access-guard-icon-pulse" style={{ backgroundColor: isInvalidIp || isRevoked ? 'rgba(239, 68, 68, 0.4)' : undefined }} />
                </div>

                {/* Live Clock */}
                <div className="access-guard-clock">{timeString}</div>
                <div className="access-guard-date">{dateString}</div>

                {/* Message */}
                <div className="access-guard-divider" />

                <h2 className="access-guard-title">
                    {isSunday ? 'Sunday Rest Day'
                        : isInvalidIp ? 'Unauthorized Network'
                            : isRevoked ? 'Session Terminated'
                                : 'Outside Office Hours'}
                </h2>

                <p className="access-guard-subtitle">
                    {isSunday
                        ? 'The system is closed on Sundays to ensure a healthy work-life balance for all staff.'
                        : isInvalidIp
                            ? `For security reasons, access is strictly limited to the authorized office local network (IP target: ${status.config?.officeIp || 'Configured Office IP'}).`
                            : isRevoked
                                ? 'Your active session has been manually revoked by an Administrator.'
                                : `System access is restricted to office hours (${formatTimeDisplay(status.config?.workStartTime || '08:00')} – ${formatTimeDisplay(status.config?.workEndTime || '18:00')}).`}
                </p>

                {/* Info Cards */}
                <div className="access-guard-info-grid">
                    <div className="access-guard-info-card">
                        {isInvalidIp || isRevoked ? (
                            <Shield size={16} className="access-guard-info-icon" style={{ color: '#ef4444' }} />
                        ) : (
                            <Clock size={16} className="access-guard-info-icon" />
                        )}
                        <div>
                            <span className="access-guard-info-label">{isInvalidIp || isRevoked ? 'Status' : 'Opens Next'}</span>
                            <span className="access-guard-info-value" style={{ color: isInvalidIp || isRevoked ? '#ef4444' : undefined }}>
                                {isInvalidIp ? 'Access Blocked' : isRevoked ? 'Token Revoked' : status.nextOpenTime}
                            </span>
                        </div>
                    </div>
                    <div className="access-guard-info-card">
                        {isSunday
                            ? <Calendar size={16} className="access-guard-info-icon" />
                            : <Shield size={16} className="access-guard-info-icon" />
                        }
                        <div>
                            <span className="access-guard-info-label">{isSunday ? 'Policy' : 'Role'}</span>
                            <span className="access-guard-info-value">{isSunday ? 'Weekly Rest' : user?.role || 'Staff'}</span>
                        </div>
                    </div>
                </div>

                {/* User Info */}
                <div className="access-guard-user">
                    <div className="access-guard-avatar">
                        {(user?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="access-guard-user-info">
                        <span className="access-guard-user-name">{user?.name || 'User'}</span>
                        <span className="access-guard-user-email">{user?.email || ''}</span>
                    </div>
                </div>

                {/* Actions */}
                <button className="access-guard-logout" onClick={() => logout()}>
                    <LogOut size={16} />
                    Sign Out
                </button>

                <p className="access-guard-footer">
                    Contact your administrator if you need emergency access.
                </p>
            </div>
        </div>
    );
};

export default AccessGuard;
