import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Candidate } from '../types';
import { CandidateService } from '../services/candidateService';
import { logger } from '../services/loggerService';

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
            setCandidates(data || []);
        } catch (err) {
            logger.error('Failed to fetch candidates', err);
            setError('Failed to load candidates. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        refreshCandidates();
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
