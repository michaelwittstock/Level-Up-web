import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  async function load() {
    setErr(null);
    try {
      const r = await fetch("/api/today");
      const j = await r.json();
      if (j.error) throw new Error(j.error);
      setData(j);
    } catch (e) {
      setErr(e.message);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function done(id) {
    setData((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) }));
    await fetch("/api/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  return (
    <main>
      <h1>⚡ Today</h1>
      {err && (
        <p className="err">
          Couldn&rsquo;t reach Notion: {err} <button onClick={load}>Retry</button>
        </p>
      )}
      {!data && !err && <p className="muted">Loading&hellip;</p>}
      {data?.quote && (
        <blockquote>
          &ldquo;{data.quote.quote}&rdquo;
          <cite>&mdash; {data.quote.author || "Unknown"}</cite>
        </blockquote>
      )}
      <section>
        <h2>Tasks</h2>
        {data?.tasks?.length === 0 && <p className="muted">All clear. 🎉</p>}
        <ul>
          {data?.tasks?.map((t) => (
            <li key={t.id}>
              <button className="chk" onClick={() => done(t.id)} aria-label="Complete">
                ○
              </button>
              <span>{t.title}</span>
            </li>
          ))}
        </ul>
      </section>
      <footer>Personal Level Up · synced with your Notion</footer>
    </main>
  );
}
