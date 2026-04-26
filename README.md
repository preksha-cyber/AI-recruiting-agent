# AI Recruiting Agent

A working Agentic AI prototype for recruiting: parse a job description, generate candidate profiles, simulate outreach, and rank a shortlist by match + interest.

Built with React + Vite plus a secure server-side Anthropic proxy for live AI.

---

## Overview

This project demonstrates a real agent flow with the following stages:

- **JD parsing**: extract role title, company, seniority, required skills, and domain signals
- **Candidate discovery**: generate realistic profiles across strong, moderate, and weak fit
- **Conversational outreach**: simulate recruiter/candidate messaging and interest signals
- **Ranked shortlist**: score candidates by pipeline score = Match × 0.55 + Interest × 0.45

The app supports both a demo mode with mock data and a secure live AI mode.

---

## Quick start

```bash
git clone <your-repo-url>
cd ai-recruiting-agent
npm install
# macOS / Linux
cp .env.example .env
# Windows PowerShell
copy .env.example .env
```

Edit `.env` and set:

```env
VITE_ENABLE_LIVE_AI=true
ANTHROPIC_API_KEY=sk-ant-...
```

Then start locally:

```bash
npm run dev
```

Open [http://localhost:5173].

---

## Demo mode vs live mode

- **Demo mode**: works immediately without any API key when `VITE_ENABLE_LIVE_AI` is not `true`
- **Live AI mode**: frontend sends prompts to `/api/anthropic`, and the backend forwards them to Anthropic using `ANTHROPIC_API_KEY`

> Live AI mode keeps the Anthropic key server-side for deployment safety.

---

## Local development details

The frontend entry point is `src/main.jsx`, which renders `src/App.jsx`.

`src/App.jsx` contains the agent orchestration, including prompt construction, candidate generation, outreach simulation, and ranking.

`api/anthropic.js` is the backend proxy used only in live AI mode.

---

## Deploy to Vercel

1. Push the repo to GitHub or GitLab.
2. Sign in to Vercel and import the project at [https://vercel.com/new](https://vercel.com/new).
3. Confirm the root is the repository root and let Vercel detect Vite.
4. In Vercel project settings, add these environment variables:

   - `ANTHROPIC_API_KEY` = your Anthropic secret key
   - `VITE_ENABLE_LIVE_AI` = `true` (only if you want live AI mode in production)

5. Deploy the project.

### Notes for Vercel

- The API route `api/anthropic.js` is automatically served as a serverless function.
- `ANTHROPIC_API_KEY` must be set in Vercel for live AI mode to work.
- If `VITE_ENABLE_LIVE_AI` is unset or `false`, the deployed app runs in demo mode and still works.
**Live deployment**: https://ai-recruiting-agent.vercel.app (Vercel project: https://vercel.com/preksha-cybers-projects/ai-recruiting-agent)

---


## Project structure

```text
api/anthropic.js    # server-side Anthropic proxy
src/App.jsx         # main app, agent flow, and UI
src/main.jsx        # React entry point
src/mockData.js     # mock candidates and conversation data
src/App.css         # styling
index.html          # HTML shell
vercel.json         # Vercel config
.env.example        # environment template
```

---

## Notes

- The live agent is real and runs with Anthropic when enabled.
- The current architecture supports secure deployment by keeping the API key on the server.
- Demo mode makes it easy to share and test the prototype without an API key.

---

## License

MIT
