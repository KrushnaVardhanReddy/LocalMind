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

## 4. Chart Customization Payload
Used when asking the AI to generate or modify an ECharts configuration from a natural language instruction.

### 4.1 Request Payload
```json
{
  "task": "CHART_CUSTOMIZATION",
  "context": {
    "schema": [
      {"column": "category", "type": "VARCHAR"},
      {"column": "revenue", "type": "DECIMAL"}
    ],
    "current_chart": {
      "type": "bar",
      "xAxis": "category",
      "yAxis": "revenue"
    },
    "row_count": 10500
  },
  "instruction": "Make it a horizontal bar chart sorted by revenue descending, with a blue color palette"
}
```

> **Privacy**: This payload contains ONLY schema (column names + types), the current chart's visual config, and the user's instruction. Raw data rows are NEVER included.

### 4.2 Expected Response
```json
{
  "echartsOption": {
    "title": { "text": "Revenue by Category" },
    "xAxis": { "type": "value", "name": "revenue" },
    "yAxis": { "type": "category", "name": "category" },
    "series": [{ "type": "bar", "color": "#1e40af" }]
  },
  "explanation": "Switched to a horizontal bar chart with the value on the X axis, category on Y, and applied a blue (#1e40af) color."
}
```

> **Security**: Before applying, the `echartsOption` object MUST be validated client-side. Any key containing function strings (`formatter: function...`), `eval(`, `Function(`, or `<script>` must be stripped or rejected entirely.

## 5. Chart Explanation Payload
Used when asking the AI to generate a natural language summary of the currently displayed chart. Reuses the `SUMMARIZE_AGGREGATION` task from §3, but the prompt is automatically set to "Explain what this chart shows in 2-3 sentences for a non-technical reader."

## 6. Privacy Invariants
1. **No Raw Rows**: The `aggregated_data` array must NEVER contain raw row-level data from the source file. It must only contain the results of a `GROUP BY` or statistical function.
2. **Review Requirement**: Every payload generated against this contract must be rendered in the UI for user approval before the HTTP request is dispatched.
3. **Chart Config Only**: The `CHART_CUSTOMIZATION` payload sends schema and chart visual config — never the data rows themselves.
4. **Response Sanitization**: All AI-returned ECharts option objects must be validated and sanitized client-side before being applied to prevent function injection.
