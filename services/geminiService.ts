import { GoogleGenerativeAI } from "@google/generative-ai";
import { Candidate, Job, SystemSnapshot } from "../types";
import { GEMINI_PROMPTS } from "./geminiPrompts";
import { CacheEntry, GeminiMatchResult, GeminiReportInsightsResult } from "./geminiTypes";

const API_KEY_STORAGE_KEY = 'globalworkforce_gemini_api_key';
const CACHE_KEY_PREFIX = 'gemini_cache_';
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

export class GeminiService {
    private static cache: Map<string, CacheEntry<unknown>> = new Map();

    private static getApiKey(): string | null {
        return localStorage.getItem(API_KEY_STORAGE_KEY);
    }

    private static async getModel() {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error("Gemini API Key not found in settings.");
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }

    static clearCache(): void {
        this.cache.clear();
    }

    // --- Caching Utilities ---

    private static getCacheKey(type: string, id: string): string {
        return `${CACHE_KEY_PREFIX}${type}_${id}`;
    }

    private static getFromCache<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
            this.cache.delete(key);
            return null;
        }
        return entry.data as T;
    }

    private static setCache<T>(key: string, data: T): void {
        this.cache.set(key, { timestamp: Date.now(), data });
    }

    // --- Retry Logic ---

    private static async withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
        try {
            return await fn();
        } catch (error) {
            if (retries > 0) {
                console.warn(`Gemini API call failed, retrying... (${retries} attempts left)`);
                await new Promise(r => setTimeout(r, 1000));
                return this.withRetry(fn, retries - 1);
            }
            throw error;
        }
    }

    // --- Public Methods ---

    static async getSystemAnalysis(snapshot: SystemSnapshot): Promise<string> {
        try {
            const result = await this.withRetry(async () => {
                const model = await this.getModel();
                const response = await model.generateContent(GEMINI_PROMPTS.ANALYZE_SYSTEM(snapshot));
                return await response.response.text();
            });
            return result;
        } catch (error) {
            console.error("Gemini System Analysis Error:", error);
            return "Unable to generate AI System Analysis at this time. Please check your process configuration.";
        }
    }

    static async getReportInsights(candidate: Candidate, riskScore: string): Promise<GeminiReportInsightsResult> {
        const cacheKey = this.getCacheKey('report_insights', candidate.id);
        const cached = this.getFromCache<GeminiReportInsightsResult>(cacheKey);
        if (cached) {
            console.log('Gemini: Serving report insights from cache');
            return cached;
        }

        try {
            const result = await this.withRetry(async () => {
                const model = await this.getModel();
                const response = await model.generateContent(GEMINI_PROMPTS.REPORT_INSIGHTS(candidate, riskScore));
                const text = await response.response.text();

                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (!jsonMatch) throw new Error("No JSON found in response");

                return JSON.parse(jsonMatch[0]) as GeminiReportInsightsResult;
            });

            this.setCache(cacheKey, result);
            return result;
        } catch (error: unknown) {
            console.error("Gemini Report Insights Error:", error);
            // Fallback object matching the type
            return {
                strengths: candidate.professionalProfile?.skills?.slice(0, 3) || ['Candidate', 'Profile', 'Ready'],
                risks: riskScore === 'HIGH' ? ['High Risk Assessment', 'Documentation Gaps'] : ['None obvious'],
                placementProbability: riskScore === 'HIGH' ? 50 : 80,
                recommendedRoles: candidate.professionalProfile?.jobRoles?.map(r => typeof r === 'string' ? r : r.title).slice(0, 2) || ['General Helper']
            };
        }
    }

    static async analyzeCandidate(candidate: Candidate): Promise<string> {
        const cacheKey = this.getCacheKey('analysis', candidate.id);
        const cached = this.getFromCache<string>(cacheKey);
        if (cached) {
            console.log('Gemini: Serving analysis from cache');
            return cached;
        }

        try {
            const result = await this.withRetry(async () => {
                const model = await this.getModel();
                const response = await model.generateContent(GEMINI_PROMPTS.ANALYZE(candidate));
                const responseText = await response.response.text();
                return responseText;
            });

            this.setCache(cacheKey, result);
            return result;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error("Gemini Analysis Error:", error);
            return `AI Analysis Failed: ${errorMessage}. Please check your API key in Settings.`;
        }
    }

    static async chat(message: string, context?: string): Promise<string> {
        try {
            return await this.withRetry(async () => {
                const model = await this.getModel();

                // If context isn't provided, try to generate a brief system context if it's the first message or data is requested
                let activeContext = context || "";
                if (!context && (message.toLowerCase().includes('data') || message.toLowerCase().includes('stat') || message.toLowerCase().includes('candidate') || message.toLowerCase().includes('who') || message.toLowerCase().includes('how'))) {
                    const { ReportingService } = await import('./reportingService');
                    const { CandidateService } = await import('./candidateService');
                    const snapshot = await ReportingService.getSystemSnapshot();
                    const candidates = await CandidateService.getCandidates();

                    activeContext = `SYSTEM SNAPSHOT (CURRENT LIVE DATA):
- Total: ${snapshot.kpi.totalCandidates} candidates
- Active: ${snapshot.kpi.activeProcessing} processing
- Revenue Collected: $${snapshot.financials.totalCollected.toLocaleString()}
- Pipeline Value: $${snapshot.financials.pipelineValue.toLocaleString()}
- Critical Bottlenecks: ${snapshot.bottlenecks.filter(b => b.status === 'Critical').map(b => `${b.stage} (${b.count} delayed, ${b.avgDays}d avg)`).join(', ') || 'None'}
- Top Candidates: ${candidates.slice(0, 3).map(c => `${c.name} (${c.stage})`).join(', ')}`;
                }

                const prompt = `
${GEMINI_PROMPTS.SYSTEM_INSTRUCTIONS}

USER CONTEXT/SYSTEM DATA:
${activeContext || "No specific system context provided for this query."}

USER QUERY:
${message}

RESPONSE:`;

                const result = await model.generateContent(prompt);
                const response = await result.response;
                return response.text();
            });
        } catch (error: unknown) {
            console.error("Gemini Chat Error:", error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            return `AI Chat Failed: ${errorMessage}. Please ensure you've configured a valid API Key in the Settings tab.`;
        }
    }

    static async getMatchScore(candidate: Candidate, job: Job): Promise<GeminiMatchResult> {
        const cacheKey = this.getCacheKey('match', `${candidate.id}_${job.id}`);
        const cached = this.getFromCache<GeminiMatchResult>(cacheKey);
        if (cached) {
            console.log('Gemini: Serving match score from cache');
            return cached;
        }

        try {
            const result = await this.withRetry(async () => {
                const model = await this.getModel();
                const response = await model.generateContent(GEMINI_PROMPTS.MATCH(candidate, job));
                const text = await response.response.text();

                // Robust JSON extraction
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (!jsonMatch) throw new Error("No JSON found in response");

                return JSON.parse(jsonMatch[0]) as GeminiMatchResult;
            });

            this.setCache(cacheKey, result);
            return result;
        } catch (error: unknown) {
            console.error("Gemini Match Error:", error);
            return { score: 0, reason: "Match analysis failed." };
        }
    }

    static saveApiKey(key: string): void {
        localStorage.setItem(API_KEY_STORAGE_KEY, key);
    }

    static hasApiKey(): boolean {
        return !!this.getApiKey();
    }
}