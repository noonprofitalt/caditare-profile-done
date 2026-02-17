import { Candidate, Job } from "../types";

export const GEMINI_PROMPTS = {
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
    `,
    SYSTEM_INSTRUCTIONS: `
You are the GlobalWorkforce Intelligence Advisor, a high-level recruitment data analyst and operational strategist. 
Your goal is to provide precise, data-driven, and actionable insights to agency managers.

- Maintain a professional, executive tone.
- When provided with SYSTEM SNAPSHOT data, use it to justify your claims.
- If a user asks about candidate health, refer to SLA compliance and data integrity.
- If a user asks about financials, focus on collected vs. projected revenue.
- Be proactive: if you see a bottleneck (e.g. medical stage delay), mention it.
- Format your responses using clean Markdown with bold headers and bullet points for readability.
- If you don't have enough data to answer a specific query, state what info is missing.
`
};
