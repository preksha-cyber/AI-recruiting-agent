import { useState, useCallback } from "react";
import "./App.css";
import { MOCK_PARSED_JD, MOCK_CANDIDATES, MOCK_CONVERSATIONS } from "./mockData";

const SAMPLE_JD = `Senior Full Stack Engineer — Finvo (Series B FinTech)

We're building next-gen B2B payment rails that process $3B in annual transactions. Join our CTO and a close-knit team of 4 engineers as we scale aggressively.

About the Role:
You'll own end-to-end features from API design to polished frontend. We ship fast, review rigorously, and care deeply about reliability at scale.

Requirements:
• 5+ years of full-stack engineering experience
• Expert in React and TypeScript
• Strong Node.js backend (Python a plus)
• PostgreSQL and Redis experience
• AWS familiarity (ECS, RDS, Lambda)
• Prior experience at a high-growth startup

Nice to Have:
• FinTech or payments domain knowledge
• GraphQL or tRPC experience
• Open-source contributions
• Experience mentoring junior engineers

Comp: $160k–$200k + meaningful equity
Remote-first, quarterly offsites`;

const LIVE_MODE = import.meta.env.VITE_ENABLE_LIVE_AI === "true";
const ANTHROPIC_API_ENDPOINT = "/api/anthropic";

async function callClaude(system, user) {
  const res = await fetch(ANTHROPIC_API_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ system, user }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Agent proxy error ${res.status}: ${errorBody}`);
  }

  const d = await res.json();
  return d.content.filter((b) => b.type === "text").map((b) => b.text).join("");
}

function safeJSON(text) {
  return JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
}

const PROC_STEPS = [
  { label: "Parsing job description", sub: "Extracting skills, seniority signals and criteria" },
  { label: "Discovering candidates", sub: "Generating 8 profiles spanning high to low match quality" },
  { label: "Simulating outreach", sub: "AI conversations assessing genuine candidate interest" },
  { label: "Ranking shortlist", sub: "Combining match + interest into pipeline scores" },
];

const AV_COLORS = ["#B5D4F4","#9FE1CB","#FAC775","#F5C4B3","#CECBF6","#C0DD97","#F4C0D1","#D3D1C7"];

function Avatar({ name, i }) {
  const ini = name.trim().split(" ").slice(0, 2).map((n) => n[0] || "").join("").toUpperCase();
  return (
    <div className="avatar" style={{ background: AV_COLORS[i % AV_COLORS.length] }}>
      {ini}
    </div>
  );
}

function ScoreBar({ pct, color }) {
  return (
    <div className="score-bar-track">
      <div className="score-bar-fill" style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }} />
    </div>
  );
}

function FitBadge({ score }) {
  const [cls, label] =
    score >= 80 ? ["badge-success", "Strong fit"]
    : score >= 65 ? ["badge-info", "Good fit"]
    : score >= 50 ? ["badge-warning", "Partial fit"]
    : ["badge-danger", "Weak fit"];
  return <span className={`badge ${cls}`}>{label}</span>;
}

function ConvThread({ conv }) {
  if (!conv?.conversation?.length) return null;
  return (
    <div className="conv-thread">
      {conv.conversation.map((m, i) => {
        const isR = m.role === "recruiter";
        const txt = m.msg || m.message || "";
        return (
          <div key={i} className={`conv-msg ${isR ? "msg-left" : "msg-right"}`}>
            <span className="msg-label">{isR ? "Recruiter (AI)" : "Candidate"}</span>
            <div className={`msg-bubble ${isR ? "bubble-left" : "bubble-right"}`}>{txt}</div>
          </div>
        );
      })}
    </div>
  );
}

function CandidateCard({ c, rank, open, onToggle }) {
  const ps = c.pipeline_score ?? c.match_score;
  return (
    <div className="candidate-card">
      <div className="card-header">
        <span className="rank-num">#{rank}</span>
        <Avatar name={c.name} i={rank - 1} />
        <div className="candidate-info">
          <div className="candidate-name-row">
            <span className="candidate-name">{c.name}</span>
            <FitBadge score={ps} />
          </div>
          <p className="candidate-meta">{c.current_title} · {c.current_company}</p>
        </div>
        <div className="pipeline-score">
          <div className="score-num">{ps}</div>
          <div className="score-label">pipeline</div>
        </div>
      </div>

      <div className="score-rows">
        <div className="score-row">
          <span className="score-dim">Match</span>
          <ScoreBar pct={c.match_score} color="#1D9E75" />
          <span className="score-val success">{c.match_score}</span>
        </div>
        <div className="score-row">
          <span className="score-dim">Interest</span>
          {c.interest_score != null ? (
            <>
              <ScoreBar pct={c.interest_score} color="#BA7517" />
              <span className="score-val warning">{c.interest_score}</span>
            </>
          ) : (
            <span className="no-contact">Not contacted</span>
          )}
        </div>
      </div>

      <div className="card-footer">
        <span className="card-meta">{c.years_exp} yrs exp · {c.location}</span>
        <button className="toggle-btn" onClick={onToggle}>{open ? "Hide ↑" : "Details ↓"}</button>
      </div>

      {open && (
        <div className="card-details">
          {c.bio && <p className="candidate-bio">"{c.bio}"</p>}

          <div className="details-grid">
            <div>
              <p className="detail-heading">Why they match</p>
              {(c.match_reasons || []).map((r, i) => (
                <div key={i} className="detail-item">
                  <span className="icon-check">✓</span>
                  <span className="detail-text">{r}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="detail-heading">Gaps</p>
              {(c.gaps || []).length > 0 ? (c.gaps || []).map((g, i) => (
                <div key={i} className="detail-item">
                  <span className="icon-warn">△</span>
                  <span className="detail-text">{g}</span>
                </div>
              )) : <span className="no-gaps">No notable gaps</span>}
            </div>
          </div>

          {c.conv && (
            <>
              <p className="detail-heading" style={{ marginTop: 14 }}>Simulated outreach conversation</p>
              <ConvThread conv={c.conv} />
              <div className="signal-tags">
                {(c.conv.interest_signals || []).map((s, i) => (
                  <span key={i} className="badge badge-success">{s}</span>
                ))}
                {(c.conv.concerns || []).map((s, i) => (
                  <span key={i} className="badge badge-warning">⚠ {s}</span>
                ))}
                {c.conv.availability && (
                  <span className="badge badge-neutral">Available: {c.conv.availability}</span>
                )}
              </div>
            </>
          )}

          <div className="skill-tags">
            {(c.skills || []).slice(0, 9).map((s) => (
              <span key={s} className="skill-tag">{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [phase, setPhase] = useState("input");
  const [jd, setJd] = useState(SAMPLE_JD);
  const [step, setStep] = useState(-1);
  const [parsedJD, setParsedJD] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [error, setError] = useState("");

  const runMock = useCallback(async () => {
    setPhase("processing"); setStep(0); setError("");
    await new Promise((r) => setTimeout(r, 900));
    setParsedJD(MOCK_PARSED_JD);

    setStep(1);
    await new Promise((r) => setTimeout(r, 1200));

    setStep(2);
    await new Promise((r) => setTimeout(r, 1500));

    setStep(3);
    const enriched = MOCK_CANDIDATES.map((c) => {
      const conv = MOCK_CONVERSATIONS[c.id] ?? null;
      const interest_score = conv?.interest_score ?? null;
      const pipeline_score = interest_score != null
        ? Math.round(c.match_score * 0.55 + interest_score * 0.45)
        : null;
      return { ...c, conv, interest_score, pipeline_score };
    }).sort((a, b) => {
      const pa = a.pipeline_score ?? Math.round(a.match_score * 0.55);
      const pb = b.pipeline_score ?? Math.round(b.match_score * 0.55);
      return pb - pa;
    });

    await new Promise((r) => setTimeout(r, 500));
    setCandidates(enriched);
    setPhase("results");
  }, []);

  const run = useCallback(async () => {
    if (!jd.trim()) return;
    if (!LIVE_MODE) {
      runMock();
      return;
    }
    setPhase("processing"); setStep(0); setError("");
    try {
      const p = safeJSON(await callClaude(
        "You are a recruiting analyst. Respond ONLY with valid JSON, no markdown, no extra text.",
        `Parse this JD. Return ONLY this JSON structure:
{"role_title":"string","company":"string","exp_years_min":5,"required_skills":["skill"],"nice_to_have":["skill"],"seniority":"senior","domain":"string"}
JD:\n${jd}`
      ));
      setParsedJD(p);

      setStep(1);
      const { candidates: raw } = safeJSON(await callClaude(
        "You are a senior technical recruiter. Respond ONLY with valid JSON, no markdown.",
        `Job requirements: ${JSON.stringify(p)}

Generate exactly 8 diverse, realistic candidate profiles spanning a range of match quality (2-3 great fits, 3 moderate, 2 weak). Return ONLY this JSON:
{"candidates":[{"id":"c1","name":"Full Name","current_title":"string","current_company":"string","years_exp":6,"location":"City, Country","skills":["skill1","skill2"],"education":"Degree, University","match_score":85,"match_reasons":["specific reason 1","specific reason 2","specific reason 3"],"gaps":["gap1","gap2"],"bio":"Two-sentence realistic LinkedIn-style bio."}]}
Sort by match_score descending. Use diverse names and realistic backgrounds. Be specific in match_reasons.`
      ));

      setStep(2);
      const top6 = raw.slice(0, 6);
      const settled = await Promise.allSettled(
        top6.map((c) => callClaude(
          "You simulate realistic recruiter-candidate LinkedIn conversations. Respond ONLY with valid JSON, no markdown.",
          `Simulate outreach for:
Candidate: ${c.name}, ${c.current_title} at ${c.current_company}, ${c.years_exp} years exp
Role: ${p.role_title} at ${p.company || "a Series B startup"} (${p.seniority})

Write 4 messages alternating recruiter/candidate. Make it feel authentic — vary enthusiasm based on candidate fit. High-match candidates can ask smart questions. Low-fit ones might be lukewarm.
Return ONLY:
{"conversation":[{"role":"recruiter","msg":"..."},{"role":"candidate","msg":"..."},{"role":"recruiter","msg":"..."},{"role":"candidate","msg":"..."}],"interest_score":72,"interest_signals":["signal1","signal2"],"concerns":["concern if any"],"availability":"2 weeks notice"}`
        ).then((t) => ({ id: c.id, ...safeJSON(t) })))
      );

      const convMap = {};
      settled.forEach((r, i) => { if (r.status === "fulfilled") convMap[top6[i].id] = r.value; });

      setStep(3);
      const enriched = raw.map((c) => {
        const conv = convMap[c.id] || null;
        const interest_score = conv?.interest_score ?? null;
        const pipeline_score = interest_score != null
          ? Math.round(c.match_score * 0.55 + interest_score * 0.45)
          : null;
        return { ...c, conv, interest_score, pipeline_score };
      }).sort((a, b) => {
        const pa = a.pipeline_score ?? Math.round(a.match_score * 0.55);
        const pb = b.pipeline_score ?? Math.round(b.match_score * 0.55);
        return pb - pa;
      });

      await new Promise((r) => setTimeout(r, 500));
      setCandidates(enriched);
      setPhase("results");
    } catch (e) {
      setError(e.message);
      setPhase("input");
    }
  }, [jd, runMock]);

  const reset = useCallback(() => {
    setPhase("input"); setCandidates([]); setParsedJD(null); setExpanded(null); setStep(-1);
  }, []);

  if (phase === "processing") return (
    <div className="page">
      <div className="container">
        <h2>Running agent pipeline</h2>
        <p className="subtitle">This takes about 30–45 seconds across 7 API calls.</p>
        <div className="steps-list">
          {PROC_STEPS.map((s, i) => {
            const done = i < step, active = i === step;
            return (
              <div key={i} className={`step-item ${done ? "done" : active ? "active" : "pending"}`}>
                <div className="step-dot">{done ? "✓" : i + 1}</div>
                <div>
                  <p className="step-label">{s.label}{active ? "…" : ""}</p>
                  <p className="step-sub">{s.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (phase === "results") {
    const contacted = candidates.filter((c) => c.conv).length;
    const avgMatch = candidates.length ? Math.round(candidates.reduce((a, c) => a + c.match_score, 0) / candidates.length) : 0;
    const topScore = candidates.length ? Math.max(...candidates.map((c) => c.pipeline_score ?? c.match_score)) : 0;
    return (
      <div className="page">
        <div className="container">
          <div className="results-header">
            <div>
              <h2>{parsedJD?.role_title || "Results"}</h2>
              <p className="subtitle">{[parsedJD?.company, parsedJD?.seniority, parsedJD?.domain].filter(Boolean).join(" · ")}</p>
            </div>
            <button onClick={reset}>← New search</button>
          </div>

          <div className="metrics-grid">
            {[{ l: "Candidates analyzed", v: candidates.length }, { l: "Avg match score", v: avgMatch }, { l: "Top pipeline score", v: topScore }].map((m) => (
              <div key={m.l} className="metric-card">
                <p className="metric-label">{m.l}</p>
                <p className="metric-value">{m.v}</p>
              </div>
            ))}
          </div>

          <div className="results-meta">
            <span>Pipeline score = Match ×0.55 + Interest ×0.45 · sorted by pipeline score</span>
            <span>{contacted} outreach simulated · {candidates.length - contacted} match-only</span>
          </div>

          <div className="candidates-list">
            {candidates.map((c, i) => (
              <CandidateCard key={c.id} c={c} rank={i + 1} open={expanded === c.id} onToggle={() => setExpanded(expanded === c.id ? null : c.id)} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div className="hero">
          <div className="hero-badge">AI Agent</div>
          <h1>Recruiting Agent</h1>
          <p className="hero-sub">Paste a job description. The agent parses requirements, discovers matched candidates, simulates conversational outreach to assess interest, and outputs a ranked shortlist scored on two dimensions.</p>
        </div>

        <div className="jd-label-row">
          <span className="field-label">Job description</span>
          <button className="link-btn" onClick={() => setJd(SAMPLE_JD)}>Use sample JD ↗</button>
        </div>
        <textarea
          className="jd-input"
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste your job description here…"
        />
        {error && <p className="error-msg">{error}</p>}

        <button className="run-btn" onClick={run} disabled={!jd.trim()}>
          Analyze &amp; match candidates →
        </button>

        <div className="features-grid">
          {[
            { icon: "◈", t: "JD parsing", d: "Extracts skills, experience level, domain and seniority signals" },
            { icon: "◉", t: "Candidate discovery", d: "Generates realistic profiles with explainable match scores" },
            { icon: "◎", t: "Conversational outreach", d: "Simulates AI recruiter conversations to gauge real interest" },
            { icon: "◆", t: "Ranked shortlist", d: "Two-axis scoring: Match (55%) + Interest (45%) = Pipeline score" },
          ].map((f) => (
            <div key={f.t} className="feature-card">
              <p className="feature-title">{f.icon} {f.t}</p>
              <p className="feature-desc">{f.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
