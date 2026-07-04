import Head from "next/head";
import { DB, H75, titleText, sel, num, check, queryAll } from "../lib/notion";

const ENERGY_DB = "2d4f49729dc1445ab0d1cedd4f8e960e";
const NETWORTH_DB = "081ec9b7fbaf434f8d32c6509d4e3ee1";

// /report — your month on one page. Print → Save as PDF.
export async function getServerSideProps({ query }) {
  const now = new Date();
  const ym = /^\d{4}-\d{2}$/.test(String(query.m || "")) ? query.m : now.toISOString().slice(0, 7);
  const from = ym + "-01";
  const to = ym + "-31";
  const out = { ym, perfect: 0, days: 0, avgSleep: 0, avgEnergy: 0, weightStart: 0, weightEnd: 0, steps: 0, assets: 0, liabilities: 0, grats: 0, goals: [] };
  try {
    const [h75, energy, nw, grat, goals] = await Promise.all([
      queryAll(DB.h75, { filter: { and: [{ property: "Date", date: { on_or_after: from } }, { property: "Date", date: { on_or_before: to } }] } }),
      queryAll(ENERGY_DB, { filter: { and: [{ property: "Date", date: { on_or_after: from } }, { property: "Date", date: { on_or_before: to } }] }, sorts: [{ property: "Date", direction: "ascending" }] }),
      queryAll(NETWORTH_DB),
      queryAll(DB.grat, { filter: { property: "Date", date: { on_or_after: from } } }).catch(() => []),
      queryAll(DB.goals, { filter: { property: "Status", select: { does_not_equal: "🏆 Achieved" } } }),
    ]);
    out.days = h75.length;
    out.perfect = h75.filter((r) => H75.every(([p]) => check(r, p))).length;
    const sl = energy.map((p) => num(p, "Sleep (hrs)")).filter(Boolean);
    const en = energy.map((p) => num(p, "Energy (1-10)")).filter(Boolean);
    const wt = energy.map((p) => num(p, "Weight (lbs)")).filter(Boolean);
    const st = energy.map((p) => num(p, "Steps")).filter(Boolean);
    out.avgSleep = sl.length ? +(sl.reduce((a, b) => a + b) / sl.length).toFixed(1) : 0;
    out.avgEnergy = en.length ? +(en.reduce((a, b) => a + b) / en.length).toFixed(1) : 0;
    out.weightStart = wt[0] || 0; out.weightEnd = wt[wt.length - 1] || 0;
    out.steps = st.length ? Math.round(st.reduce((a, b) => a + b) / st.length) : 0;
    for (const p of nw) {
      const v = num(p, "Value");
      if (sel(p, "Type").includes("Asset")) out.assets += v; else out.liabilities += v;
    }
    out.grats = grat.length;
    out.goals = goals.slice(0, 6).map((g) => ({ goal: titleText(g), pct: num(g, "Progress %") }));
  } catch {}
  return { props: out };
}

export default function Report(p) {
  const fmt = (n) => "$" + Math.round(n).toLocaleString();
  const monthName = new Date(p.ym + "-15T12:00:00").toLocaleDateString(undefined, { month: "long", year: "numeric" });
  return (
    <div className="app" style={{ paddingTop: 34 }}>
      <Head><title>Life Report — {monthName}</title><meta name="robots" content="noindex" /></Head>
      <div className="date">Life Report</div>
      <div className="hello">{monthName}</div>
      <section style={{ marginTop: 22 }}>
        <h2>🔥 75 Hard</h2>
        <div className="networth">
          <div><span className="sub">Days tracked</span><b>{p.days}</b></div>
          <div><span className="sub">Perfect days</span><b className="pos">{p.perfect}</b></div>
          <div><span className="sub">Hit rate</span><b>{p.days ? Math.round((p.perfect / p.days) * 100) : 0}%</b></div>
        </div>
      </section>
      <section>
        <h2>🔋 Body</h2>
        <div className="networth">
          <div><span className="sub">Avg sleep</span><b>{p.avgSleep || "—"}h</b></div>
          <div><span className="sub">Avg energy</span><b>{p.avgEnergy || "—"}/10</b></div>
          <div><span className="sub">Weight</span><b>{p.weightStart ? `${p.weightStart}→${p.weightEnd}` : "—"}</b></div>
          <div><span className="sub">Avg steps</span><b>{p.steps ? p.steps.toLocaleString() : "—"}</b></div>
        </div>
      </section>
      <section>
        <h2>💰 Money</h2>
        <div className="networth">
          <div><span className="sub">Net worth</span><b className={p.assets - p.liabilities >= 0 ? "pos" : "neg"}>{fmt(p.assets - p.liabilities)}</b></div>
          <div><span className="sub">Assets</span><b className="pos">{fmt(p.assets)}</b></div>
          <div><span className="sub">Debts</span><b className="neg">{fmt(p.liabilities)}</b></div>
        </div>
      </section>
      <section>
        <h2>🎯 Goals</h2>
        {p.goals.map((g, i) => (
          <div className="goal" key={i}>
            <div className="grow"><span>{g.goal}</span><span className="sub">{g.pct}%</span></div>
            <div className="xpbar"><i style={{ width: g.pct + "%" }} /></div>
          </div>
        ))}
        <p className="empty">🙏 {p.grats} gratitude entries this month.</p>
      </section>
      <div className="tbtns noprint" style={{ marginTop: 10 }}>
        <button className="btn" onClick={() => window.print()}>Save as PDF</button>
      </div>
      <style jsx global>{`@media print { .noprint { display: none; } body { background: #fff !important; } }`}</style>
    </div>
  );
}
