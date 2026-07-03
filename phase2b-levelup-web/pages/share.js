import Head from "next/head";
import { DB, H75, check, queryAll } from "../lib/notion";

// Public accountability page — /share
// Shows only 75 Hard progress numbers. No tasks, no personal data.
export async function getServerSideProps() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const rows = await queryAll(DB.h75, {
      filter: { property: "Date", date: { on_or_before: today } },
    });
    const sorted = rows
      .map((r) => ({ d: r.properties?.Date?.date?.start || "", perfect: H75.every(([p]) => check(r, p)) }))
      .filter((r) => r.d)
      .sort((a, b) => (a.d < b.d ? -1 : 1));
    let perfect = 0, longest = 0, run = 0;
    for (const r of sorted) {
      if (r.perfect) { perfect++; run++; longest = Math.max(longest, run); }
      else run = 0;
    }
    let current = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (i === sorted.length - 1 && sorted[i].d === today && !sorted[i].perfect) continue;
      if (sorted[i].perfect) current++;
      else break;
    }
    return { props: { elapsed: sorted.length, perfect, current, longest, last14: sorted.slice(-14).map((r) => (r.perfect ? 1 : 0)) } };
  } catch {
    return { props: { elapsed: 0, perfect: 0, current: 0, longest: 0, last14: [] } };
  }
}

export default function Share({ elapsed, perfect, current, longest, last14 }) {
  return (
    <div className="app" style={{ paddingTop: 40 }}>
      <Head>
        <title>Michael's 75 Hard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
      </Head>
      <section style={{ textAlign: "center" }}>
        <div className="hello" style={{ fontSize: "1.6rem" }}>🔥 Michael&rsquo;s 75 Hard</div>
        <p className="empty">Public scoreboard. Hold me to it.</p>
        <div className="networth" style={{ marginTop: 16 }}>
          <div><span className="sub">Day</span><b>{elapsed}/75</b></div>
          <div><span className="sub">Perfect days</span><b className="pos">{perfect}</b></div>
          <div><span className="sub">Streak</span><b style={{ color: "#f5c518" }}>🔥 {current}</b></div>
          <div><span className="sub">Longest</span><b>{longest}</b></div>
        </div>
        <div className="xpbar" style={{ marginTop: 16 }}><i style={{ width: Math.min(100, (perfect / 75) * 100) + "%" }} /></div>
        <p className="empty" style={{ marginTop: 6 }}>{perfect} of 75 perfect days banked</p>
        {last14.length > 0 && (
          <div className="chart" style={{ marginTop: 14 }}>
            {last14.map((v, i) => (
              <div className="cbarwrap" key={i}>
                <div className={"cbar " + (v ? "perfb" : "h75b z")} style={{ height: v ? "100%" : "8%" }} />
              </div>
            ))}
          </div>
        )}
        <p className="empty" style={{ marginTop: 20 }}>Miss one task → back to Day 1. No negotiations.</p>
      </section>
    </div>
  );
}
