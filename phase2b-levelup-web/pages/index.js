import { useEffect, useRef, useState, useCallback } from "react";
import Head from "next/head";

const VERSION = "v6.5";
// tiny haptics — no-op where unsupported (iOS Safari)
function buzz(pattern) { try { navigator.vibrate && navigator.vibrate(pattern); } catch {} }
const MDM_PAGE = "160fcb70586380d7afcbefb75870943e"; // 🌅 Million Dollar Morning (Brad Lea)
const WUW_PAGE = "160fcb705863804c9815cf77fccca91f"; // ⚔️ Wake Up Warrior
const MILA_GUIDE = "391fcb70586381609bf8ecaf23378d9d"; // 🐶 Mila — Best Life Guide
const TITLES = ["Getting Started", "Spark", "Builder", "Momentum", "Warrior", "Relentless", "Unstoppable", "Legend"];
const TABS = [
  ["today", "⚡ Today"],
  ["h75", "🔥 75 Hard"],
  ["focus", "⏱️ Focus"],
  ["learn", "📚 Learn"],
  ["reflect", "🙏 Reflect"],
  ["journal", "📝 Journal"],
];

function todayStr() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function mmss(s) {
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}
// instant-load cache: render last known data immediately, refresh in background
function lsGet(k) {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem("c:" + k)); } catch { return null; }
}
function lsSet(k, v) {
  try { localStorage.setItem("c:" + k, JSON.stringify(v)); } catch {}
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
    buzz(15);
    setToast(m);
    clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(""), 2000);
  }, []);

  // pull-to-refresh: drag down from the top → instant reload (cache paints immediately)
  useEffect(() => {
    let startY = 0, pulling = false;
    const down = (e) => { if (window.scrollY <= 0) { startY = e.touches[0].clientY; pulling = true; } };
    const move = (e) => {
      if (!pulling) return;
      const dy = e.touches[0].clientY - startY;
      if (dy > 90) { pulling = false; buzz(20); window.location.reload(); }
    };
    const up = () => { pulling = false; };
    window.addEventListener("touchstart", down, { passive: true });
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("touchend", up, { passive: true });
    return () => { window.removeEventListener("touchstart", down); window.removeEventListener("touchmove", move); window.removeEventListener("touchend", up); };
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
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#050507" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-180.png" />
        <link rel="icon" href="/icon-180.png" />
      </Head>

      <header className="hero">
        <div className="date">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</div>
        <div className="hello">Let&rsquo;s go, Michael</div>
        <div className="bignum">🔥 {S.streak}<span className="bignum-l">day streak</span></div>
        <div className="pills">
          <span className="pill">Lv {lv} · {TITLES[Math.min(lv - 1, TITLES.length - 1)]}</span>
          <span className="pill">⚡ {into}/100 XP</span>
          <span className="pill">🏆 {S.wins} wins</span>
        </div>
        <div className="xpbar" style={{ marginTop: 10 }}><i style={{ width: into + "%" }} /></div>
        <nav className="tabs">
          {TABS.map(([k, label]) => (
            <button key={k} className={"tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>{label}</button>
          ))}
        </nav>
      </header>

      <main key={tab}>
        {tab === "today" && <Today xp={xp} say={say} openPage={setReader} />}
        {tab === "h75" && <><WorkoutTimer xp={xp} say={say} /><QuoteRotator match="Frisella" label="🗣️ Frisella fuel" /><H75 xp={xp} say={say} openPage={setReader} /></>}
        {tab === "focus" && <Focus xp={xp} say={say} S={S} save={save} />}
        {tab === "learn" && <Learn openPage={setReader} />}
        {tab === "reflect" && <Reflect xp={xp} say={say} />}
        {tab === "journal" && <Journal xp={xp} say={say} />}
      </main>

      <footer className="foot">
        Personal Level Up {VERSION} · synced with your Notion ·{" "}
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
            if (b.kind === "video") {
              const yt = ytEmbed(b.url);
              if (yt) return <iframe key={i} className="rvideo" src={yt} allow="fullscreen; encrypted-media" allowFullScreen title={"video-" + i} />;
              if (/\.(mp4|mov|m4v|webm)(\?|$)/i.test(b.url)) return <video key={i} className="rvideo" src={b.url} controls playsInline preload="metadata" />;
              return <a key={i} className="rlink" href={b.url} target="_blank" rel="noopener noreferrer">▶ Open video ↗</a>;
            }
            if (b.kind === "link") return <a key={i} className="rlink" href={b.url} target="_blank" rel="noopener noreferrer">🔗 {b.text}</a>;
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

// ================= QUOTE ROTATOR =================
function QuoteRotator({ match, label }) {
  const [list, setList] = useState([]);
  const [i, setI] = useState(0);
  useEffect(() => {
    let alive = true;
    const c = lsGet("q:" + match);
    if (c?.length) { setList(c); setI(Math.floor(Math.random() * c.length)); }
    (async () => {
      try {
        const j = await (await fetch("/api/quotes?m=" + encodeURIComponent(match))).json();
        if (alive && j.quotes?.length) {
          setList(j.quotes); lsSet("q:" + match, j.quotes);
          if (!c?.length) setI(Math.floor(Math.random() * j.quotes.length));
        }
      } catch {}
    })();
    return () => { alive = false; };
  }, [match]);
  useEffect(() => {
    if (list.length < 2) return;
    const iv = setInterval(() => setI((x) => (x + 1) % list.length), 25000);
    return () => clearInterval(iv);
  }, [list]);
  if (!list.length) return null;
  const q = list[i % list.length];
  return (
    <blockquote className="quote" onClick={() => setI((x) => (x + 1) % list.length)} style={{ cursor: "pointer" }} title="Tap for another">
      &ldquo;{q.quote}&rdquo;<cite>&mdash; {q.author || "Unknown"} · {label}</cite>
    </blockquote>
  );
}

// ================= TODAY =================
function Today({ xp, say, openPage }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [routines, setRoutines] = useState(null);
  const [cal, setCal] = useState(undefined);

  const load = useCallback(async () => {
    setErr(null);
    const cd = lsGet("today"), cr = lsGet("routines"), cc = lsGet("cal");
    if (cd) setData(cd);
    if (cr) setRoutines(cr);
    if (cc !== null && cc !== undefined) setCal(cc);
    try {
      const j = await (await fetch("/api/today")).json();
      if (j.error) throw new Error(j.error);
      setData(j); lsSet("today", j);
    } catch (e) { if (!cd) setErr(e.message); }
    try {
      const r = await (await fetch("/api/routines")).json();
      if (!r.error) { setRoutines(r.routines); lsSet("routines", r.routines); }
    } catch {}
    try {
      const c = await (await fetch("/api/calendar")).json();
      setCal(c.events); lsSet("cal", c.events); // null = not configured
    } catch { if (cc === undefined) setCal(null); }
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
      <NotifyCard say={say} />
      {cal !== undefined && cal !== null && (
        <section>
          <h2>📅 Coming up <span className="sub">next 3 days</span></h2>
          {cal.map((e, i) => (
            <div className="calrow" key={i}>
              <span className="when">{e.allDay ? "all day" : new Date(e.start).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span>
              <span className="ev">{e.summary}</span>
              <span className="sub">{dayLabel(e.start)}</span>
            </div>
          ))}
          {!cal.length && <p className="empty">Nothing on the calendar. 🎉</p>}
          <AddEvent />
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
          <AddTask say={say} onAdded={(t) => setData((d) => ({ ...d, tasks: [...d.tasks, t] }))} />
        </section>
      )}
      {groups.map(([label, list]) =>
        list.length ? (
          <section key={label}>
            <h2>{label} <span className="sub">{list.filter((r) => r.done).length}/{list.length}</span></h2>
            {label.includes("Million") && (
              <button className="storylink" onClick={() => openPage({ id: MDM_PAGE, title: "🌅 Million Dollar Morning — Brad Lea" })}>
                📖 The full Million Dollar Morning story — tap to read
              </button>
            )}
            {label.includes("Core 4") && (
              <button className="storylink" onClick={() => openPage({ id: WUW_PAGE, title: "⚔️ Wake Up Warrior — what Core 4 means" })}>
                📖 What is Core 4? The Wake Up Warrior story — tap to read
              </button>
            )}
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
      <Mila xp={xp} say={say} openPage={openPage} />
      <Coach />
    </>
  );
}

// ================= AI COACH =================
function Coach() {
  const [msgs, setMsgs] = useState(() => lsGet("coach") || []);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...msgs, { role: "user", content: text }].slice(-12);
    setMsgs(next); setInput(""); setBusy(true);
    try {
      const j = await (await fetch("/api/coach", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      })).json();
      const full = [...next, { role: "assistant", content: j.error ? "⚠️ " + j.error : j.reply }].slice(-12);
      setMsgs(full); lsSet("coach", full);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "⚠️ Couldn't reach the coach — try again." }]);
    }
    setBusy(false);
  }
  return (
    <section>
      <h2>🥊 Coach <span className="sub">knows your numbers</span></h2>
      {!msgs.length && <p className="empty">Straight talk on demand. Try: &ldquo;I don&rsquo;t feel like working out today.&rdquo;</p>}
      <div className="chat">
        {msgs.slice(-6).map((m, i) => (
          <div key={i} className={"bubble " + (m.role === "user" ? "me" : "them")}>{m.content}</div>
        ))}
        {busy && <div className="bubble them">…</div>}
      </div>
      <div className="addtask">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Talk to your coach…"
          onKeyDown={(e) => e.key === "Enter" && send()} />
        <button className="btn" disabled={busy} onClick={send}>Send</button>
      </div>
    </section>
  );
}

function AddTask({ say, onAdded }) {
  const [t, setT] = useState("");
  const [busy, setBusy] = useState(false);
  async function add(status) {
    if (!t.trim() || busy) return;
    setBusy(true);
    try {
      const j = await (await fetch("/api/today", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t.trim(), status }),
      })).json();
      if (j.error) throw new Error(j.error);
      say(status === "🧠 Brain Dump" ? "Dumped 🧠 — it's in Notion" : "Added to Today 🔥");
      if (status !== "🧠 Brain Dump") onAdded({ id: j.id, title: t.trim(), step: "", priority: "", energy: "" });
      setT("");
    } catch { say("Couldn't add — try again"); }
    setBusy(false);
  }
  return (
    <div className="addtask">
      <input value={t} onChange={(e) => setT(e.target.value)} placeholder="Add a task… (syncs to Notion)"
        onKeyDown={(e) => e.key === "Enter" && add("🔥 Today")} />
      <button className="btn" disabled={busy} onClick={() => add("🔥 Today")}>🔥 Today</button>
      <button className="btn sec" disabled={busy} onClick={() => add("🧠 Brain Dump")}>🧠 Dump</button>
    </div>
  );
}

// ================= MILA 🐶 =================
function Mila({ xp, say, openPage }) {
  const [items, setItems] = useState(null);
  const load = useCallback(async () => {
    const c = lsGet("mila");
    if (c) setItems(c);
    try {
      const j = await (await fetch("/api/mila")).json();
      if (!j.error) { setItems(j.items); lsSet("mila", j.items); }
    } catch {}
  }, []);
  useEffect(() => { load(); }, [load]);

  function daysSince(last) {
    if (!last) return Infinity;
    return Math.floor((new Date(todayStr()) - new Date(last)) / 86400000);
  }
  function isDue(it) {
    const d = daysSince(it.last);
    if (it.freq.includes("Daily")) return d >= 1;
    if (it.freq.includes("Weekly")) return d >= 7;
    return d >= 30;
  }
  async function doneIt(it) {
    setItems((xs) => xs.map((x) => (x.id === it.id ? { ...x, last: todayStr() } : x)));
    xp(3, false); say("Mila loved that 🐶 +3 XP");
    await fetch("/api/mila", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: it.id, date: todayStr() }) });
  }
  if (!items) return null;
  const order = ["☀️ Daily", "📅 Weekly", "🌙 Monthly"];
  const due = items.filter(isDue).length;
  return (
    <section>
      <h2>🐶 Mila <span className="sub">{due ? due + " due" : "all caught up 🎉"}</span></h2>
      <button className="storylink" onClick={() => openPage({ id: MILA_GUIDE, title: "🐶 Mila — Best Life Guide" })}>
        📖 Her Best Life guide — breed care, food rules, back safety
      </button>
      {order.map((f) => {
        const group = items.filter((i) => i.freq === f);
        if (!group.length) return null;
        return (
          <div key={f}>
            <div className="chartlbl">{f}</div>
            {group.map((it) => {
              const d = daysSince(it.last);
              const due = isDue(it);
              return (
                <button key={it.id} className={"hrow" + (due ? " duerow" : " on")} onClick={() => doneIt(it)} title={it.notes || ""}>
                  <span className="box">✓</span>
                  <span className="hn">{it.care}</span>
                  <span className="sub">{it.last ? (d === 0 ? "today" : d + "d ago") : "never"}</span>
                </button>
              );
            })}
          </div>
        );
      })}
    </section>
  );
}
function NotifyCard({ say }) {
  const [state, setState] = useState("idle"); // idle | unsupported | on | busy
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setState("unsupported"); return;
    }
    if (lsGet("push-on")) setState("on");
  }, []);
  async function enable() {
    setState("busy");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setState("idle"); say("Notifications blocked — check browser settings"); return; }
      const { publicKey } = await (await fetch("/api/push-sub")).json();
      if (!publicKey) throw new Error("server missing VAPID key");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64(publicKey),
      });
      const j = await (await fetch("/api/push-sub", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sub: sub.toJSON() }),
      })).json();
      if (j.error) throw new Error(j.error);
      lsSet("push-on", true); setState("on"); say("Daily quote incoming every morning 🔔");
    } catch (e) { setState("idle"); say("Couldn't enable: " + e.message); }
  }
  if (state === "unsupported" || state === "on") return null;
  return (
    <p className="empty" style={{ margin: "0 0 12px" }}>
      🔔 Want a quote from your library every morning?{" "}
      <button className="btn sec" disabled={state === "busy"} onClick={enable}>
        {state === "busy" ? "Enabling…" : "Turn on notifications"}
      </button>
    </p>
  );
}
function urlB64(base64) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const b = (base64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function AddEvent() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState("09:00");

  function go() {
    if (!title.trim()) return;
    const d = date.replace(/-/g, "");
    const t = time.replace(":", "") + "00";
    const end = String(Number(time.slice(0, 2)) + 1).padStart(2, "0") + time.slice(3) + "00";
    const url =
      "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" +
      encodeURIComponent(title.trim()) +
      "&dates=" + d + "T" + t + "/" + d + "T" + end;
    window.open(url, "_blank", "noopener");
    setOpen(false); setTitle("");
  }

  if (!open) return <button className="btn sec" style={{ marginTop: 8 }} onClick={() => setOpen(true)}>＋ Add event</button>;
  return (
    <div className="addev">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title…" autoFocus />
      <div className="erow">
        <input className="enum" style={{ width: 150 }} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input className="enum" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      <div className="tbtns" style={{ justifyContent: "flex-start" }}>
        <button className="btn" onClick={go}>Open in Google Calendar</button>
        <button className="btn sec" onClick={() => setOpen(false)}>Cancel</button>
      </div>
      <p className="empty">Opens pre-filled — one tap to save. It&rsquo;ll show here on the next refresh.</p>
    </div>
  );
}
function ytEmbed(url) {
  const m = String(url || "").match(/(?:youtube\.com\/(?:watch\?.*v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
  if (m) return "https://www.youtube.com/embed/" + m[1];
  const v = String(url || "").match(/vimeo\.com\/(\d+)/);
  if (v) return "https://player.vimeo.com/video/" + v[1];
  return null;
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
  const [totals, setTotals] = useState(null);
  const [err, setErr] = useState(null);
  const [plans, setPlans] = useState(undefined);
  const [openPlan, setOpenPlan] = useState(0);

  const load = useCallback(async () => {
    setErr(null);
    const ch = lsGet("h75:" + todayStr()), cp = lsGet("plans");
    if (ch) { setRow(ch.row); setTotals(ch.totals || null); }
    if (cp) setPlans(cp);
    try {
      const j = await (await fetch("/api/h75?date=" + todayStr())).json();
      if (j.error) throw new Error(j.error);
      setRow(j.row);
      setTotals(j.totals || null);
      lsSet("h75:" + todayStr(), j);
    } catch (e) { if (!ch) setErr(e.message); }
    try {
      const w = await (await fetch("/api/workouts")).json();
      if (!w.error) { setPlans(w.plans); lsSet("plans", w.plans); }
      else if (!cp) setPlans({ error: w.error });
    } catch (e) { if (!cp) setPlans({ error: e.message }); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const h = () => load();
    window.addEventListener("h75-refresh", h);
    return () => window.removeEventListener("h75-refresh", h);
  }, [load]);

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
          <h2>Day {totals?.attemptDay ?? "?"} of 75 <span className="sub">{done}/7{totals?.resets ? " · restart #" + totals.resets : ""}</span></h2>
          {totals?.resets > 0 && totals?.attemptDay <= 3 && (
            <p className="milestone" style={{ background: "rgba(30,99,214,0.12)", color: "var(--blue2)" }}>
              💪 Missed a day → back to Day 1. That's the deal you made. Slate's clean — attack this attempt.
            </p>
          )}
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
      {totals && (
        <section>
          <h2>🏆 Challenge progress <span className="sub">day {totals.attemptDay ?? totals.elapsed} of {totals.total}{totals.resets ? " · " + totals.resets + " restart" + (totals.resets > 1 ? "s" : "") : ""}</span></h2>
          {[75, 50, 25].filter((m) => totals.current >= m).slice(0, 1).map((m) => (
            <p key={m} className="milestone">🎉 Day {m} milestone — {m === 75 ? "YOU FINISHED. Unbreakable." : m === 50 ? "two-thirds territory. Relentless." : "quarter mark. Momentum is real."}</p>
          ))}
          <div className="networth">
            <div><span className="sub">Streak</span><b style={{ color: "var(--yellow)" }}>🔥 {totals.current || 0}</b></div>
            <div><span className="sub">Longest</span><b>{totals.longest || 0}</b></div>
            <div><span className="sub">Perfect</span><b className="pos">{totals.perfect}</b></div>
            <div><span className="sub">To go</span><b className="neg">{Math.max(0, totals.total - (totals.attemptDay ?? totals.elapsed))}</b></div>
          </div>
          <div className="xpbar" style={{ marginTop: 10 }}><i style={{ width: Math.min(100, (totals.perfect / totals.total) * 100) + "%" }} /></div>
          <p className="empty" style={{ marginTop: 6 }}>{totals.perfect} of {totals.total} perfect days banked · <a href="/share" target="_blank" rel="noopener noreferrer" style={{ color: "var(--mut)" }}>public scoreboard ↗</a></p>
        </section>
      )}
      <button className="storylink" onClick={() => openPage({ id: "390fcb70586381b6a7e2d709a48d0ec9", title: "🔥 75 Hard — Support Pack" })}>
        📖 Support Pack — workout ideas, water plan, reading shelf
      </button>
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

function WorkoutTimer({ xp, say }) {
  const work = useTimer(45 * 60, async () => {
    xp(20, true);
    // auto-check "Workout 1" on today's 75 Hard row
    try {
      const j = await (await fetch("/api/h75?date=" + todayStr())).json();
      const w1 = j.row?.items?.find((i) => i.prop === "💪 Workout 1");
      if (j.row && w1 && !w1.on) {
        await fetch("/api/h75", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: j.row.id, prop: "💪 Workout 1", on: true }) });
        say("Workout done — checked off ✓ +20 XP 🔥");
        window.dispatchEvent(new Event("h75-refresh"));
        return;
      }
    } catch {}
    say("Workout complete! +20 XP 🔥");
  });
  return (
    <section>
      <h2>⏱️ 45-min workout timer <span className="sub">counts toward today</span></h2>
      <div className="timer yellow">{mmss(work.remaining)}</div>
      <div className="tbtns">
        <button className="btn" onClick={() => work.toggle()}>{work.running ? "Pause" : "Start"}</button>
        <button className="btn sec" onClick={() => work.reset()}>Reset</button>
      </div>
    </section>
  );
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
      <QuoteRotator match="Grover,Kobe,Jordan,Ali,Lombardi,Goggins" label="🏆 Focus fuel" />
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
function initials(s) {
  return String(s || "?").split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
function hueOf(s) {
  let h = 0;
  for (const c of String(s || "")) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}
function Cover({ title, author }) {
  const [err, setErr] = useState(false);
  if (err) return <Avatar name={title} />;
  return (
    <img className="thumb" loading="lazy" alt=""
      src={"/api/cover?t=" + encodeURIComponent(title) + "&a=" + encodeURIComponent(author || "")}
      onError={() => setErr(true)} />
  );
}
function Avatar({ name }) {
  return (
    <div className="thumb fall" style={{ background: `linear-gradient(135deg, hsl(${hueOf(name)},55%,32%), hsl(${(hueOf(name) + 40) % 360},55%,20%))` }}>
      {initials(name)}
    </div>
  );
}

function Learn({ openPage }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [q, setQ] = useState(null);
  const [search, setSearch] = useState("");
  const [bf, setBf] = useState("All");
  const [cf, setCf] = useState("All");
  const load = useCallback(async () => {
    setErr(null);
    const c = lsGet("learn");
    if (c) { setData(c); if (c.quotes?.length) setQ(c.quotes[Math.floor(Math.random() * c.quotes.length)]); }
    try {
      const j = await (await fetch("/api/learn")).json();
      if (j.error) throw new Error(j.error);
      setData(j); lsSet("learn", j);
      if (!c && j.quotes.length) setQ(j.quotes[Math.floor(Math.random() * j.quotes.length)]);
    } catch (e) { if (!c) setErr(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function shuffle() {
    if (data?.quotes?.length) setQ(data.quotes[Math.floor(Math.random() * data.quotes.length)]);
  }
  const s = search.trim().toLowerCase();
  const bookStatus = (b) => (b.status.includes("Finished") ? "Read" : b.status.includes("Reading") ? "Now" : "To read");
  const courseStatus = (c) => (c.status.includes("Completed") ? "Done" : c.status.includes("progress") ? "Active" : "New");
  const books = (data?.books || [])
    .filter((b) => !s || (b.title + " " + b.author).toLowerCase().includes(s))
    .filter((b) => bf === "All" || bookStatus(b) === bf);
  const courses = (data?.courses || [])
    .filter((c) => !s || (c.course + " " + c.instructor + " " + c.category).toLowerCase().includes(s))
    .filter((c) => cf === "All" || courseStatus(c) === cf);

  const Row = ({ id, title, subtitle, badge, notionUrl, thumb }) => (
    <div className="lrow">
      {thumb}
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
          <div className="searchwrap">
            <input className="search" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Search your books & courses…" />
            {search && <button className="btn sec clearbtn" onClick={() => setSearch("")}>✕</button>}
          </div>
          <section>
            <h2>🎯 Your ONE <span className="sub">{data.one.books.length + data.one.courses.length} focused</span></h2>
            {data.one.books.map((b) => <Row key={b.id} id={b.id} title={b.title} subtitle={b.author} badge="Book" notionUrl={b.url} thumb={<Cover title={b.title} author={b.author} />} />)}
            {data.one.courses.map((c) => <Row key={c.id} id={c.id} title={c.course} subtitle={c.instructor} badge="Course" notionUrl={c.url} thumb={<Avatar name={c.instructor || c.course} />} />)}
            <p className="empty" style={{ marginTop: 6 }}>Tap a title to read it here · ↗ opens Notion</p>
          </section>
          {q && !s && (
            <section>
              <h2>💬 Quotes <span className="sub">{data.quotes.length}</span></h2>
              <blockquote className="quote">&ldquo;{q.quote}&rdquo;<cite>&mdash; {q.author || "Unknown"}</cite></blockquote>
              <button className="btn sec" onClick={shuffle}>🔀 Shuffle</button>
            </section>
          )}
          <section>
            <h2>📚 Courses <span className="sub">{courses.length} shown</span></h2>
            <div className="modes">
              {["All", "Active", "New", "Done"].map((f) => (
                <button key={f} className={"modechip" + (cf === f ? " on" : "")} onClick={() => setCf(f)}>{f}</button>
              ))}
            </div>
            <div className="scroll">
              {courses.map((c) => (
                <Row key={c.id} id={c.id} title={c.course} subtitle={(c.instructor || "") + (c.category ? " · " + c.category : "")}
                  badge={courseStatus(c)} notionUrl={c.url} thumb={<Avatar name={c.instructor || c.course} />} />
              ))}
              {!courses.length && <p className="empty">No courses match.</p>}
            </div>
          </section>
          <section>
            <h2>📖 Library <span className="sub">{books.length} shown</span></h2>
            <div className="modes">
              {["All", "Now", "To read", "Read"].map((f) => (
                <button key={f} className={"modechip" + (bf === f ? " on" : "")} onClick={() => setBf(f)}>{f}</button>
              ))}
            </div>
            <div className="scroll">
              {books.map((b) => (
                <Row key={b.id} id={b.id} title={b.title} subtitle={b.author}
                  badge={bookStatus(b)} notionUrl={b.url} thumb={<Cover title={b.title} author={b.author} />} />
              ))}
              {!books.length && <p className="empty">No books match.</p>}
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
  const [editGoal, setEditGoal] = useState(null);
  const [gpct, setGpct] = useState(0);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const j = await (await fetch("/api/reflect")).json();
      if (j.error) throw new Error(j.error);
      setGoals(j.goals);
    } catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <>
      <EnergyLog xp={xp} say={say} />
      <Stats />
      <Money say={say} />
      <section>
        <h2>🎯 Goals <span className="sub">{goals ? goals.length + " active" : "…"}</span></h2>
        {err && <Err retry={load} msg={err} />}
        {goals?.slice(0, 8).map((g) => (
          <div className="goal" key={g.id}>
            <div className="grow">
              <span>{g.goal}</span>
              {editGoal === g.id ? null : (
                <button className="mval" style={{ padding: "2px 8px", fontSize: "0.78rem" }}
                  onClick={() => { setEditGoal(g.id); setGpct(g.pct); }}>{g.pct}%</button>
              )}
            </div>
            {editGoal === g.id ? (
              <div className="erow" style={{ marginTop: 4 }}>
                <input className="eslide" type="range" min="0" max="100" step="5" value={gpct} onChange={(e) => setGpct(Number(e.target.value))} />
                <b style={{ minWidth: 42 }}>{gpct}%</b>
                <button className="btn sec" onClick={async () => {
                  setEditGoal(null);
                  setGoals((gs) => gs.map((x) => (x.id === g.id ? { ...x, pct: gpct } : x)));
                  if (gpct > g.pct) { xp(5, gpct === 100); say(gpct === 100 ? "GOAL ACHIEVED 🏆 +5 XP" : "Progress logged 🎯 +5 XP"); }
                  await fetch("/api/reflect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ goalId: g.id, pct: gpct }) });
                }}>✓</button>
              </div>
            ) : (
              <div className="xpbar"><i style={{ width: g.pct + "%" }} /></div>
            )}
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
  const [weight, setWeight] = useState("");
  const [energy, setEnergy] = useState(7);
  const [mood, setMood] = useState("🙂 Good");
  const [worked, setWorked] = useState(false);
  const [busy, setBusy] = useState(false);

  async function log() {
    setBusy(true);
    try {
      const j = await (await fetch("/api/energy", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sleep: sleep === "" ? undefined : Number(sleep), weight: weight === "" ? undefined : Number(weight), energy, mood, workedOut: worked, date: todayStr() }),
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
        <label>⚖️ Weight</label>
        <input className="enum" type="number" step="0.1" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="lbs" />
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
    const c = lsGet("money");
    if (c) setData(c);
    try {
      const j = await (await fetch("/api/money")).json();
      if (j.error) throw new Error(j.error);
      setData(j); lsSet("money", j);
    } catch (e) { if (!c) setErr(e.message); }
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
          {data.history?.length > 1 && (
            <>
              <div className="chartlbl">📈 Net worth trend</div>
              <div className="chart" style={{ height: 70 }}>
                {(() => {
                  const vals = data.history.map((h) => h.net);
                  const mn = Math.min(...vals), mx = Math.max(...vals);
                  return data.history.map((h, i) => (
                    <div className="cbarwrap" key={i} title={h.month + " · $" + Math.round(h.net).toLocaleString()}>
                      <div className={"cbar " + (h.net >= 0 ? "perfb" : "h75b")} style={{ height: (mx === mn ? 60 : 15 + ((h.net - mn) / (mx - mn)) * 85) + "%" }} />
                      <span className="cday">{h.month.slice(0, 3)}</span>
                    </div>
                  ));
                })()}
              </div>
            </>
          )}
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

// ================= STATS (trends) =================
function Stats() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [days, setDays] = useState(14);
  const load = useCallback(async () => {
    setErr(null);
    const c = lsGet("stats:" + days);
    if (c) setData(c);
    try {
      const j = await (await fetch("/api/stats?days=" + days)).json();
      if (j.error) throw new Error(j.error);
      setData(j); lsSet("stats:" + days, j);
    } catch (e) { if (!c) setErr(e.message); }
  }, [days]);
  useEffect(() => { load(); }, [load]);

  const hasEnergy = data?.energy?.length > 0;
  const hasH75 = data?.h75?.length > 0;
  const weights = (data?.energy || []).filter((d) => d.weight > 0);
  const wMin = Math.min(...weights.map((d) => d.weight), Infinity);
  const wMax = Math.max(...weights.map((d) => d.weight), -Infinity);
  return (
    <section>
      <h2>📊 Trends
        <span className="sub">
          {[14, 30, 90].map((d) => (
            <button key={d} className={"modechip" + (days === d ? " on" : "")} style={{ marginLeft: 6, padding: "4px 9px", fontSize: "0.72rem" }} onClick={() => setDays(d)}>{d}d</button>
          ))}
        </span>
      </h2>
      {err && <p className="empty">{err}</p>}
      {!data && !err && <div className="skel" />}
      {data && !hasEnergy && !hasH75 && <p className="empty">Log Energy &amp; Sleep and check off 75 Hard days — your charts grow here.</p>}
      {hasEnergy && (
        <>
          <div className="chartlbl">⚡ Energy (1–10) &amp; 😴 sleep hrs</div>
          <div className="chart">
            {data.energy.map((d, i, arr) => (
              <div className="cbarwrap" key={i} title={d.day + " · sleep " + d.sleep + "h · energy " + d.energy}>
                <div className={"cbar sleepb" + (d.sleep ? "" : " z")} style={{ height: Math.max(4, Math.min(100, (d.sleep / 10) * 100)) + "%" }} />
                <div className={"cbar energyb" + (d.energy ? "" : " z")} style={{ height: Math.max(4, (d.energy / 10) * 100) + "%" }} />
                {i % Math.ceil(arr.length / 7) === 0 && <span className="cday">{(d.date || "").slice(5).replace("-", "/")}</span>}
              </div>
            ))}
          </div>
        </>
      )}
      {hasH75 && (
        <>
          <div className="chartlbl">🔥 75 Hard — items done per day (7 = perfect)</div>
          <div className="chart">
            {data.h75.map((d, i, arr) => (
              <div className="cbarwrap" key={i} title={d.day + " · " + d.done + "/7"}>
                <div className={"cbar " + (d.done === 7 ? "perfb" : "h75b") + (d.done ? "" : " z")} style={{ height: Math.max(4, (d.done / 7) * 100) + "%" }} />
                {i % Math.ceil(arr.length / 7) === 0 && <span className="cday">{(d.date || "").slice(5).replace("-", "/")}</span>}
              </div>
            ))}
          </div>
          <p className="empty">{data.h75.filter((d) => d.done === 7).length} perfect day{data.h75.filter((d) => d.done === 7).length === 1 ? "" : "s"} in this window.</p>
        </>
      )}
      {weights.length > 1 && (
        <>
          <div className="chartlbl">⚖️ Weight ({wMin}–{wMax} lbs)</div>
          <div className="chart">
            {weights.map((d, i, arr) => (
              <div className="cbarwrap" key={i} title={d.day + " · " + d.weight + " lbs"}>
                <div className="cbar h75b" style={{ height: (wMax === wMin ? 60 : 15 + ((d.weight - wMin) / (wMax - wMin)) * 85) + "%" }} />
                {i % Math.ceil(arr.length / 7) === 0 && <span className="cday">{(d.date || "").slice(5).replace("-", "/")}</span>}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// ================= JOURNAL (goals / dreams / gratitude) =================
const PROMPTS = {
  goal: [
    "What exactly do I want, and by when?",
    "Why does this goal matter to me?",
    "What does life look like when I achieve it?",
    "What's the very first step I can take this week?",
    "What will I have to give up or say no to?",
    "How will I know I'm on track in 30 days?",
  ],
  dream: [
    "If nothing could stop me, what would I build?",
    "Where do I live and what does a normal day look like in 5 years?",
    "Who am I becoming in this dream?",
    "What would I do if I knew I couldn't fail?",
    "What's the wildest version of this — 10X bigger?",
  ],
  gratitude: [
    "What made me smile today?",
    "Who am I grateful for right now, and why?",
    "What went better than expected this week?",
    "What's something hard that's secretly a gift?",
    "What do I have today that I once prayed for?",
  ],
};
const AREAS = ["Health", "Work/Business", "Money", "Relationships", "Growth", "Fun/Adventure"];

function useVoice(onText) {
  const recRef = useRef(null);
  const [listening, setListening] = useState(false);
  const supported = typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  function toggle() {
    if (!supported) return;
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (e) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) text += e.results[i][0].transcript + " ";
      }
      if (text) onText(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }
  return { supported, listening, toggle };
}

function Journal({ xp, say }) {
  const [mode, setMode] = useState("goal");
  const [title, setTitle] = useState("");
  const [area, setArea] = useState("Growth");
  const [body, setBody] = useState("");
  const [win, setWin] = useState("");
  const [busy, setBusy] = useState(false);
  const voice = useVoice((t) => setBody((b) => (b ? b + " " : "") + t.trim()));

  function usePrompt(q) {
    setBody((b) => (b ? b + "\n\n" : "") + q + "\n");
  }

  async function save() {
    if (mode === "gratitude") {
      if (!body.trim() && !win.trim()) { say("Write something first 🙂"); return; }
      setBusy(true);
      try {
        const j = await (await fetch("/api/reflect", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ grateful: body.trim().slice(0, 900) || "(grateful)", win: win.trim(), mood: "🙂 Good", date: todayStr() }),
        })).json();
        if (j.error) throw new Error(j.error);
        xp(10, true); say("Gratitude logged. +10 XP 🙏"); setBody(""); setWin("");
      } catch { say("Couldn't save — try again"); }
      setBusy(false);
      return;
    }
    if (!title.trim()) { say(mode === "goal" ? "Give your goal a name first 🎯" : "Name the dream first 🌌"); return; }
    setBusy(true);
    try {
      const j = await (await fetch("/api/journal", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: mode, title: title.trim(), area, body: body.trim() }),
      })).json();
      if (j.error) throw new Error(j.error);
      xp(10, true); say((mode === "goal" ? "Goal" : "Dream") + " saved to Notion. +10 XP 🎯");
      setTitle(""); setBody("");
    } catch { say("Couldn't save — try again"); }
    setBusy(false);
  }

  return (
    <>
      <section>
        <h2>📝 Journal <span className="sub">write it into existence</span></h2>
        <div className="modes">
          {[["goal", "🎯 Goal"], ["dream", "🌌 Dream"], ["gratitude", "🙏 Gratitude"]].map(([m, l]) => (
            <button key={m} className={"modechip" + (mode === m ? " on" : "")} onClick={() => { setMode(m); }}>{l}</button>
          ))}
        </div>
        {mode !== "gratitude" && (
          <>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={mode === "goal" ? "Name the goal (e.g. Hit $10k/mo by December)" : "Name the dream (e.g. Beach house + business that runs itself)"} />
            <div className="modes" style={{ flexWrap: "wrap" }}>
              {AREAS.map((a) => (
                <button key={a} className={"modechip" + (area === a ? " on" : "")} onClick={() => setArea(a)}>{a}</button>
              ))}
            </div>
          </>
        )}
        <div className="chartlbl">Need a spark? Tap a question — it drops into your page:</div>
        <div className="prompts">
          {PROMPTS[mode].map((q) => (
            <button key={q} className="prompt" onClick={() => usePrompt(q)}>{q}</button>
          ))}
        </div>
        <div className="jwrap">
          <textarea className="jtext" value={body} onChange={(e) => setBody(e.target.value)}
            placeholder={mode === "gratitude" ? "What are you grateful for today?" : "Write freely — this saves into the page in Notion…"} />
          <button className={"micbtn" + (voice.listening ? " live" : "")} onClick={voice.toggle}
            title={voice.supported ? "Voice to text" : "Use your keyboard's 🎤 dictation"}>
            {voice.listening ? "⏺ Listening…" : "🎤 Voice"}
          </button>
        </div>
        {!voice.supported && <p className="empty">Tip: your phone keyboard&rsquo;s 🎤 button dictates into any box here too.</p>}
        {mode === "gratitude" && (
          <input value={win} onChange={(e) => setWin(e.target.value)} placeholder="One win today 🏆 (optional)" />
        )}
        <button className="btn" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save to Notion (+10 XP)"}</button>
      </section>
      <section>
        <h2>💡 How this works</h2>
        <p className="empty">
          🎯 Goals save as <b>Active</b> and 🌌 Dreams as <b>Dreaming</b> in your Goals &amp; Dreams database — your writing becomes the page body. 🙏 Gratitude goes to Gratitude &amp; Wins. Everything shows up in Notion instantly.
        </p>
      </section>
    </>
  );
}

function Err({ retry, msg }) {
  return <p className="err">Couldn&rsquo;t reach Notion ({msg}). <button className="btn sec" onClick={retry}>⟳ Retry</button></p>;
}
function Skel() { return <div className="skel" />; }
