# Opal Card Transactions Scraper

This project provides a Playwright-based scraper that logs into the NSW Opal website, filters transactions by date range, and exports them to JSON file.

## Features
- Interactive CLI prompts for:
  - Username (email)
  - Password
  - Start date (MM-DD-YYYY or press Enter for earliest)
  - End date (MM-DD-YYYY or press Enter for today)
  - Open browser to show process? (y/n):         

- Scrapes:
  - transactionDate
  - time_local
  - time_utc
  - quantity
  - currency
  - accountId
  - mode
  - description
  - tap_on_location
  - tap_off_location
  - status
  - bankImportedBalance
- Result filtering and JSON export
- Output filename automatically reflects selected date range

## Requirements
- Node.js 18+
- Playwright
- Luxon
- Angular

Install dependencies:  https://nodejs.org/
```powershell
node -v 
npm -v
npm install typescript ts-node @types/node --save-dev
npm install playwright
npm install luxon
npm install -g @angular/cli
```

## Usage
### Start Backend
Ensure you are in opal-card root:
```powershell
npm run serve
```

### Start Frontend
```powershell
cd my-app
npx ng serve --proxy-config proxy.conf.json
```
The app will be available at `http://localhost:4200`.

### Output
The scraper writes a JSON file to the working directory. Examples:
- `transactions_MM-DD-YYYY_MM-DD-YYYY.json`
- `transactions_earliest-latest.json`
- `transactions_earliest_MM-DD-YYYY.json`
- `transactions_MM-DD-YYYY_latest.json`

The script returns the same transaction array for programmatic use.

## File Structure
- `scraper.ts` – Login, scraping logic, date filtering, JSON output
- `index.ts` – CLI entrypoint (prompts user, calls scraper)


## Transactions API

### POST `/api/scrape`

```powershell
$body = @{
  username = "xxx@xxx.com"
  password = "xxxxxx"
  startDate = ""
  endDate = ""
  showBrowser = $false
} | ConvertTo-Json

Invoke-WebRequest -Method Post `
  -Uri "http://localhost:8080/api/scrape" `
  -ContentType "application/json" `
  -Body $body

```

### GET `/api/transactions`

1. Get all transactions
```powershell
Invoke-WebRequest -Method Get -Uri "http://localhost:8080/api/transactions"
```
2. Get transactions with mode
```powershell
Invoke-WebRequest -Method Get -Uri "http://localhost:8080/api/transactions?mode=bus"
```

3. Get transactions by accountId, the response will be saved to a JSON file.
```powershell
Invoke-WebRequest -Uri "http://localhost:8080/api/transactions?accountId=xxxx%20xxxx%20xxxx%20xxxx" -OutFile transactions.json
```

### Query Parameters

| parameter | description | type |
|---------|-------------|------|
| `accountId` | Filter by Opal card account ID | string |
| `mode` | Filter by transport mode (e.g. `bus`, `lightrail`, `ferry`) | string |
| `from` | Start date (MM-DD-YYYY) for filtering transactions by `time_utc` | string |
| `to` | End date (MM-DD-YYYY) for filtering transactions by `time_utc` | string |

---

## Disclaimer
This tool automates browsing of the NSW Opal website for personal use only. Ensure usage complies with Opal's terms and conditions.
