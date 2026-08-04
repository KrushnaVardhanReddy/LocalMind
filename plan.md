1. **Create the UI structure**
   - Create `src/routes/plugins/directory-search/+page.svelte` using `write_file` for standard two-pane layout (CSS grid).
   - Create `src/lib/components/plugins/directory-search/ui/DirectoryScanner.svelte` (left pane) using `write_file`.
   - Create `src/lib/components/plugins/directory-search/ui/SearchResults.svelte` (right pane) using `write_file`.
   - Verify files with `list_files` to ensure they were created in the target directories.

2. **Update MuPDF worker**
   - Use `replace_with_git_merge_diff` to edit `src/lib/workers/mupdf.worker.ts` and add an `extractText` method to extract text from a PDF Buffer, as required by the specification to parse PDFs. I will implement it fully without stubs.
   - Use `read_file` to verify the changes.

3. **Implement DirectoryScanner logic**
   - Use `replace_with_git_merge_diff` to edit `DirectoryScanner.svelte` and add Svelte 5 `$state()` for tracking progress and indexing state.
   - Implement `showDirectoryPicker()` logic and recursive directory traversal loop to find `.txt`, `.md`, and `.pdf` files.
   - For txt/md files, use native FileReader.
   - For PDFs, invoke `WorkerManager.getMuPDF()` and use `extractText`.
   - Use `read_file` to verify the changes made to `DirectoryScanner.svelte`.

4. **Implement Embedding and Database Storage**
   - Use `replace_with_git_merge_diff` to edit `DirectoryScanner.svelte` further.
   - Implement text splitting into ~500 word overlapping chunks.
   - Use `WorkerManager.getEmbeddings()` to run embeddings on text chunks. I will dynamically determine the vector length from the resulting embedding output size.
   - Invoke `WorkerManager.getDuckDB()`. Run the DuckDB `query(sql)` method to create the table `CREATE TABLE IF NOT EXISTS docs (path VARCHAR, content VARCHAR, vec FLOAT[VEC_DIM]);` (where VEC_DIM is the dynamic dimension).
   - Run the DuckDB `query(sql)` method to insert the vectors into DuckDB.
   - Use `read_file` to verify changes.

5. **Implement Search logic in SearchResults**
   - Use `replace_with_git_merge_diff` to edit `SearchResults.svelte`.
   - Add a search input bounded with `$state()`.
   - On search event, embed search query using `WorkerManager.getEmbeddings()`.
   - Query DuckDB with `query(sql)` using `SELECT path, content, array_cosine_similarity(vec, query_vec) AS score FROM docs ORDER BY score DESC LIMIT 5;`
   - Render the text snippets matching.
   - Use `read_file` to verify the modifications to `SearchResults.svelte`.

6. **Write tests**
   - Use `write_file` to create `src/lib/components/plugins/directory-search/__tests__/directory-search.test.ts`.
   - Implement test case: "should render DirectoryScanner and SearchResults components".
   - Implement test case: "should invoke showDirectoryPicker when button clicked". Mock `window.showDirectoryPicker`.
   - Implement test case: "should perform search and display results". Mock `WorkerManager.getEmbeddings()` and `WorkerManager.getDuckDB()`.
   - Use `list_files` and `read_file` to confirm the test file was correctly written.

7. **Run tests & verification**
   - Execute `bun run check`, `bun run build`, and `bun run test` to guarantee that everything builds and tests pass.

8. **Pre-commit Steps**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.

9. **Submit**
   - Submit the PR with the required branch name and commit message starting with "jules: ".
