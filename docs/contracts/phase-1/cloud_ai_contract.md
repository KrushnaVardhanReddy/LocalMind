# Phase 1: Cloud AI API Contract

## 1. Overview
This contract defines the strict payloads that are permitted to leave the local browser environment and be sent to the Cloud AI Provider. This enforces the privacy-first model where raw data is never transmitted.

## 2. Text-to-SQL Payload
Used when asking the AI to generate a SQL query based on the structure of the data.

### 2.1 Request Payload
```json
{
  "task": "TEXT_TO_SQL",
  "context": {
    "dialect": "duckdb",
    "tables": [
      {
        "name": "sales_data",
        "schema": [
          {"column": "date", "type": "TIMESTAMP"},
          {"column": "product_id", "type": "VARCHAR"},
          {"column": "revenue", "type": "DECIMAL"}
        ],
        "sample_values": {
          "product_id": ["PROD-1", "PROD-2"] // ONLY non-PII categorical samples
        }
      }
    ]
  },
  "prompt": "What was the total revenue per product last month?"
}
```

### 2.2 Expected Response
```json
{
  "sql": "SELECT product_id, SUM(revenue) as total_revenue FROM sales_data WHERE date >= current_date() - interval '1 month' GROUP BY product_id;",
  "explanation": "Calculates the sum of revenue grouped by product ID for the last month."
}
```

## 3. Aggregated Insights Payload
Used when asking the AI to summarize pre-computed statistical data.

### 3.1 Request Payload
```json
{
  "task": "SUMMARIZE_AGGREGATION",
  "context": {
    "metrics": {
      "total_rows": 10500,
      "date_range": ["2023-01-01", "2023-12-31"]
    },
    "aggregated_data": [
      {"category": "Electronics", "growth_pct": 12.5, "churn_rate": 2.1},
      {"category": "Apparel", "growth_pct": -4.2, "churn_rate": 5.4}
    ]
  },
  "prompt": "Provide a brief executive summary of these category performance metrics."
}
```

### 3.2 Expected Response
```json
{
  "insight": "Electronics saw strong growth (12.5%) with low churn (2.1%), while Apparel struggled, experiencing a 4.2% decline and higher churn (5.4%). Focus retention efforts on Apparel."
}
```

## 4. Privacy Invariants
1. **No Raw Rows**: The `aggregated_data` array must NEVER contain raw row-level data from the source file. It must only contain the results of a `GROUP BY` or statistical function.
2. **Review Requirement**: Every payload generated against this contract must be rendered in the UI for user approval before the HTTP request is dispatched.
