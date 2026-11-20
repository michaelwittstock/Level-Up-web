# Level Up · Finance module

Powers the Money tab: balances, due dates, debt payoff, net worth, rewards.

## Data flow
```
Grok (has the financial accounts connected)
   └─ writes finance/feeds/accounts.json + prices.json daily
Claude
   └─ app reads feeds + Notion (💰 Net Worth DB) → Money tab, alerts, payoff plan
Michael
   └─ fills gaps (APR, statement dates, rewards) in data/cards.json or Notion
```

## Files
| Path | Owner | What |
|---|---|---|
| `feeds/accounts.json` | Grok | Every account's latest balance (format below) |
| `feeds/prices.json` | Grok | Prices for stocks/crypto in holdings |
| `data/cards.json` | Claude/Michael | Card details that rarely change: APR, limit, due day, statement close day, rewards |
| `data/debts.json`, `data/bills.json`, `data/holdings.json` | Claude/Michael | Other debts, recurring bills, positions |
| `tools/payoff.py` | Claude | Avalanche vs snowball + "pay $X more" calculator (daily APR) |

## `feeds/accounts.json` (Grok)
```json
{
  "updated": "2026-11-20T07:00:00-08:00",
  "source": "grok",
  "accounts": [
    {
      "id": "chase-sapphire-1234",
      "institution": "Chase",
      "name": "Sapphire Preferred",
      "type": "credit_card",
      "last4": "1234",
      "balance": 2450.18,
      "limit": 10000,
      "available": 7549.82,
      "apr": 24.99,
      "min_payment": 75,
      "due_date": "2026-12-03",
      "statement_balance": 2100.00,
      "statement_close_date": "2026-11-08",
      "last_payment": {"amount": 300, "date": "2026-11-02"}
    }
  ]
}
```
`type` is one of: `checking`, `savings`, `credit_card`, `loan`, `brokerage`, `retirement`, `crypto`, `other`.
Unknown fields → `null` (never guess). For brokerage/crypto add `"positions": [{"symbol":"BTC","quantity":0.12}]`.

## `feeds/prices.json` (Grok)
```json
{"updated": "2026-11-20T07:00:00-08:00", "prices": {"BTC": 91234.5, "AAPL": 231.12}}
```

## Payoff calculator
```bash
python3 finance/tools/payoff.py --extra 200 --compare 100,250,500
```
