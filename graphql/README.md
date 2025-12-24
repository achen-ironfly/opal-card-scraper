# Opal Card GraphQL API

## Overview

A GraphQL API for the Opal Card system that provides account and transaction data querying.

## Quick Start

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

### Graphql URL
```
http://localhost:8080/graphql/
```

## Authentication

Before using any queries, first call the `authenticate` mutation to establish a user session.

### Authenticate Mutation

```graphql
mutation {
  authenticate(
    userId: "user123", 
    password: "yourPassword", 
    showBrowser: true) 
    {
      userId
      authenticated
    }
}
```

**Parameters:**
- `userId` : The user's ID
- `password` : The user's password
- `showBrowser` : Whether to display the browser window during authentication (default: false)

**Response Example:**
```json
{
  "data": {
    "authenticate": {
      "userId": "user123",
      "authenticated": true
    }
  }
}
```

## Queries

### Get All Accounts

Retrieve all accounts for an authenticated user.

```graphql
query {
  accounts(userId: "user123") {
    accountId
    balance
    currency
    blocked
  }
}
```

**Parameters:**
- `userId` : The authenticated user's ID

---

### Get Single Account

Retrieve a specific account by ID.

```graphql
query {
  account(userId: "user123", accountId: "acc123") {
    accountId
    balance
    currency
    blocked
  }
}
```

**Parameters:**
- `userId` : The authenticated user's ID
- `accountId` : The account ID to retrieve

---

### Get Transactions

Retrieve transactions with optional filtering by date range and account.

```graphql
query {
  transactions(
    userId: "user123"
    startDate: "2024-01-01"
    endDate: "2024-12-31"
    accountId: "acc123"
  ) {
    transactionDate
    time_local
    time_utc
    quantity
    currency
    accountId
    description
    tap_on_location
    tap_off_location
    status
    bankImportedBalance
    transactionId
  }
}
```
# Step 4: Get transaction by transactionId
```graphql
query {
  transaction(
    userId: "user123"
    transactionId: "1704067200"
  ) {
    transactionDate
    time_local
    time_utc
    quantity
    currency
    accountId
    description
    tap_on_location
    tap_off_location
    status
    bankImportedBalance
    transactionId
  }
}
```

**Parameters:**
- `userId` : The authenticated user's ID
- `startDate` : Filter transactions from this date
- `endDate` : Filter transactions up to this date
- `accountId` : Filter by specific account ID
- `transactionId` : Filter by specific transaction ID

