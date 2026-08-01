# Task 14: Offline HTML Table Extractor / Web Scraper

## Objective
Allow users to paste raw HTML source code and extract all structured data (tables, lists, JSON-LD) directly into queryable DuckDB tables without leaving the browser.

## Implementation Steps
1. **UI:** Create `src/routes/analytics/extractor/+page.svelte` with a raw text paste area.
2. **Parsing:**
   - Use `DOMParser` to parse the dropped HTML text.
   - Query all `<table>` elements. Extract headers (`<th>`) and rows (`<tr>/<td>`).
   - Query `<script type="application/ld+json">` for structured JSON data.
3. **DuckDB Integration:** Convert the extracted arrays into Parquet/JSON and register them with DuckDB.
4. **Preview:** Show a data grid preview of the extracted tables.

## Definition of Done
- Pasting an HTML blob with 3 tables results in 3 new DuckDB views.
- Extracted data can be seamlessly moved into the Pivot Builder.
