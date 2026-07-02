import { useEffect, useRef, useState, useCallback } from "react";
import Head from "next/head";

const TITLES = ["Getting Started", "Spark", "Builder", "Momentum", "Warrior", "Relentless", "Unstoppable", "Legend"];
const TABS = [
  ["today", "⚡ Today"],
  ["h75", "🔥 75 Hard"],
  ["focus", "⏱️ Focus"],
  ["learn", "📚 Learn"],
  ["reflect", "🙏 Reflect"],
  ["content", "📣 Content"],
];

function todayStr() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function mmss(s) {
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}
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
  const [reader, setReader] = useState(null); // {id, title}
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
        {tab === "h75" && <H75 xp={xp} say={say} openPage={setReader} />}
        {tab === "focus" && <Focus xp={xp} say={say} S={S} save={save} />}
        {tab === "learn" && <Learn openPage={setReader} />}
        {tab === "reflect" && <Reflect xp={xp} say={say} />}
        {tab === "content" && <Content say={say} />}
      </main>

      <footer className="foot">
        Personal Level Up · synced with your Notion ·{" "}
        <a href="https://app.notion.com/p/390fcb70586381878204cfabca02ad93" target="_blank" rel="noopener noreferrer">Open hub ↗</a>
      </footer>
      {toast && <div className="toast show">{toast}</div>}
      {reader && <Reader id={reader.id} fallbackTitle={reader.title} close={() => setReader(null)} say={say} />}
    </div>
  );
}

// ================= READER (in-app page view + notes) =================
function Reader({ id, fallbackTitle, close, say }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const j = await (await fetch("/api/page?id=" + encodeURIComponent(id))).json();
      if (j.error) throw new Error(j.error);
      setData(j);
    } catch (e) { setErr(e.message); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function toggleTodo(b) {
    setData((d) => ({ ...d, blocks: d.blocks.map((x) => (x.id === b.id ? { ...x, checked: !b.checked } : x)) }));
    await fetch("/api/page", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ blockId: b.id, checked: !b.checked }) });
  }
  async function addNote() {
    if (!note.trim()) return;
    setBusy(true);
    try {
      const j = await (await fetch("/api/page", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pageId: id, note: note.trim() }) })).json();
      if (j.error) throw new Error(j.error);
      say("Note saved to Notion 📝"); setNote(""); load();
    } catch { say("Couldn't save note"); }
    setBusy(false);
  }

  return (
    <div className="overlay" onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <b>{data?.title || fallbackTitle || "…"}</b>
          <button className="btn sec" onClick={close}>✕</button>
        </div>
        <div className="sheet-body">
          {err && <p className="err">{err}</p>}
          {!data && !err && <div className="skel" />}
          {data?.blocks?.map((b, i) => {
            if (b.kind === "hr") return <hr key={i} />;
            if (b.kind === "h1") return <h3 key={i} className="rh1">{b.text}</h3>;
            if (b.kind === "h2") return <h4 key={i} className="rh2">{b.text}</h4>;
            if (b.kind === "h3") return <h4 key={i} className="rh3" style={{ marginLeft: b.indent ? 12 : 0 }}>{b.text}</h4>;
            if (b.kind === "li" || b.kind === "nli") return <div key={i} className="rli" style={{ marginLeft: b.indent ? 26 : 14 }}>• {b.text}</div>;
            if (b.kind === "quote" || b.kind === "callout") return <div key={i} className="rquote">{b.text}</div>;
            if (b.kind === "todo") return (
              <button key={i} className={"rtodo" + (b.checked ? " on" : "")} onClick={() => toggleTodo(b)}>
                <span className="box">✓</span>{b.text}
              </button>
            );
            return <p key={i} className="rp" style={{ marginLeft: b.indent ? 12 : 0 }}>{b.text}</p>;
          })}
          {data && !data.blocks?.length && <p className="empty">This page is empty.</p>}
        </div>
        <div className="sheet-foot">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note to this page…" />
          <button className="btn" disabled={busy} onClick={addNote}>{busy ? "…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

// ================= TODAY =================
function Today({ xp, say }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [routines, setRoutines] = useState(null);
  const [cal, setCal] = useState(undefined);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const j = await (await fetch("/api/today")).json();
      if (j.error) throw new Error(j.error);
      setData(j);
    } catch (e) { setErr(e.message); }
    try {
      const r = await (await fetch("/api/routines")).json();
      if (!r.error) setRoutines(r.routines);
    } catch {}
    try {
      const c = await (await fetch("/api/calendar")).json();
      setCal(c.events); // null = not configured
    } catch { setCal(null); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function done(id) {
    setData((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) }));
    xp(15, true); say("+15 XP 💪");
    await fetch("/api/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  }
  async function toggleRoutine(r) {
    const on = !r.done;
    const streak = on ? (r.streak || 0) + 1 : r.streak;
    setRoutines((rs) => rs.map((x) => (x.id === r.id ? { ...x, done: on, streak } : x)));
    if (on) { xp(5, false); say("+5 XP · 🔥" + streak); }
    await fetch("/api/routines", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r.id, on, streak }) });
  }

  const groups = routines
    ? [
        ["🌅 Morning — incl. Million Dollar Morning", routines.filter((r) => (r.when || "").includes("Morning"))],
        ["⚔️ Warrior Core 4", routines.filter((r) => (r.when || "").includes("Anytime"))],
        ["🌇 Evening", routines.filter((r) => (r.when || "").includes("Evening"))],
      ]
    : [];

  return (
    <>
      {err && <Err retry={load} msg={err} />}
      {!data && !err && <Skel />}
      {data?.quote && (
        <blockquote className="quote">&ldquo;{data.quote.quote}&rdquo;<cite>&mdash; {data.quote.author || "Unknown"}</cite></blockquote>
      )}
      {cal !== undefined && cal !== null && cal.length > 0 && (
        <section>
          <h2>📅 Coming up <span className="sub">next 3 days</span></h2>
          {cal.map((e, i) => (
            <div className="calrow" key={i}>
              <span className="when">{e.allDay ? "all day" : new Date(e.start).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span>
              <span className="ev">{e.summary}</span>
              <span className="sub">{dayLabel(e.start)}</span>
            </div>
          ))}
        </section>
      )}
      {cal === null && (
        <p className="empty" style={{ margin: "0 0 12px" }}>📅 Calendar not connected yet — add your Google Calendar secret iCal URL as <code>GOOGLE_CAL_ICS</code> in Vercel (see README).</p>
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
      {groups.map(([label, list]) =>
        list.length ? (
          <section key={label}>
            <h2>{label} <span className="sub">{list.filter((r) => r.done).length}/{list.length}</span></h2>
            {list.map((r) => (
              <button key={r.id} className={"hrow" + (r.done ? " on" : "")} onClick={() => toggleRoutine(r)}>
                <span className="box">✓</span>
                <span className="hn">{r.habit}</span>
                {r.streak > 0 && <span className="flame">🔥{r.streak}</span>}
              </button>
            ))}
          </section>
        ) : null
      )}
    </>
  );
}
function dayLabel(start) {
  const d = new Date(start), now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const tm = new Date(now.getTime() + 86400000);
  if (d.toDateString() === tm.toDateString()) return "Tmrw";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ================= 75 HARD =================
function H75({ xp, say, openPage }) {
  const [row, setRow] = useState(undefined);
  const [err, setErr] = useState(null);
  const [plans, setPlans] = useState(undefined);
  const [openPlan, setOpenPlan] = useState(0);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const j = await (await fetch("/api/h75?date=" + todayStr())).json();
      if (j.error) throw new Error(j.error);
      setRow(j.row);
    } catch (e) { setErr(e.message); }
    try {
      const w = await (await fetch("/api/workouts")).json();
      setPlans(w.error ? { error: w.error } : w.plans);
    } catch (e) { setPlans({ error: e.message }); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function toggle(item) {
    const on = !item.on;
    setRow((r) => ({ ...r, items: r.items.map((i) => (i.prop === item.prop ? { ...i, on } : i)) }));
    if (on) xp(4, false);
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
      <section>
        <h2>💪 Workouts <span className="sub">from your Fitness page</span></h2>
        {plans === undefined && <div className="skel" />}
        {plans?.error && <p className="empty">{plans.error}</p>}
        {Array.isArray(plans) && !plans.length && <p className="empty">No workout plans found on the Fitness page.</p>}
        {Array.isArray(plans) && plans.map((p, pi) => (
          <div key={pi}>
            <button className="planhead" onClick={() => setOpenPlan(openPlan === pi ? -1 : pi)}>
              {openPlan === pi ? "▾" : "▸"} {p.name}
            </button>
            {openPlan === pi && p.days.map((d) => (
              <button key={d.id} className="lrow full" onClick={() => openPage({ id: d.id, title: d.title })}>
                <div className="lt"><b>{d.title}</b></div><span className="badge">Open</span>
              </button>
            ))}
          </div>
        ))}
      </section>
    </>
  );
}

// ================= FOCUS =================
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
function Learn({ openPage }) {
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
  const Row = ({ id, title, subtitle, badge, notionUrl }) => (
    <div className="lrow">
      <button className="ltbtn" onClick={() => openPage({ id, title })}>
        <div className="lt"><b>{title}</b><span>{subtitle}</span></div>
      </button>
      <span className="badge">{badge}</span>
      <a className="mini" href={notionUrl} target="_blank" rel="noopener noreferrer">↗</a>
    </div>
  );

  return (
    <>
      {err && <Err retry={load} msg={err} />}
      {!data && !err && <Skel />}
      {data && (
        <>
          <section>
            <h2>🎯 Your ONE <span className="sub">{data.one.books.length + data.one.courses.length} focused</span></h2>
            {data.one.books.map((b) => <Row key={b.id} id={b.id} title={"📖 " + b.title} subtitle={b.author} badge="Book" notionUrl={b.url} />)}
            {data.one.courses.map((c) => <Row key={c.id} id={c.id} title={"🎧 " + c.course} subtitle={c.instructor} badge="Course" notionUrl={c.url} />)}
            <p className="empty" style={{ marginTop: 6 }}>Tap a title to read it here · ↗ opens Notion</p>
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
                <Row key={c.id} id={c.id} title={c.course} subtitle={(c.instructor || "") + (c.category ? " · " + c.category : "")}
                  badge={c.status.includes("Completed") ? "Done" : c.status.includes("progress") ? "Active" : "New"} notionUrl={c.url} />
              ))}
            </div>
          </section>
          <section>
            <h2>📖 Library <span className="sub">{data.books.filter((b) => b.status.includes("Finished")).length}/{data.books.length} read</span></h2>
            <p className="empty" style={{ margin: "0 0 8px" }}>Tap a book → its summary, lessons &amp; quiz open right here.</p>
            <div className="scroll">
              {data.books.map((b) => (
                <Row key={b.id} id={b.id} title={b.title} subtitle={b.author}
                  badge={b.status.includes("Finished") ? "Read" : b.status.includes("Reading") ? "Now" : "To read"} notionUrl={b.url} />
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
      <EnergyLog xp={xp} say={say} />
      <Stats />
      <Money say={say} />
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

// ================= ENERGY & SLEEP =================
function EnergyLog({ xp, say }) {
  const [sleep, setSleep] = useState("");
  const [energy, setEnergy] = useState(7);
  const [mood, setMood] = useState("🙂 Good");
  const [worked, setWorked] = useState(false);
  const [busy, setBusy] = useState(false);

  async function log() {
    setBusy(true);
    try {
      const j = await (await fetch("/api/energy", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sleep: sleep === "" ? undefined : Number(sleep), energy, mood, workedOut: worked, date: todayStr() }),
      })).json();
      if (j.error) throw new Error(j.error);
      xp(5, false); say("Energy logged. +5 XP 🔋"); setSleep("");
    } catch { say("Couldn't log — try again"); }
    setBusy(false);
  }

  return (
    <section>
      <h2>🔋 Energy &amp; Sleep <span className="sub">20 seconds</span></h2>
      <div className="erow">
        <label>😴 Sleep (hrs)</label>
        <input className="enum" type="number" step="0.5" min="0" max="14" value={sleep} onChange={(e) => setSleep(e.target.value)} placeholder="7.5" />
      </div>
      <div className="erow">
        <label>⚡ Energy: <b>{energy}</b>/10</label>
        <input className="eslide" type="range" min="1" max="10" value={energy} onChange={(e) => setEnergy(Number(e.target.value))} />
      </div>
      <div className="moods">
        {["😫 Drained", "😔 Low", "😐 Okay", "🙂 Good", "🤩 Great"].map((m) => (
          <button key={m} className={"mood" + (mood === m ? " sel" : "")} onClick={() => setMood(m)}>{m.split(" ")[0]}</button>
        ))}
      </div>
      <button className={"h75item" + (worked ? " on" : "")} style={{ width: "100%", marginBottom: 10 }} onClick={() => setWorked(!worked)}>
        <span className="box">✓</span>Worked out today
      </button>
      <button className="btn" disabled={busy} onClick={log}>{busy ? "Saving…" : "Log today (+5 XP)"}</button>
    </section>
  );
}

// ================= MONEY =================
function Money({ say }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [editing, setEditing] = useState(null); // id
  const [val, setVal] = useState("");

  const load = useCallback(async () => {
    setErr(null);
    try {
      const j = await (await fetch("/api/money")).json();
      if (j.error) throw new Error(j.error);
      setData(j);
    } catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const fmt = (n) => "$" + Math.round(n).toLocaleString();

  async function saveVal(item) {
    const v = Number(val);
    if (isNaN(v)) { setEditing(null); return; }
    setEditing(null);
    setData((d) => {
      const items = d.items.map((x) => (x.id === item.id ? { ...x, value: v } : x));
      const assets = items.filter((i) => i.type.includes("Asset")).reduce((s, i) => s + i.value, 0);
      const liabilities = items.filter((i) => i.type.includes("Liability")).reduce((s, i) => s + i.value, 0);
      return { items, assets, liabilities, net: assets - liabilities };
    });
    say("Updated 💰");
    await fetch("/api/money", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, value: v }) });
  }

  return (
    <section>
      <h2>💰 Money <span className="sub">net worth</span></h2>
      {err && <p className="empty">{err}</p>}
      {!data && !err && <div className="skel" />}
      {data && (
        <>
          <div className="networth">
            <div><span className="sub">Net worth</span><b className={data.net >= 0 ? "pos" : "neg"}>{fmt(data.net)}</b></div>
            <div><span className="sub">Assets</span><b className="pos">{fmt(data.assets)}</b></div>
            <div><span className="sub">Debts</span><b className="neg">{fmt(data.liabilities)}</b></div>
          </div>
          {data.items.map((i) => (
            <div className="mrow" key={i.id}>
              <span className="mi">{i.type.includes("Asset") ? "🟢" : "🔴"} {i.item}</span>
              {editing === i.id ? (
                <span className="medit">
                  <input className="enum" type="number" autoFocus value={val} onChange={(e) => setVal(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveVal(i)} />
                  <button className="btn sec" onClick={() => saveVal(i)}>✓</button>
                </span>
              ) : (
                <button className="mval" onClick={() => { setEditing(i.id); setVal(String(i.value || "")); }}>{fmt(i.value)}</button>
              )}
            </div>
          ))}
          <p className="empty" style={{ marginTop: 6 }}>Tap a value to update it.</p>
        </>
      )}
    </section>
  );
}

// ================= STATS (14-day trends) =================
function Stats() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const load = useCallback(async () => {
    setErr(null);
    try {
      const j = await (await fetch("/api/stats")).json();
      if (j.error) throw new Error(j.error);
      setData(j);
    } catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const hasEnergy = data?.energy?.length > 0;
  const hasH75 = data?.h75?.length > 0;
  return (
    <section>
      <h2>📊 Last 14 days <span className="sub">trends</span></h2>
      {err && <p className="empty">{err}</p>}
      {!data && !err && <div className="skel" />}
      {data && !hasEnergy && !hasH75 && <p className="empty">Log Energy &amp; Sleep and check off 75 Hard days — your charts grow here.</p>}
      {hasEnergy && (
        <>
          <div className="chartlbl">⚡ Energy (1–10) &amp; 😴 sleep hrs</div>
          <div className="chart">
            {data.energy.map((d, i) => (
              <div className="cbarwrap" key={i} title={d.day + " · sleep " + d.sleep + "h · energy " + d.energy}>
                <div className="cbar sleepb" style={{ height: Math.min(100, (d.sleep / 10) * 100) + "%" }} />
                <div className="cbar energyb" style={{ height: (d.energy / 10) * 100 + "%" }} />
                <span className="cday">{(d.date || "").slice(8)}</span>
              </div>
            ))}
          </div>
        </>
      )}
      {hasH75 && (
        <>
          <div className="chartlbl">🔥 75 Hard — items done per day (7 = perfect)</div>
          <div className="chart">
            {data.h75.map((d, i) => (
              <div className="cbarwrap" key={i} title={d.day + " · " + d.done + "/7"}>
                <div className={"cbar " + (d.done === 7 ? "perfb" : "h75b")} style={{ height: (d.done / 7) * 100 + "%" }} />
                <span className="cday">{(d.date || "").slice(8)}</span>
              </div>
            ))}
          </div>
          <p className="empty">{data.h75.filter((d) => d.done === 7).length} perfect day{data.h75.filter((d) => d.done === 7).length === 1 ? "" : "s"} in this window.</p>
        </>
      )}
    </section>
  );
}

// ================= CONTENT ENGINE =================
function Content({ say }) {
  const [posts, setPosts] = useState(null);
  const [err, setErr] = useState(null);
  const [open, setOpen] = useState(null); // id
  const load = useCallback(async () => {
    setErr(null);
    try {
      const j = await (await fetch("/api/content")).json();
      if (j.error) throw new Error(j.error);
      setPosts(j.posts);
    } catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function setStatus(p, status) {
    setPosts((ps) => ps.map((x) => (x.id === p.id ? { ...x, status } : x)));
    say(status === "✅ Posted" ? "Marked posted ✅" : "Scheduled 📅");
    await fetch("/api/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id, status }) });
  }
  async function copy(p) {
    const full = p.caption + (p.hashtags ? "\n\n" + p.hashtags : "");
    try { await navigator.clipboard.writeText(full); say("Copied — go post it 🚀"); }
    catch { say("Couldn't copy"); }
  }

  const pending = posts?.filter((p) => p.status === "💡 Idea" || p.status === "✍️ Drafted") || [];
  const done = posts?.filter((p) => p.status === "📅 Scheduled" || p.status === "✅ Posted") || [];

  return (
    <>
      <section>
        <h2>📣 Ready to post <span className="sub">{pending.length} waiting</span></h2>
        {err && <p className="err">{err}</p>}
        {!posts && !err && <div className="skel" />}
        {posts && !pending.length && <p className="empty">Nothing waiting — new captions arrive every Monday morning. ✍️</p>}
        {pending.map((p) => (
          <div className="post" key={p.id}>
            <button className="posthead" onClick={() => setOpen(open === p.id ? null : p.id)}>
              <b>{p.hook}</b>
              <span className="sub">{p.platforms.join(" · ") || p.source}</span>
            </button>
            {open === p.id && (
              <div className="postbody">
                <p className="rp">{p.caption}</p>
                {p.hashtags && <p className="tags">{p.hashtags}</p>}
                <div className="tbtns" style={{ justifyContent: "flex-start" }}>
                  <button className="btn" onClick={() => copy(p)}>📋 Copy</button>
                  <button className="btn sec" onClick={() => setStatus(p, "📅 Scheduled")}>📅 Scheduled</button>
                  <button className="btn sec" onClick={() => setStatus(p, "✅ Posted")}>✅ Posted</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </section>
      {done.length > 0 && (
        <section>
          <h2>✅ Handled <span className="sub">{done.length}</span></h2>
          {done.slice(0, 10).map((p) => (
            <div className="mrow" key={p.id}><span className="mi">{p.hook}</span><span className="sub">{p.status}</span></div>
          ))}
        </section>
      )}
    </>
  );
}

function Err({ retry, msg }) {
  return <p className="err">Couldn&rsquo;t reach Notion ({msg}). <button className="btn sec" onClick={retry}>⟳ Retry</button></p>;
}
function Skel() { return <div className="skel" />; }
