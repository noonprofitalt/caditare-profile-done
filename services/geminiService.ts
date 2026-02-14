import { GoogleGenerativeAI } from "@google/generative-ai";
import { Candidate, Job } from "../types";

const API_KEY_STORAGE_KEY = 'globalworkforce_gemini_api_key';
const CACHE_KEY_PREFIX = 'gemini_cache_';
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

interface CacheEntry<T> {
    timestamp: number;
    data: T;
}

export class GeminiService {
    private static cache: Map<string, CacheEntry<any>> = new Map();

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

    // --- Prompts ---

    private static PROMPTS = {
        ANALYZE: (c: Candidate) => `
      Analyze this candidate for a recruitment ERP system:
      Name: ${c.name}
      Role: ${c.role}
      Experience: ${c.experienceYears} years
      Skills: ${c.professionalProfile?.skills?.join(", ") || 'None listed'}
      Location: ${c.location}
      Current Stage: ${c.stage}
      
      Provide a professional summary, assessment of their fit for the role, and recommended next steps.
      Format the output in clean Markdown.
    `,
        MATCH: (c: Candidate, j: Job) => `
      Match this candidate against the job requirements:
      
      CANDIDATE:
      Name: ${c.name}
      Role: ${c.role}
      Skills: ${c.professionalProfile?.skills?.join(", ") || 'None listed'}
      Experience: ${c.experienceYears} years
      
      JOB:
      Title: ${j.title}
      Requirements: ${j.requirements?.join(", ") || 'None listed'}
      Description: ${j.description}
      
      Provide a match score between 0 and 100 and a brief reason (1-2 sentences).
      Output ONLY a JSON object like this: {"score": 85, "reason": "Excellent match..."}
    `,
        REPORT_INSIGHTS: (c: Candidate, riskScore: string) => `
      Generate executive recruitment insights for this candidate:
      Name: ${c.name}
      Current Stage: ${c.stage}
      Calculated Risk Score: ${riskScore}
      Skills: ${c.professionalProfile?.skills?.join(", ") || 'None listed'}
      Experience: ${c.experienceYears} years
      Target Job Roles: ${c.professionalProfile?.jobRoles?.map(r => typeof r === 'string' ? r : r.title).join(", ") || 'General Recruitment'}
      
      Provide the following in JSON format:
      1. strengths: Array of 3 key professional strengths.
      2. risks: Array of 2-3 potential recruitment or performance risks.
      3. placementProbability: A number (0-100) representing the likelihood of successful deployment.
      4. recommendedRoles: Array of 2 alternate or specific job roles they are qualified for.
      
      Return ONLY the JSON object.
    `,
        ANALYZE_SYSTEM: (snapshot: any) => `
      Analyze this recruitment agency system snapshot and provide an executive summary:
      KPIs: ${JSON.stringify(snapshot.kpi)}
      Bottlenecks: ${JSON.stringify(snapshot.bottlenecks)}
      Financials: ${JSON.stringify(snapshot.financials)}
      
      Provide a concise 3-4 sentence professional assessment of the system's operational health, identifying the most critical focus area for the management team.
    `
    };

    // --- Public Methods ---

    static async getSystemAnalysis(snapshot: any): Promise<string> {
        try {
            const result = await this.withRetry(async () => {
                const model = await this.getModel();
                const response = await model.generateContent(this.PROMPTS.ANALYZE_SYSTEM(snapshot));
                return await response.response.text();
            });
            return result;
        } catch (error) {
            console.error("Gemini System Analysis Error:", error);
            return "Unable to generate AI System Analysis at this time. Please check your process configuration.";
        }
    }

    static async getReportInsights(candidate: Candidate, riskScore: string): Promise<any> {
        const cacheKey = this.getCacheKey('report_insights', candidate.id);
        const cached = this.getFromCache<any>(cacheKey);
        if (cached) {
            console.log('Gemini: Serving report insights from cache');
            return cached;
        }

        try {
            const result = await this.withRetry(async () => {
                const model = await this.getModel();
                const response = await model.generateContent(this.PROMPTS.REPORT_INSIGHTS(candidate, riskScore));
                const text = await response.response.text();

                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (!jsonMatch) throw new Error("No JSON found in response");

                return JSON.parse(jsonMatch[0]);
            });

            this.setCache(cacheKey, result);
            return result;
        } catch (error: unknown) {
            console.error("Gemini Report Insights Error:", error);
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
                const response = await model.generateContent(this.PROMPTS.ANALYZE(candidate));
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
                if (!context && (message.toLowerCase().includes('data') || message.toLowerCase().includes('stat') || message.toLowerCase().includes('candidate') || message.toLowerCase().includes('who'))) {
                    const { ReportingService } = await import('./reportingService');
                    const { CandidateService } = await import('./candidateService');
                    const snapshot = ReportingService.getSystemSnapshot();
                    const candidates = CandidateService.getCandidates();

                    activeContext = `SYSTEM SNAPSHOT: ${JSON.stringify({
                        totalCandidates: snapshot.kpi.totalCandidates,
                        activeProcessing: snapshot.kpi.activeProcessing,
                        revenue: snapshot.financials.totalCollected,
                        bottlenecks: snapshot.bottlenecks.filter(b => b.status !== 'Good').map(b => `${b.stage}: ${b.count} cases`),
                        recentCandidates: candidates.slice(0, 5).map(c => ({ name: c.name, stage: c.stage, role: c.role, location: c.location }))
                    })}`;
                }

                const prompt = activeContext
                    ? `Context: ${activeContext}\n\nUser Question: ${message}\n\nRespond as a helpful recruitment data analyst.`
                    : message;

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

    static async getMatchScore(candidate: Candidate, job: Job): Promise<{ score: number, reason: string }> {
        const cacheKey = this.getCacheKey('match', `${candidate.id}_${job.id}`);
        const cached = this.getFromCache<{ score: number, reason: string }>(cacheKey);
        if (cached) {
            console.log('Gemini: Serving match score from cache');
            return cached;
        }

        try {
            const result = await this.withRetry(async () => {
                const model = await this.getModel();
                const response = await model.generateContent(this.PROMPTS.MATCH(candidate, job));
                const text = await response.response.text();

                // Robust JSON extraction
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (!jsonMatch) throw new Error("No JSON found in response");

                return JSON.parse(jsonMatch[0]);
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