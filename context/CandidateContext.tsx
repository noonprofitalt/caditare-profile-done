import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Candidate } from '../types';
import { CandidateService } from '../services/candidateService';
import { logger } from '../services/loggerService';
import { supabase } from '../services/supabase';

interface CandidateContextType {
    candidates: Candidate[];
    isLoading: boolean;
    error: string | null;
    refreshCandidates: () => Promise<void>;
    updateCandidateInState: (candidate: Candidate) => void;
    removeCandidateFromState: (id: string) => void;
    addCandidateToState: (candidate: Candidate) => void;
}

const CandidateContext = createContext<CandidateContextType | undefined>(undefined);

export const CandidateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshCandidates = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await CandidateService.getCandidates();
            if (data && data.length > 0) {
                setCandidates(data);
                // OFFLINE MODE: Cache latest data
                localStorage.setItem('caditare_offline_candidates', JSON.stringify(data));
            }
        } catch (err) {
            logger.error('Failed to fetch candidates', err);

            // OFFLINE MODE: Fallback to cached data if network fails
            const cached = localStorage.getItem('caditare_offline_candidates');
            if (cached) {
                console.log('Network offline. Serving candidates from local cache.');
                setCandidates(JSON.parse(cached));
                setError('You are offline. Showing cached data.');
            } else {
                setError('Failed to load candidates. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    // OFFLINE MODE: Auto-refresh when internet comes back
    useEffect(() => {
        const handleOnline = () => {
            console.log('Network connection restored. Syncing data...');
            refreshCandidates();
        };
        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [refreshCandidates]);

    // Initial load and Real-time subscription setup
    useEffect(() => {
        refreshCandidates();

        // Establish Realtime Collaboration Sync
        const channel = supabase
            .channel('public:candidates')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'candidates' },
                (payload: any) => {
                    logger.debug('Realtime INSERT received:', payload);
                    const newCandidate = CandidateService['mapRowToCandidate'] ?
                        (CandidateService as any).mapRowToCandidate(payload.new) :
                        payload.new.data as Candidate;

                    if (newCandidate && newCandidate.id) {
                        setCandidates(prev => [newCandidate, ...prev.filter(c => c.id !== newCandidate.id)]);
                    } else {
                        refreshCandidates(); // Fallback to full refresh if mapping fails
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'candidates' },
                (payload: any) => {
                    logger.debug('Realtime UPDATE received:', payload);
                    const updatedCandidate = CandidateService['mapRowToCandidate'] ?
                        (CandidateService as any).mapRowToCandidate(payload.new) :
                        payload.new.data as Candidate;

                    if (updatedCandidate && updatedCandidate.id) {
                        setCandidates(prev => prev.map(c => c.id === updatedCandidate.id ? updatedCandidate : c));
                    } else {
                        refreshCandidates();
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'candidates' },
                (payload: any) => {
                    logger.debug('Realtime DELETE received:', payload);
                    if (payload.old && payload.old.id) {
                        setCandidates(prev => prev.filter(c => c.id !== payload.old.id));
                    }
                }
            )
            .subscribe((status: string) => {
                if (status === 'SUBSCRIBED') {
                    logger.debug('Successfully subscribed to real-time candidate updates');
                }
            });

        // Cleanup subscription on unmount
        return () => {
            supabase.removeChannel(channel);
        };
    }, [refreshCandidates]);

    const updateCandidateInState = useCallback((updatedCandidate: Candidate) => {
        setCandidates(prev => prev.map(c => c.id === updatedCandidate.id ? updatedCandidate : c));
    }, []);

    const removeCandidateFromState = useCallback((id: string) => {
        setCandidates(prev => prev.filter(c => c.id !== id));
    }, []);

    const addCandidateToState = useCallback((newCandidate: Candidate) => {
        setCandidates(prev => [newCandidate, ...prev]);
    }, []);

    return (
        <CandidateContext.Provider value={{
            candidates,
            isLoading,
            error,
            refreshCandidates,
            updateCandidateInState,
            removeCandidateFromState,
            addCandidateToState
        }}>
            {children}
        </CandidateContext.Provider>
    );
};

export const useCandidates = () => {
    const context = useContext(CandidateContext);
    if (context === undefined) {
        throw new Error('useCandidates must be used within a CandidateProvider');
    }
    return context;
};
