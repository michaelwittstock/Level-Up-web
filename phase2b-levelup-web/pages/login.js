import Head from "next/head";
import { useState } from "react";

// /login — passcode screen. Only page (with /share) reachable without the cookie.
export default function Login() {
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const r = await fetch("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ passcode: code }),
    }).catch(() => null);
    setBusy(false);
    if (r && r.ok) {
      const next = new URLSearchParams(location.search).get("next") || "/";
      location.replace(next.startsWith("/") && !next.startsWith("//") ? next : "/");
    } else {
      setErr(r && r.status === 401 ? "That passcode didn't match." : "Couldn't reach Level Up. Try again.");
    }
  }

  return (
    <div className="app" style={{ paddingTop: 80, maxWidth: 360, margin: "0 auto" }}>
      <Head>
        <title>Level Up · Sign in</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="hello" style={{ fontSize: "1.6rem" }}>⚡ Level Up</div>
      <form onSubmit={submit} style={{ marginTop: 24, display: "grid", gap: 12 }}>
        <label htmlFor="pc" style={{ color: "var(--mut)" }}>Passcode</label>
        <input
          id="pc"
          type="password"
          autoComplete="current-password"
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={{
            padding: "14px 16px",
            borderRadius: "var(--radius-s)",
            border: "1px solid var(--hair)",
            background: "var(--panel)",
            color: "var(--tx)",
            fontSize: "1rem",
          }}
        />
        <button
          type="submit"
          disabled={busy || !code}
          style={{
            padding: "14px 16px",
            borderRadius: "var(--radius-s)",
            border: 0,
            background: "var(--accent)",
            color: "#fff",
            fontSize: "1rem",
            fontWeight: 600,
            opacity: busy || !code ? 0.6 : 1,
          }}
        >
          {busy ? "Checking…" : "Unlock"}
        </button>
        {err && <p role="alert" style={{ color: "var(--red)", margin: 0 }}>{err}</p>}
      </form>
    </div>
  );
}
