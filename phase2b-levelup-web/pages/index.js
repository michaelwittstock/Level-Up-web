import { useEffect, useRef, useState, useCallback } from "react";
import Head from "next/head";

const TITLES = ["Getting Started", "Spark", "Builder", "Momentum", "Warrior", "Relentless", "Unstoppable", "Legend"];
const TABS = [
  ["today", "⚡ Today"],
  ["h75", "🔥 75 Hard"],
  ["focus", "⏱️ Focus"],
  ["learn", "📚 Learn"],
  ["reflect", "🙏 Reflect"],
];

function todayStr() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function mmss(s) {
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}

// ---- persistent XP / streak (localStorage) ----
function loadS() {
  if (typeof window === "undefined") return { xp: 0, streak: 0, lastDay: "", wins: 0, pomo: 0, pomoDay: "" };
  try {
    return { xp: 0, streak: 0, lastDay: "", wins: 0, pomo: 0, pomoDay: "", ...JSON.parse(localStorage.getItem("levelup-web") || "{}") };
  } catch {
    return { xp: 0, streak: 0, lastDay: "", wins: 0, pomo: 0, pomoDay: "" };
  }
}

export default function Home() {
  const [tab, setTab] = useState("today");
  const [S, setS] = useState(loadS);
  const [toast, setToast] = useState("");
  const toastT = useRef(null);

  const save = useCallback((next) => {
    setS(next);
    try { localStorage.setItem("levelup-web", JSON.stringify(next)); } catch {}
  }, []);

  const say = useCallback((m) => {
    setToast(m);
    clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(""), 2000);
  }, []);

  const xp = useCallback((n, winToo) => {
    setS((prev) => {
      const t = todayStr();
      let streak = prev.streak, lastDay = prev.lastDay;
      if (lastDay !== t) {
        const y = new Date(); y.setDate(y.getDate() - 1);
        const ys = y.getFullYear() + "-" + String(y.getMonth() + 1).padStart(2, "0") + "-" + String(y.getDate()).padStart(2, "0");
        streak = lastDay === ys ? streak + 1 : 1;
        lastDay = t;
      }
      const next = { ...prev, xp: prev.xp + n, streak, lastDay, wins: prev.wins + (winToo ? 1 : 0) };
      try { localStorage.setItem("levelup-web", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const lv = Math.floor(S.xp / 100) + 1;
  const into = S.xp % 100;

  return (
    <div className="app">
      <Head>
        <title>Level Up</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0d0f14" />
      </Head>

      <header className="hero">
        <div className="hero-top">
          <div>
            <div className="hello">Let&rsquo;s go, Michael</div>
            <div className="date">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</div>
          </div>
          <div className="lvl">
            <div className="lvlname">Lv {lv} · {TITLES[Math.min(lv - 1, TITLES.length - 1)]}</div>
            <div className="xpbar"><i style={{ width: into + "%" }} /></div>
            <div className="xptext">{into}/100 XP · 🔥 {S.streak} day streak · 🏆 {S.wins}</div>
          </div>
        </div>
        <nav className="tabs">
          {TABS.map(([k, label]) => (
            <button key={k} className={"tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>{label}</button>
          ))}
        </nav>
      </header>

      <main>
        {tab === "today" && <Today xp={xp} say={say} />}
        {tab === "h75" && <H75 xp={xp} say={say} />}
        {tab === "focus" && <Focus xp={xp} say={say} S={S} save={save} />}
        {tab === "learn" && <Learn />}
        {tab === "reflect" && <Reflect xp={xp} say={say} />}
      </main>

      <footer className="foot">
        Personal Level Up · synced with your Notion ·{" "}
        <a href="https://app.notion.com/p/390fcb70586381878204cfabca02ad93" target="_blank" rel="noopener noreferrer">Open hub ↗</a>
      </footer>
      {toast && <div className="toast show">{toast}</div>}
    </div>
  );
}

// ================= TODAY =================
function Today({ xp, say }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const load = useCallback(async () => {
    setErr(null);
    try {
      const j = await (await fetch("/api/today")).json();
      if (j.error) throw new Error(j.error);
      setData(j);
    } catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function done(id) {
    setData((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) }));
    xp(15, true); say("+15 XP 💪");
    await fetch("/api/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  }

  return (
    <>
      {err && <Err retry={load} msg={err} />}
      {!data && !err && <Skel />}
      {data?.quote && (
        <blockquote className="quote">
          &ldquo;{data.quote.quote}&rdquo;
          <cite>&mdash; {data.quote.author || "Unknown"}</cite>
        </blockquote>
      )}
      {data && (
        <section>
          <h2>Tasks <span className="sub">{data.tasks.length ? data.tasks.length + " to go" : "clear"}</span></h2>
          {data.tasks.length === 0 && <p className="empty">No tasks set for 🔥 Today. Add one in your hub. ✨</p>}
          {data.tasks.map((t) => (
            <div className="task" key={t.id}>
              <div className="tk">
                <div className="t">{t.title}</div>
                {t.step && <div className="step">↳ {t.step}</div>}
                <div className="chips">
                  {t.priority?.includes("Must") && <span className="c must">⭐ Must</span>}
                  {t.energy && <span className="c">{t.energy}</span>}
                </div>
              </div>
              <button className="do" onClick={() => done(t.id)}>Done</button>
            </div>
          ))}
        </section>
      )}
    </>
  );
}

// ================= 75 HARD =================
function H75({ xp, say }) {
  const [row, setRow] = useState(undefined);
  const [err, setErr] = useState(null);
  const load = useCallback(async () => {
    setErr(null);
    try {
      const j = await (await fetch("/api/h75?date=" + todayStr())).json();
      if (j.error) throw new Error(j.error);
      setRow(j.row);
    } catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function toggle(item) {
    const on = !item.on;
    setRow((r) => ({ ...r, items: r.items.map((i) => (i.prop === item.prop ? { ...i, on } : i)) }));
    if (on) { xp(4, false); }
    await fetch("/api/h75", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: row.id, prop: item.prop, on }) });
    const doneNow = row.items.filter((i) => (i.prop === item.prop ? on : i.on)).length;
    if (doneNow === 7) { xp(0, true); say("Perfect day. Unbreakable. 🔥"); }
  }

  const done = row?.items?.filter((i) => i.on).length || 0;
  return (
    <>
      {err && <Err retry={load} msg={err} />}
      {row === undefined && !err && <Skel />}
      {row === null && <p className="empty">No 75 Hard row for today — check your tracker dates in Notion.</p>}
      {row && (
        <section>
          <h2>{row.day} of 75 <span className="sub">{done}/7</span></h2>
          <div className="ringwrap"><div className="ring" style={{ "--frac": done / 7 }}><b>{done}/7</b></div></div>
          <div className="h75grid">
            {row.items.map((i) => (
              <button key={i.prop} className={"h75item" + (i.on ? " on" : "")} onClick={() => toggle(i)}>
                <span className="box">✓</span>{i.label}
              </button>
            ))}
          </div>
          <p className="empty">{done === 7 ? "Perfect day. Unbreakable. 🔥" : "Check off all 7. Miss one → back to Day 1."}</p>
        </section>
      )}
    </>
  );
}

// ================= FOCUS (timers) =================
function useTimer(total, onDone) {
  const [remaining, setRemaining] = useState(total);
  const [running, setRunning] = useState(false);
  const endRef = useRef(null);
  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => {
      const r = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
      setRemaining(r);
      if (r <= 0) { setRunning(false); clearInterval(iv); onDone && onDone(); }
    }, 250);
    return () => clearInterval(iv);
  }, [running, onDone]);
  return {
    remaining, running,
    toggle() {
      if (running) {
        setRemaining(Math.max(0, Math.round((endRef.current - Date.now()) / 1000)));
        setRunning(false);
      } else {
        endRef.current = Date.now() + (remaining <= 0 ? total : remaining) * 1000;
        if (remaining <= 0) setRemaining(total);
        setRunning(true);
      }
    },
    reset(t) { setRunning(false); setRemaining(t ?? total); },
  };
}

function Focus({ xp, say, S, save }) {
  const [mode, setMode] = useState(25);
  const pomo = useTimer(mode * 60, () => {
    if (mode === 25) { save({ ...S, pomo: (S.pomoDay === todayStr() ? S.pomo : 0) + 1, pomoDay: todayStr() }); xp(10, false); say("Pomodoro done! +10 XP 🍅"); }
    else say("Break over — back to it 💪");
  });
  const work = useTimer(45 * 60, () => { xp(20, true); say("Workout complete! +20 XP 🔥 Check it in 75 Hard"); });

  function pick(m) { setMode(m); pomo.reset(m * 60); }
  const pomoCount = S.pomoDay === todayStr() ? S.pomo : 0;

  return (
    <>
      <section>
        <h2>🍅 Pomodoro <span className="sub">{pomoCount} today</span></h2>
        <div className="modes">
          {[[25, "Focus 25"], [5, "Break 5"], [15, "Break 15"]].map(([m, l]) => (
            <button key={m} className={"modechip" + (mode === m ? " on" : "")} onClick={() => pick(m)}>{l}</button>
          ))}
        </div>
        <div className="timer">{mmss(pomo.remaining)}</div>
        <div className="tbtns">
          <button className="btn" onClick={() => pomo.toggle()}>{pomo.running ? "Pause" : "Start"}</button>
          <button className="btn sec" onClick={() => pomo.reset()}>Reset</button>
        </div>
      </section>
      <section>
        <h2>💪 75 Hard workout <span className="sub">45 min</span></h2>
        <div className="timer yellow">{mmss(work.remaining)}</div>
        <div className="tbtns">
          <button className="btn" onClick={() => work.toggle()}>{work.running ? "Pause" : "Start"}</button>
          <button className="btn sec" onClick={() => work.reset()}>Reset</button>
        </div>
      </section>
    </>
  );
}

// ================= LEARN =================
function Learn() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [q, setQ] = useState(null);
  const load = useCallback(async () => {
    setErr(null);
    try {
      const j = await (await fetch("/api/learn")).json();
      if (j.error) throw new Error(j.error);
      setData(j);
      if (j.quotes.length) setQ(j.quotes[Math.floor(Math.random() * j.quotes.length)]);
    } catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function shuffle() {
    if (data?.quotes?.length) setQ(data.quotes[Math.floor(Math.random() * data.quotes.length)]);
  }

  return (
    <>
      {err && <Err retry={load} msg={err} />}
      {!data && !err && <Skel />}
      {data && (
        <>
          <section>
            <h2>🎯 Your ONE <span className="sub">{data.one.books.length + data.one.courses.length} focused</span></h2>
            {data.one.books.map((b) => (
              <a key={b.id} className="lrow" href={b.url} target="_blank" rel="noopener noreferrer">
                <div className="lt"><b>📖 {b.title}</b><span>{b.author}</span></div><span className="badge">Book</span>
              </a>
            ))}
            {data.one.courses.map((c) => (
              <a key={c.id} className="lrow" href={c.url} target="_blank" rel="noopener noreferrer">
                <div className="lt"><b>🎧 {c.course}</b><span>{c.instructor}</span></div><span className="badge">Course</span>
              </a>
            ))}
          </section>
          {q && (
            <section>
              <h2>💬 Quotes <span className="sub">{data.quotes.length}</span></h2>
              <blockquote className="quote">&ldquo;{q.quote}&rdquo;<cite>&mdash; {q.author || "Unknown"}</cite></blockquote>
              <button className="btn sec" onClick={shuffle}>🔀 Shuffle</button>
            </section>
          )}
          <section>
            <h2>📚 Courses <span className="sub">{data.courses.filter((c) => c.status.includes("Completed")).length}/{data.courses.length} done</span></h2>
            <div className="scroll">
              {data.courses.map((c) => (
                <a key={c.id} className="lrow" href={c.url} target="_blank" rel="noopener noreferrer">
                  <div className="lt"><b>{c.course}</b><span>{c.instructor}{c.category ? " · " + c.category : ""}</span></div>
                  <span className="badge">{c.status.includes("Completed") ? "Done" : c.status.includes("progress") ? "Active" : "New"}</span>
                </a>
              ))}
            </div>
          </section>
          <section>
            <h2>📖 Library <span className="sub">{data.books.filter((b) => b.status.includes("Finished")).length}/{data.books.length} read</span></h2>
            <div className="scroll">
              {data.books.map((b) => (
                <a key={b.id} className="lrow" href={b.url} target="_blank" rel="noopener noreferrer">
                  <div className="lt"><b>{b.title}</b><span>{b.author}</span></div>
                  <span className="badge">{b.status.includes("Finished") ? "Read" : b.status.includes("Reading") ? "Now" : "To read"}</span>
                </a>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}

// ================= REFLECT =================
function Reflect({ xp, say }) {
  const [goals, setGoals] = useState(null);
  const [err, setErr] = useState(null);
  const [g1, setG1] = useState("");
  const [win, setWin] = useState("");
  const [mood, setMood] = useState("🙂 Good");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const j = await (await fetch("/api/reflect")).json();
      if (j.error) throw new Error(j.error);
      setGoals(j.goals);
    } catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function saveGrat() {
    if (!g1.trim() && !win.trim()) { say("Add a gratitude or win first 🙂"); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/reflect", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grateful: g1.trim(), win: win.trim(), mood, date: todayStr() }),
      });
      const j = await r.json();
      if (j.error) throw new Error(j.error);
      xp(10, true); say("Logged. +10 XP 🙏"); setG1(""); setWin("");
    } catch { say("Couldn't save — try again"); }
    setBusy(false);
  }

  return (
    <>
      <section>
        <h2>🙏 Gratitude &amp; Win <span className="sub">30 seconds</span></h2>
        <input value={g1} onChange={(e) => setG1(e.target.value)} placeholder="Grateful for…" />
        <textarea value={win} onChange={(e) => setWin(e.target.value)} placeholder="One win today 🏆" />
        <div className="moods">
          {["😔 Low", "😐 Okay", "🙂 Good", "🤩 Great"].map((m) => (
            <button key={m} className={"mood" + (mood === m ? " sel" : "")} onClick={() => setMood(m)}>{m.split(" ")[0]}</button>
          ))}
        </div>
        <button className="btn" disabled={busy} onClick={saveGrat}>{busy ? "Saving…" : "Save (+10 XP)"}</button>
      </section>
      <section>
        <h2>🎯 Goals <span className="sub">{goals ? goals.length + " active" : "…"}</span></h2>
        {err && <Err retry={load} msg={err} />}
        {goals?.slice(0, 8).map((g, i) => (
          <div className="goal" key={i}>
            <div className="grow"><span>{g.goal}</span><span className="sub">{g.pct}%</span></div>
            <div className="xpbar"><i style={{ width: g.pct + "%" }} /></div>
          </div>
        ))}
        {goals && !goals.length && <p className="empty">No active goals yet.</p>}
      </section>
    </>
  );
}

// ================= shared bits =================
function Err({ retry, msg }) {
  return (
    <p className="err">Couldn&rsquo;t reach Notion ({msg}). <button className="btn sec" onClick={retry}>⟳ Retry</button></p>
  );
}
function Skel() {
  return <div className="skel" />;
}
