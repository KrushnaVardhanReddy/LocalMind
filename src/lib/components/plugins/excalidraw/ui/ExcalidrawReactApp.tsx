import React, { useState, useRef } from 'react';
import { Excalidraw, exportToCanvas, exportToSvg } from '@excalidraw/excalidraw';

export interface ExcalidrawReactAppProps {
  initialData?: any;
  onChange?: (elements: readonly any[], appState: any) => void;
  isDark?: boolean;
}

export const ExcalidrawReactApp: React.FC<ExcalidrawReactAppProps> = ({ initialData, onChange, isDark }) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);

  // Debounce saving
  const timeoutRef = useRef<any>(null);

  const handleChange = (elements: readonly any[], appState: any) => {
    if (!onChange) return;
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
        onChange([...elements], appState);
    }, 1000);
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

    const svgStr = new XMLSerializer().serializeToString(svg as unknown as Node);

    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `whiteboard-${Date.now()}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderTopRightUI = () => {
    return (
      <div style={{ display: 'flex', gap: '8px', zIndex: 10 }}>
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
        theme={isDark ? 'dark' : 'light'}
        renderTopRightUI={renderTopRightUI}
      />
    </div>
  );
};
