export interface GeminiMatchResult {
    score: number;
    reason: string;
}

export interface GeminiReportInsightsResult {
    strengths: string[];
    risks: string[];
    placementProbability: number;
    recommendedRoles: string[];
}

export interface CacheEntry<T> {
    timestamp: number;
    data: T;
}

export interface SystemSnapshot {
    kpi: any; // specific types should be imported from types.ts if needed, or kept generic here if circular dependency risk
    bottlenecks: any[];
    financials: any;
}
