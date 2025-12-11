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

Install dependencies:  https://nodejs.org/
```bash
node -v 
npm -v
npm install typescript ts-node @types/node --save-dev
npm install playwright
npm install luxon
```

## Usage
Run the scraper:
```bash
npm run dev
```
You will be prompted for login info(email, password) and date range(strat date, end date).

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

## Disclaimer
This tool automates browsing of the NSW Opal website for personal use only. Ensure usage complies with Opal's terms and conditions.
