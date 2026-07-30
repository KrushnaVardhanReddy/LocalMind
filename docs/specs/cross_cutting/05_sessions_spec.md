# Spec: 05 - Sessions Core (.lm format)

## 1. Overview
The "Sessions" feature is the core differentiator of LocalMind. It allows a user to save their entire active workspace state (data, queries, charts, and LLM chat history) into a portable, single `.lm` file. This file can be shared, emailed, or backed up, and later imported into LocalMind seamlessly.

## 2. The `.lm` Format Structure
A `.lm` file is fundamentally a compressed JSON blob containing the aggregated state of a workspace, serialized from the `wa-sqlite` local database.

### Schema
```json
{
  "version": "1.0",
  "workspaceId": "uuid-string",
  "name": "My Workspace Name",
  "exportTimestamp": 1715000000000,
  "state": {
    "activeFiles": [
      {
        "id": "file-uuid",
        "name": "sales_data.csv",
        "metadata": { "rowCount": 10000 }
      }
    ],
    "queries": [
      {
        "id": "query-uuid",
        "sql": "SELECT * FROM sales_data",
        "timestamp": 1715000000000
      }
    ],
    "chartConfig": {
      "type": "bar",
      "xAxis": "region",
      "yAxis": "revenue"
    },
    "chatHistory": [
      {
        "role": "user",
        "content": "Summarize this dataset."
      }
    ]
  }
}
```

## 3. Serialization Flow
1. User clicks "Export Session".
2. `SessionManager` reads the active workspace ID.
3. It performs async queries against `wa-sqlite` to gather files, queries, charts, and chats.
4. It compiles this into the JSON structure above.
5. It stringifies the JSON and uses the OPFS (Origin Private File System) API to generate a temporary Blob.
6. The Blob is downloaded to the user's OS as `workspace_name.lm`.
