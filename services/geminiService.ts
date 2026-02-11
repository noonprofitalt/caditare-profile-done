import { GoogleGenerativeAI } from "@google/generative-ai";
import { Candidate } from "../types";

const API_KEY_STORAGE_KEY = 'globalworkforce_gemini_api_key';

export class GeminiService {
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

    static async analyzeCandidate(candidate: Candidate): Promise<string> {
        try {
            const model = await this.getModel();
            const prompt = `
        Analyze this candidate for a recruitment ERP system:
        Name: ${candidate.name}
        Role: ${candidate.role}
        Experience: ${candidate.experienceYears} years
        Skills: ${candidate.skills.join(", ")}
        Location: ${candidate.location}
        Current Stage: ${candidate.stage}
        
        Provide a professional summary, assessment of their fit for the role, and recommended next steps.
        Format the output in clean Markdown.
      `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error: any) {
            console.error("Gemini Analysis Error:", error);
            return `AI Analysis Failed: ${error.message}. Please check your API key in Settings.`;
        }
    }

    static async chat(message: string, context?: string): Promise<string> {
        try {
            const model = await this.getModel();
            const prompt = context
                ? `Context: ${context}\n\nUser Question: ${message}`
                : message;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error: any) {
            console.error("Gemini Chat Error:", error);
            return `AI Chat Failed: ${error.message}. Please ensure you've configured a valid API Key in the Settings tab.`;
        }
    }

    static saveApiKey(key: string): void {
        localStorage.setItem(API_KEY_STORAGE_KEY, key);
    }

    static hasApiKey(): boolean {
        return !!this.getApiKey();
    }

    static async getMatchScore(candidate: Candidate, job: any): Promise<{ score: number, reason: string }> {
        try {
            const model = await this.getModel();
            const prompt = `
        Match this candidate against the job requirements:
        
        CANDIDATE:
        Name: ${candidate.name}
        Role: ${candidate.role}
        Skills: ${candidate.skills.join(", ")}
        Experience: ${candidate.experienceYears} years
        
        JOB:
        Title: ${job.title}
        Requirements: ${job.requirements.join(", ")}
        Description: ${job.description}
        
        Provide a match score between 0 and 100 and a brief reason (1-2 sentences).
        Output ONLY a JSON object like this: {"score": 85, "reason": "Excellent match..."}
      `;

            const result = await model.generateContent(prompt);
            const text = result.response.text();
            // Clean markdown if present
            const jsonStr = text.replace(/```json|```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (error: any) {
            console.error("Gemini Match Error:", error);
            return { score: 0, reason: "Match analysis failed." };
        }
    }
}