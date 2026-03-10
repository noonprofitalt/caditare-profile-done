import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GeminiService } from '../services/geminiService';
import { GoogleGenerativeAI } from "@google/generative-ai";

vi.mock("@google/generative-ai", () => {
    return {
        GoogleGenerativeAI: vi.fn()
    };
});

describe('GeminiService Integration Tests', () => {
    let mockGenerateContent: any;

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();

        mockGenerateContent = vi.fn();

        const mockModel = {
            generateContent: mockGenerateContent
        };

        const mockInstance = {
            getGenerativeModel: vi.fn().mockReturnValue(mockModel)
        };

        // Use regular function to support 'new' keyword properly
        vi.mocked(GoogleGenerativeAI).mockImplementation(function () {
            return mockInstance as any;
        });
    });

    describe('Model Configuration', () => {
        it('should correctly migrate model names', () => {
            localStorage.setItem('globalworkforce_gemini_model', 'gemini-1.5-pro');
            const model = GeminiService.getModelPref();
            expect(model).toBe('gemini-1.5-pro-latest');
        });

        it('should handle fallbacks for unknown models', () => {
            localStorage.removeItem('globalworkforce_gemini_model');
            const model = GeminiService.getModelPref();
            expect(model).toBe('gemini-2.0-flash');
        });
    });

    describe('API Reliability (Stress & Retries)', () => {
        it('should fulfill requests after initial transient failures', async () => {
            localStorage.setItem('globalworkforce_gemini_api_key', 'test-key');

            mockGenerateContent
                .mockRejectedValueOnce(new Error("Transient Failure 1"))
                .mockRejectedValueOnce(new Error("Transient Failure 2"))
                .mockResolvedValueOnce({
                    response: { text: () => "Finally succeeded" }
                });

            const res = await GeminiService.chat("Hello");
            expect(res).toBe("Finally succeeded");
            expect(mockGenerateContent).toHaveBeenCalledTimes(3);
        });

        it('should correctly report quota exceeded (429) errors', async () => {
            localStorage.setItem('globalworkforce_gemini_api_key', 'test-key');
            mockGenerateContent.mockRejectedValue(new Error("[429] Resource has been exhausted (e.g. check quota)."));

            const res = await GeminiService.chat("Quota test");
            expect(res).toContain("Resource has been exhausted");
        });

        it('should handle concurrent load of 20 requests', async () => {
            localStorage.setItem('globalworkforce_gemini_api_key', 'test-key');
            mockGenerateContent.mockResolvedValue({
                response: { text: () => "OK" }
            });

            const results = await Promise.all(
                Array.from({ length: 20 }).map(() => GeminiService.chat("Concurrent Test"))
            );

            expect(results.every(r => r === "OK")).toBe(true);
            expect(mockGenerateContent).toHaveBeenCalledTimes(20);
        });
    });

    describe('Functional Deep Tests', () => {
        it('should analyze candidate profiles correctly', async () => {
            localStorage.setItem('globalworkforce_gemini_api_key', 'test-key');
            mockGenerateContent.mockResolvedValue({
                response: { text: () => "Candidate is highly qualified." }
            });

            const analysis = await GeminiService.analyzeCandidate({
                name: 'Jane Doe',
                professionalProfile: { skills: ['React', 'Node'] }
            } as any);

            expect(analysis).toBe("Candidate is highly qualified.");
        });

        it('should generate report insights as JSON', async () => {
            localStorage.setItem('globalworkforce_gemini_api_key', 'test-key');
            const mockJson = {
                strengths: ['Expertise'],
                risks: ['None'],
                placementProbability: 95,
                recommendedRoles: ['Senior Lead']
            };

            mockGenerateContent.mockResolvedValue({
                response: { text: () => JSON.stringify(mockJson) }
            });

            const insights = await GeminiService.getReportInsights({ id: 'cand1' } as any, 'LOW');
            expect(insights.score).toBeUndefined(); // It matches GeminiReportInsightsResult type
            expect(insights.placementProbability).toBe(95);
        });
    });
});
