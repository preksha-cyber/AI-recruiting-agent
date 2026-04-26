# AI Recruiting Agent: Approach, Architecture, and Trade-offs

## Overview
The AI Recruiting Agent is a prototype demonstrating an agentic AI workflow for recruitment. It automates the process of parsing job descriptions, generating candidate profiles, simulating outreach conversations, and ranking candidates based on fit and interest. The system supports both a demo mode with mock data and a live AI mode using Anthropic's Claude for realistic interactions.

## Approach
The project adopts an agentic AI approach, breaking down the recruiting process into four sequential stages:

1. **Job Description Parsing**: Extracts key elements such as role title, company, seniority level, required skills, and domain-specific signals from unstructured job postings.
2. **Candidate Discovery**: Generates diverse candidate profiles across a spectrum of fit quality (strong, moderate, weak) to simulate a realistic talent pool.
3. **Conversational Outreach**: Simulates recruiter-candidate interactions to assess genuine candidate interest and engagement levels.
4. **Ranked Shortlisting**: Combines match quality and interest signals into a composite pipeline score (Match × 0.55 + Interest × 0.45) to prioritize candidates.

This staged approach mirrors real-world recruiting workflows while leveraging AI for efficiency and scalability. The system uses prompt engineering to guide Claude's responses, ensuring structured outputs for parsing and consistent conversational patterns.

## Architecture
The application follows a client-server architecture optimized for rapid prototyping and deployment:

### Frontend
- **Framework**: React 19 with Vite for fast development and building.
- **State Management**: Local component state using React hooks (useState, useCallback).
- **UI Components**: Custom CSS-styled components for avatars, score bars, conversation threads, and progress indicators.
- **Data Flow**: Asynchronous API calls to the backend, with fallback to mock data for demo mode.

### Backend
- **Platform**: Vercel serverless functions for API endpoints.
- **AI Integration**: A single `/api/anthropic` endpoint that proxies requests to Anthropic's API, handling authentication and error responses.
- **Security**: API keys stored server-side as environment variables, preventing client-side exposure.

### Deployment
- **Hosting**: Vercel for both frontend and serverless backend.
- **Configuration**: Environment variables managed via `.env` files and Vercel dashboard.

The architecture prioritizes simplicity and speed-to-market, with a clear separation between UI logic and AI processing.

## Trade-offs
Several design decisions were made to balance functionality, cost, and user experience:

### Live AI vs. Mock Data
- **Trade-off**: Live AI provides realistic, dynamic responses but incurs API costs and potential latency. Mock data offers instant, cost-free demos but lacks variability.
- **Rationale**: Both modes are supported to accommodate different use cases—demos for quick showcases and live mode for thorough testing.

### Client-Side Processing
- **Trade-off**: All AI calls are routed through the server to protect API keys, adding a network hop compared to direct client calls.
- **Rationale**: Security outweighs minor performance gains; serverless functions provide scalability without managing infrastructure.

### Prompt Engineering Over Fine-Tuning
- **Trade-off**: Relies on carefully crafted prompts rather than custom model training, limiting precision but reducing complexity and cost.
- **Rationale**: Suitable for a prototype; fine-tuning could be explored for production to improve accuracy.

### Scoring Algorithm Simplicity
- **Trade-off**: Uses a fixed weighted average for pipeline scores, which may not capture nuanced recruiting factors.
- **Rationale**: Provides a clear, interpretable metric for demonstration; real systems might incorporate ML models for better prediction.

### Scalability and Performance
- **Trade-off**: Serverless architecture scales automatically but may face cold start delays; no caching implemented for simplicity.
- **Rationale**: Adequate for a prototype with low traffic; production would benefit from caching and optimized prompts.

This approach demonstrates a viable path for AI-assisted recruiting, balancing innovation with practical constraints.