# System Architecture (C4 Model)

This document provides a high-level overview of the GlobalWorkforce ERP system architecture using the C4 model.

## Level 1: System Context Diagram

```mermaid
C4Context
    title System Context Diagram for GlobalWorkforce ERP

    Person(user, "User", "A recruiter or administrator using the platform.")
    System(erp, "GlobalWorkforce ERP", "The central platform for managing candidates, partners, and recruitment workflows.")

    System_Ext(supabase, "Supabase", "Backend as a Service for database, auth, and storage.")
    System_Ext(gemini, "Google Gemini API", "AI services for intelligence engine and document processing.")

    Rel(user, erp, "Uses", "HTTPS")
    Rel(erp, supabase, "Queries/Persists", "HTTPS/PostgreSQL")
    Rel(erp, gemini, "Invokes", "HTTPS/gRPC")
```

## Level 2: Container Diagram

```mermaid
C4Container
    title Container Diagram for GlobalWorkforce ERP

    Person(user, "User", "Platform Administrator")

    Container_Boundary(frontend, "Frontend Application") {
        Component(spa, "Single Page Application", "React, TypeScript, Vite", "The main user interface.")
        Component(services, "Service Layer", "TypeScript", "Handles API calls and business logic (e.g., candidateService).")
        Component(context, "State Management", "React Context", "Manages auth and global state.")
    }

    System_Ext(db, "Supabase Database", "PostgreSQL", "Stores candidate records, audit logs, and system configuration.")
    System_Ext(auth, "Supabase Auth", "GoTrue", "Handles user authentication.")
    System_Ext(ai, "Gemini AI", "Google AI SDK", "Provides intelligence engine capabilities.")

    Rel(user, spa, "Interacts with", "Browser")
    Rel(spa, services, "Calls")
    Rel(services, context, "Updates/Reads")

    Rel(services, db, "SQL Queries", "HTTPS/PostgreSQL")
    Rel(services, auth, "Authenticates", "HTTPS/JWT")
    Rel(services, ai, "Prompts", "HTTPS")
```

## Key Technologies
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite.
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions).
- **AI**: Google Gemini Pro (via `@google/generative-ai`).
- **Testing**: Vitest (Unit), Playwright (E2E).
