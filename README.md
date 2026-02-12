# Global Workforce ERP

A comprehensive recruitment and workforce management system built with React, TypeScript, and Google Gemini AI.

## 🚀 Features

- **Candidate Management**: Track candidates through the entire recruitment workflow from registration to departure
- **AI-Powered Analysis**: Leverage Google Gemini for candidate analysis and job matching
- **Compliance Tracking**: Monitor passport and police clearance validity with automated alerts
- **Document Management**: Centralized document handling with version control and approval workflows
- **Real-time Analytics**: Dashboard with KPIs, bottleneck detection, and performance metrics
- **Employer CRM**: Manage partner relationships, quotas, and commission tracking
- **Team Collaboration**: Built-in chat system with context-aware messaging

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, React Router
- **Styling**: Vanilla CSS with modern design patterns
- **AI Integration**: Google Generative AI (Gemini 1.5 Flash)
- **Charts**: Recharts for data visualization
- **Testing**: Vitest + React Testing Library (unit), Playwright (E2E)
- **Code Quality**: ESLint, Prettier, Husky pre-commit hooks
- **CI/CD**: GitHub Actions

## 📦 Quick Start

### Prerequisites
- Node.js 18.x or 20.x
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd caditare-profile-done

# Install dependencies
npm install

# Set up environment variables (optional)
cp .env.local.example .env.local
# Add your Google Gemini API key to .env.local or configure it in Settings
```

### Development

```bash
# Start development server
npm run dev

# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Lint code
npm run lint
```

### Build

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## 🧪 Testing

- **Unit Tests**: `npm run test` - Fast component and logic tests with Vitest
- **E2E Tests**: `npm run test:e2e` - Browser automation tests with Playwright
- **Coverage**: `npm run test:coverage` - Generate test coverage report

## 📚 Documentation

For detailed architecture, testing strategies, and contribution guidelines, see [DEVELOPER.md](./DEVELOPER.md).

## 🔑 Configuration

### Google Gemini API Key
1. Navigate to Settings in the application
2. Enter your Google Gemini API key
3. The key is stored locally in your browser

## 🤝 Contributing

1. Ensure all tests pass: `npm run test && npm run test:e2e`
2. Lint your code: `npm run lint`
3. Pre-commit hooks will automatically run linting before each commit

## 📄 License

Private - All rights reserved
