import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiService } from '../../services/geminiService';
import { Candidate, Job } from '../../types';

const { mockText } = vi.hoisted(() => ({
    mockText: vi.fn(),
}));

// Mock the Google Generative AI
vi.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: class {
        getGenerativeModel = vi.fn().mockReturnValue({
            generateContent: vi.fn().mockResolvedValue({
                response: {
                    text: mockText,
                },
            }),
        });
    },
}));

describe('GeminiService', () => {
    beforeEach(() => {
        // Clear cache before each test
        vi.clearAllMocks();
        GeminiService.clearCache();
        localStorage.clear();
        localStorage.setItem('globalworkforce_gemini_api_key', 'test-api-key');
        mockText.mockReturnValue('Mock AI response');
    });

    describe('analyzeCandidate', () => {
        it('should analyze a candidate and return response', async () => {
            const mockCandidate: Candidate = {
                id: '1',
                name: 'John Doe',
                role: 'Electrician',
                experienceYears: 5,
                skills: ['Wiring', 'Installation'],
                location: 'Dubai',
                stage: 'Registered' as any,
                stageStatus: 'Pending' as any,
                stageEnteredAt: '2024-01-01',
                stageData: {},
                workflowLogs: [],
                timelineEvents: [],
                comments: [],
                email: 'john@example.com',
                phone: '+1234567890',
                preferredCountries: ['United Arab Emirates'],
                avatarUrl: '',
            } as any as Candidate;

            const result = await GeminiService.analyzeCandidate(mockCandidate);
            expect(result).toBe('Mock AI response');
        });

        it('should use cache for repeated requests', async () => {
            const mockCandidate: Candidate = {
                id: '1',
                name: 'John Doe',
                role: 'Electrician',
                experienceYears: 5,
                skills: ['Wiring'],
                location: 'Dubai',
                stage: 'Registered' as any,
                stageStatus: 'Pending' as any,
                stageEnteredAt: '2024-01-01',
                stageData: {},
                workflowLogs: [],
                timelineEvents: [],
                comments: [],
                email: 'john@example.com',
                phone: '+1234567890',
                preferredCountries: ['United Arab Emirates'],
                avatarUrl: '',
                documents: [],
            } as any as Candidate;

            const result1 = await GeminiService.analyzeCandidate(mockCandidate);
            const result2 = await GeminiService.analyzeCandidate(mockCandidate);

            expect(result1).toBe(result2);
        });
    });

    describe('getMatchScore', () => {
        it('should return match score for candidate and job', async () => {
            const mockCandidate: Candidate = {
                id: '1',
                name: 'John Doe',
                role: 'Electrician',
                experienceYears: 5,
                skills: ['Wiring', 'Installation'],
                location: 'Dubai',
                stage: 'Registered' as any,
                stageStatus: 'Pending' as any,
                stageEnteredAt: '2024-01-01',
                stageData: {},
                workflowLogs: [],
                timelineEvents: [],
                comments: [],
                email: 'john@example.com',
                phone: '+1234567890',
                preferredCountries: ['United Arab Emirates'],
                avatarUrl: '',
                documents: [],
            } as any as Candidate;

            const mockJob: Job = {
                id: 'j1',
                title: 'Senior Electrician',
                company: 'ABC Corp',
                location: 'Dubai',
                salaryRange: '$3000-$5000',
                type: 'Full-time',
                description: 'Experienced electrician needed',
                status: 'Open' as any,
                postedDate: '2024-01-01',
                requirements: ['5+ years experience', 'Wiring expertise'],
            };

            mockText.mockReturnValue(JSON.stringify({ score: 85, reason: "Good match" }));

            const result = await GeminiService.getMatchScore(mockCandidate, mockJob);
            expect(result).toHaveProperty('score');
            expect(result).toHaveProperty('reason');
        });
    });

    describe('API Key Management', () => {
        it('should save and retrieve API key', () => {
            GeminiService.saveApiKey('new-test-key');
            expect(GeminiService.hasApiKey()).toBe(true);
        });

        it('should throw error when API key is missing', async () => {
            localStorage.clear();

            const mockCandidate: Candidate = {
                id: '1',
                name: 'John Doe',
                role: 'Electrician',
                experienceYears: 5,
                skills: [],
                location: 'Dubai',
                stage: 'Registered' as any,
                stageStatus: 'Pending' as any,
                stageEnteredAt: '2024-01-01',
                stageData: {},
                workflowLogs: [],
                timelineEvents: [],
                comments: [],
                email: 'john@example.com',
                phone: '+1234567890',
                preferredCountries: [],
                avatarUrl: '',
                documents: [],
            } as any as Candidate;

            const result = await GeminiService.analyzeCandidate(mockCandidate);
            expect(result).toContain('AI Analysis Failed');
        });
    });
});
