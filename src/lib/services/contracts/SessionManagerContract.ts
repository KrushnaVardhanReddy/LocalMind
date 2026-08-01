export interface SessionState {
  version: string;
  workspaceId: string;
  name: string;
  exportTimestamp: number;
  state: {
    activeFiles: any[];
    queries: any[];
    chartConfig: any;
    chatHistory: any[];
  };
}

export interface SessionManagerContract {
  /**
   * Serializes the current workspace state into a portable .lm Blob
   * @param workspaceId The ID of the workspace to export
   * @returns A Promise resolving to a Blob containing the compressed .lm file
   */
  exportSession(workspaceId: string): Promise<Blob>;

  /**
   * Imports a .lm file and hydrates the wa-sqlite local database
   * @param file The uploaded .lm File object
   * @returns The ID of the newly imported workspace
   */
  importSession(file: File): Promise<string>;

  /**
   * Saves a partial state update to the local wa-sqlite database
   * @param workspaceId The active workspace ID
   * @param state Partial state object (e.g., just new chart config)
   */
  saveActiveState(workspaceId: string, state: Partial<SessionState['state']>): Promise<void>;
}
