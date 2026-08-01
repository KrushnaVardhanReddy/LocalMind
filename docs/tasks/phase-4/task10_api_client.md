# Task 10: Offline API Client (Postman Alternative)

## Objective
Implement an entirely browser-based API client for testing REST and GraphQL endpoints. The tool should function like Postman or Insomnia but run entirely locally, preserving privacy and keeping request history stored exclusively in local wa-sqlite.

## Prerequisites
- Review DevTools architecture and existing components.

## Implementation Steps

### 1. Build the UI Shell
- Create `src/routes/devtools/api-client/+page.svelte`.
- Layout: Left sidebar for request history/collections, main panel for active request, bottom/right panel for response.
- Support HTTP Methods dropdown: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`, `HEAD`.
- URL input bar with a "Send" button.

### 2. Request Configuration Tabs
- Implement tabs for configuring the request:
  - **Params**: Key-value grid for URL query parameters.
  - **Headers**: Key-value grid for HTTP headers.
  - **Auth**: Basic Auth, Bearer Token.
  - **Body**: `none`, `raw` (JSON/Text), `form-data`, `x-www-form-urlencoded`.
  - **GraphQL**: Include a specific GraphQL mode with Query and Variables editors.

### 3. Request Execution
- Use the native browser `fetch` API to dispatch the HTTP requests.
- Handle CORS limitations gracefully with clear UI warnings.
- Measure request duration (ms) and response payload size.

### 4. Response Viewer
- Display response Status Code and Time (e.g., `200 OK • 124ms`).
- Implement tabs for the response:
  - **Body**: Pretty-print JSON/XML.
  - **Headers**: List response headers.
  - **Raw**: Display raw response text.

### 5. Storage and History
- Store executed requests and saved collections in the local wa-sqlite database.
- Support Export/Import of collections in standard Postman Collection format (v2/v2.1 JSON).

## Definition of Done
- User can select a method, enter a URL, configure headers/body, and successfully execute an HTTP request.
- GraphQL queries with variables are supported natively.
- Response body and headers are displayed cleanly with JSON syntax highlighting.
- Request history is persisted locally.
