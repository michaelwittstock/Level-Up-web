#!/usr/bin/env python3
"""Debt payoff planner: avalanche vs snowball + "what if I pay $X more".

Interest is modeled the way cards charge it: daily periodic rate (APR/365)
on the balance, ~30.42 days per month. Minimum payments stay fixed; when a
debt is paid off its minimum rolls into the next target ("rollover").

Usage:
  python3 tools/payoff.py                      # uses data/cards.json + data/debts.json
  python3 tools/payoff.py --extra 200          # $200/mo extra on top of minimums
  python3 tools/payoff.py --extra 200 --compare 100,300,500
"""
import argparse, json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DAYS_PER_MONTH = 365 / 12


def load_debts():
    debts = []
    for f in ("cards.json", "debts.json"):
        p = ROOT / "data" / f
        if p.exists():
            for d in json.loads(p.read_text()):
                if d.get("balance", 0) > 0:
                    debts.append({"name": d.get("name") or d["id"], "balance": float(d["balance"]),
                                  "apr": float(d["apr"]), "min": float(d.get("min_payment", 0))})
    return debts


def daily_interest(debts):
    return sum(d["balance"] * d["apr"] / 100 / 365 for d in debts)


def simulate(debts, extra, strategy, max_months=600):
    ds = [dict(d) for d in debts]
    budget = sum(d["min"] for d in ds) + extra
    month, total_interest, order = 0, 0.0, []
    while any(d["balance"] > 0.005 for d in ds) and month < max_months:
        month += 1
        for d in ds:  # accrue interest
            if d["balance"] > 0:
                i = d["balance"] * d["apr"] / 100 / 365 * DAYS_PER_MONTH
                d["balance"] += i
                total_interest += i
        pool = budget
        for d in ds:  # pay minimums
            if d["balance"] > 0:
                pay = min(d["min"], d["balance"], pool)
                d["balance"] -= pay
                pool -= pay
        active = [d for d in ds if d["balance"] > 0.005]
        key = (lambda d: -d["apr"]) if strategy == "avalanche" else (lambda d: d["balance"])
        for d in sorted(active, key=key):  # extra + rollover to target
            if pool <= 0:
                break
            pay = min(pool, d["balance"])
            d["balance"] -= pay
            pool -= pay
        for d in ds:
            if d["balance"] <= 0.005 and d["name"] not in [o[0] for o in order]:
                d["balance"] = 0
                order.append((d["name"], month))
    return {"months": month, "interest": round(total_interest, 2), "order": order,
            "stuck": month >= max_months}


def fmt_months(m):
    return f"{m // 12}y {m % 12}m" if m >= 12 else f"{m}m"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--extra", type=float, default=0)
    ap.add_argument("--compare", default="100,250,500")
    a = ap.parse_args()
    debts = load_debts()
    if not debts:
        print("No balances found in data/cards.json or data/debts.json")
        return
    total = sum(d["balance"] for d in debts)
    print(f"Total debt: ${total:,.2f} | interest costing you ~${daily_interest(debts):,.2f}/day "
          f"(${daily_interest(debts) * DAYS_PER_MONTH:,.2f}/mo)\n")

    base = simulate(debts, 0, "avalanche")
    print(f"Minimums only: {fmt_months(base['months'])}, ${base['interest']:,.2f} interest"
          + ("  ⚠️ never pays off at minimums" if base["stuck"] else ""))

    for strat in ("avalanche", "snowball"):
        r = simulate(debts, a.extra, strat)
        print(f"\n{strat.title()} (+${a.extra:,.0f}/mo): debt-free in {fmt_months(r['months'])}, "
              f"${r['interest']:,.2f} interest")
        for name, m in r["order"]:
            print(f"   ✔ {name} paid off in month {m}")

    print("\nWhat if I pay more? (avalanche)")
    ref = simulate(debts, a.extra, "avalanche")
    for x in [float(v) for v in a.compare.split(",") if v.strip()]:
        r = simulate(debts, a.extra + x, "avalanche")
        print(f"  +${x:,.0f}/mo more → {fmt_months(r['months'])} "
              f"(saves {ref['months'] - r['months']} months, ${ref['interest'] - r['interest']:,.2f} interest)")


if __name__ == "__main__":
    main()
