import { GoogleGenerativeAI } from "@google/generative-ai";
import { Candidate, Job, SystemSnapshot } from "../types";
import { GEMINI_PROMPTS } from "./geminiPrompts";
import { CacheEntry, GeminiMatchResult, GeminiReportInsightsResult } from "./geminiTypes";

const API_KEY_STORAGE_KEY = 'globalworkforce_gemini_api_key';
const MODEL_STORAGE_KEY = 'globalworkforce_gemini_model';
const CACHE_KEY_PREFIX = 'gemini_cache_';
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

export class GeminiService {
    private static cache: Map<string, CacheEntry<unknown>> = new Map();

    private static getApiKey(): string | null {
        return localStorage.getItem(API_KEY_STORAGE_KEY) || import.meta.env.VITE_GEMINI_API_KEY || null;
    }

    static getModelPref(): string {
        const stored = localStorage.getItem(MODEL_STORAGE_KEY);
        // Using -latest suffixes to ensure compatibility with v1beta
        if (stored === 'gemini-3-flash' || stored === 'gemini-2.0-flash' || stored === 'gemini-2.5-flash') {
            this.saveModelPref('gemini-2.0-flash'); // Standard stable id
            return 'gemini-2.0-flash';
        }
        if (stored === 'gemini-3.1-pro' || stored === 'gemini-1.5-pro') {
            this.saveModelPref('gemini-1.5-pro-latest');
            return 'gemini-1.5-pro-latest';
        }
        if (stored === 'gemini-1.5-flash') {
            this.saveModelPref('gemini-1.5-flash-latest');
            return 'gemini-1.5-flash-latest';
        }
        return stored || 'gemini-2.0-flash';
    }

    private static async getModel() {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error("Gemini API Key not found in settings.");
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        const modelName = this.getModelPref();
        return genAI.getGenerativeModel({ model: modelName });
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
                console.warn(`Gemini API call failed, retrying instantly... (${retries} attempts left)`);
                // FRICTIONLESS MODE: Reduced from 1000ms to 10ms for instant retries
                await new Promise(r => setTimeout(r, 10));
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

    static async chat(message: string, snapshot?: SystemSnapshot | null): Promise<string> {
        try {
            return await this.withRetry(async () => {
                const model = await this.getModel();

                let activeContext = "";

                if (snapshot) {
                    activeContext = `SYSTEM SNAPSHOT (LIVE DATA FEED):
- Metrics: ${snapshot.kpi.totalCandidates} Total, ${snapshot.kpi.activeProcessing} Active.
- Financials: $${snapshot.financials.totalCollected.toLocaleString()} Collected.
- Potential: $${snapshot.financials.pipelineValue.toLocaleString()}.
- Critical Bottlenecks: ${snapshot.bottlenecks.filter(b => b.status === 'Critical').map(b => `${b.stage} (${b.count} delayed)`).join(', ') || 'None'}.`;
                } else if (message.toLowerCase().includes('data') || message.toLowerCase().includes('stat')) {
                    const { ReportingService } = await import('./reportingService');
                    const lazySnapshot = await ReportingService.getSystemSnapshot();
                    activeContext = `SYSTEM SNAPSHOT (AUTO):
- Total: ${lazySnapshot.kpi.totalCandidates}
- Collected: $${lazySnapshot.financials.totalCollected.toLocaleString()}
- Bottlenecks: ${lazySnapshot.bottlenecks.filter(b => b.status === 'Critical').length} Critical stages.`;
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

    static saveModelPref(modelName: string): void {
        localStorage.setItem(MODEL_STORAGE_KEY, modelName);
    }

    static hasApiKey(): boolean {
        return !!this.getApiKey();
    }

    static async testConnection(apiKey: string, modelName: string): Promise<{ success: boolean; message: string }> {
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: modelName });

            // Send a tiny prompt just to verify the handshake works
            const result = await model.generateContent("Respond with the exact word: OK");
            const responseText = await result.response.text();

            if (responseText.toLowerCase().includes('ok')) {
                return { success: true, message: `Successfully connected to ${modelName}` };
            } else {
                return { success: false, message: 'Connected, but received unexpected response format.' };
            }
        } catch (error: any) {
            return {
                success: false,
                message: error.message?.includes('API key not valid')
                    ? 'Invalid API Key provided.'
                    : `Connection Error: ${error.message || 'Unknown error'}`
            };
        }
    }
}