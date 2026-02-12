# Developer Guide

This document provides technical details for developers working on the Global Workforce ERP system.

## 📁 Project Structure

```
caditare-profile-done/
├── components/          # React components
│   ├── Dashboard.tsx    # Main dashboard with KPIs
│   ├── CandidateList.tsx
│   ├── CandidateDetail.tsx
│   ├── CandidateForm.tsx
│   ├── ComplianceWidget.tsx
│   ├── DocumentManager.tsx
│   └── ...
├── services/            # Business logic and API integrations
│   ├── geminiService.ts      # AI integration with caching
│   ├── candidateService.ts   # Candidate CRUD operations
│   ├── complianceService.ts  # Passport/PCC validation
│   └── analyticsService.ts   # KPI calculations
├── context/             # React Context providers
│   └── AuthContext.tsx
├── types.ts             # TypeScript type definitions
├── e2e/                 # Playwright E2E tests
├── test/                # Vitest unit tests
└── .github/workflows/   # CI/CD configuration
```

## 🏗️ Architecture

### State Management
- **Local State**: React hooks (`useState`, `useReducer`) for component-level state
- **Context API**: `AuthContext` for authentication state
- **Services**: Stateless service classes for business logic

### Data Flow
1. **Components** call **Services** for data operations
2. **Services** handle API calls, caching, and data transformation
3. **Types** ensure type safety across the application

### AI Integration
The `GeminiService` provides:
- **Caching**: 30-minute in-memory cache to reduce API costs
- **Retry Logic**: Automatic retries for network failures
- **Structured Prompts**: Template-based prompts for consistency

```typescript
// Example: Analyze a candidate
const analysis = await GeminiService.analyzeCandidate(candidate);
```

## 🧪 Testing Strategy

### Unit Tests (Vitest)
Located in `test/` directory. Test individual components and services in isolation.

```bash
npm run test          # Run tests
npm run test:ui       # Interactive UI
npm run test:coverage # Coverage report
```

**Example Test:**
```typescript
// test/services/analyticsService.test.ts
import { describe, it, expect } from 'vitest';
import { AnalyticsService } from '../services/analyticsService';

describe('AnalyticsService', () => {
  it('calculates KPIs correctly', () => {
    const candidates = [/* mock data */];
    const kpi = AnalyticsService.calculateKPI(candidates);
    expect(kpi.totalCandidates).toBe(10);
  });
});
```

### E2E Tests (Playwright)
Located in `e2e/` directory. Test complete user workflows in a real browser.

```bash
npm run test:e2e      # Run E2E tests
npm run test:e2e:ui   # Interactive mode
```

**Example Test:**
```typescript
// e2e/candidate-profile.spec.ts
test('Candidate Profile loads successfully', async ({ page }) => {
  await page.goto('/candidates/1');
  await expect(page.locator('h1')).toContainText('John Doe');
});
```

## 🔄 CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push:

1. **Install Dependencies**: `npm ci`
2. **Lint**: `npm run lint`
3. **Unit Tests**: `npm run test`
4. **Build**: `npm run build`

Matrix testing across Node.js 18.x and 20.x ensures compatibility.

## 🎨 Code Style

### Linting
- **ESLint**: Enforces code quality rules
- **Prettier**: Auto-formats code
- **Husky**: Pre-commit hooks prevent bad code from being committed

```bash
npm run lint  # Check for issues
```

### TypeScript
- **Strict Mode**: Enabled in `tsconfig.json`
- **No `any`**: Avoid using `any` type; use proper interfaces
- **Type Imports**: Use `import type` for type-only imports

## 🔧 Key Services

### GeminiService
AI-powered analysis with caching and retry logic.

**Methods:**
- `analyzeCandidate(candidate)`: Generate candidate summary
- `getMatchScore(candidate, job)`: Calculate job match score
- `chat(message, context)`: AI chat interface

### ComplianceService
Validates passport and police clearance documents.

**Methods:**
- `evaluatePassport(expiry, number, country, issued)`: Returns `PassportData` with status
- `evaluatePCC(issued, lastInspection)`: Returns `PCCData` with status

### CandidateService
Mock CRUD operations for candidates (replace with real API).

**Methods:**
- `getAll()`: Fetch all candidates
- `getById(id)`: Fetch single candidate
- `create(candidate)`: Create new candidate
- `update(id, data)`: Update existing candidate

## 🚀 Adding New Features

### 1. Define Types
Add interfaces to `types.ts`:
```typescript
export interface NewFeature {
  id: string;
  name: string;
}
```

### 2. Create Service
Add business logic to `services/`:
```typescript
export class NewFeatureService {
  static async getData(): Promise<NewFeature[]> {
    // Implementation
  }
}
```

### 3. Build Component
Create React component in `components/`:
```typescript
export default function NewFeatureComponent() {
  const [data, setData] = useState<NewFeature[]>([]);
  // Component logic
}
```

### 4. Write Tests
Add unit tests in `test/` and E2E tests in `e2e/`.

### 5. Update Documentation
Update this file and `README.md` as needed.

## 🐛 Debugging

### Development Tools
- **React DevTools**: Inspect component hierarchy
- **Browser Console**: Check for errors and logs
- **Vite HMR**: Hot module replacement for fast iteration

### Common Issues

**AI Analysis Fails:**
- Check if Gemini API key is configured in Settings
- Verify network connectivity
- Check browser console for detailed error messages

**Tests Failing:**
- Run `npm run lint` to check for code quality issues
- Ensure all dependencies are installed: `npm install`
- Clear cache: `rm -rf node_modules && npm install`

## 📝 Contribution Guidelines

1. **Branch Naming**: `feature/description` or `fix/description`
2. **Commit Messages**: Use conventional commits format
   - `feat: add new feature`
   - `fix: resolve bug`
   - `docs: update documentation`
3. **Pull Requests**: 
   - Ensure all tests pass
   - Update documentation if needed
   - Request review from team members

## 🔐 Security

- **API Keys**: Never commit API keys to version control
- **Environment Variables**: Use `.env.local` for sensitive data
- **Input Validation**: Always validate user input
- **XSS Protection**: React escapes content by default

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Guide](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)
- [Google Gemini API](https://ai.google.dev/)

## 🤝 Support

For questions or issues, please contact the development team or create an issue in the repository.
