import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Excalidraw, exportToCanvas, exportToSvg } from '@excalidraw/excalidraw';
import { WorkerManager } from '../workers/WorkerManager';

export interface ExcalidrawWrapperProps {
  initialData?: any;
  onChange?: (elements: any[], appState: any) => void;
}

export const ExcalidrawWrapper: React.FC<ExcalidrawWrapperProps> = ({ initialData, onChange }) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);

  // Debounce saving
  const [lastSaved, setLastSaved] = useState<number>(Date.now());
  const lastSavedRef = useRef<number>(Date.now());

  const handleChange = (elements: readonly any[], appState: any) => {
    if (!onChange) return;
    const now = Date.now();
    if (now - lastSavedRef.current > 1000) {
      lastSavedRef.current = now;
      setLastSaved(now);
      onChange([...elements], appState);
    }
  };

  const handleExportPNG = async () => {
    if (!excalidrawAPI) return;
    const elements = excalidrawAPI.getSceneElements();
    if (!elements || !elements.length) return;
    const canvas = await exportToCanvas({
      elements,
      appState: { ...excalidrawAPI.getAppState(), exportWithDarkMode: false },
      files: excalidrawAPI.getFiles(),
      getDimensions: (width: number, height: number) => ({ width, height, scale: 1 }),
    });
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `whiteboard-${Date.now()}.png`;
    link.click();
  };

  const handleExportSVG = async () => {
    if (!excalidrawAPI) return;
    const elements = excalidrawAPI.getSceneElements();
    if (!elements || !elements.length) return;
    const svg = await exportToSvg({
      elements,
      appState: { ...excalidrawAPI.getAppState(), exportBackground: true },
      files: excalidrawAPI.getFiles(),
    });

    // Quick fix for @excalidraw/excalidraw svg export type which returns a dom node
    const svgStr = new XMLSerializer().serializeToString(svg as unknown as Node);

    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `whiteboard-${Date.now()}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleLinkDuckDB = async () => {
    if (!excalidrawAPI) return;
    const tableName = prompt("Enter DuckDB table name to link:");
    if (!tableName) return;

    try {
      const duckdb = await WorkerManager.getDuckDB();
      const res = await duckdb.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      const rowCount = res.rows[0].count;
      const timestamp = new Date().toISOString();

      const elements = excalidrawAPI.getSceneElements();

      const newNode = {
        type: "text",
        x: (excalidrawAPI.getAppState().scrollX || 0) * -1 + 100,
        y: (excalidrawAPI.getAppState().scrollY || 0) * -1 + 100,
        width: 300,
        height: 100,
        text: `📊 ${tableName}\nRows: ${rowCount}\nUpdated: ${timestamp}`,
        fontSize: 20,
        fontFamily: 1,
        textAlign: "left",
        verticalAlign: "top",
        strokeColor: "#000000",
        backgroundColor: "transparent",
        fillStyle: "hachure",
        strokeWidth: 1,
        strokeStyle: "solid",
        roughness: 1,
        opacity: 100,
        groupIds: [],
        roundness: null,
        boundElements: [],
        updated: Date.now(),
        link: null,
        locked: false,
        version: 1,
        versionNonce: Math.floor(Math.random() * 1000000000),
        isDeleted: false,
        id: `node-${Date.now()}`
      };

      excalidrawAPI.updateScene({ elements: [...elements, newNode] });
    } catch (e: any) {
      alert(`Error linking table: ${e.message}`);
    }
  };

  const renderTopRightUI = () => {
    return (
      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="button"
          onClick={handleLinkDuckDB}
          style={{ padding: '4px 8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Link DuckDB Table
        </button>
        <button type="button"
          onClick={handleExportPNG}
          style={{ padding: '4px 8px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Export PNG
        </button>
        <button type="button"
          onClick={handleExportSVG}
          style={{ padding: '4px 8px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Export SVG
        </button>
      </div>
    );
  };

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        initialData={initialData}
        onChange={handleChange}
        renderTopRightUI={renderTopRightUI}
      />
    </div>
  );
};
