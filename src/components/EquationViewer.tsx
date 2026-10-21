import React, { useMemo } from "react";
import katex from "katex";

interface EquationViewerProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
}

export const EquationViewer: React.FC<EquationViewerProps> = ({
  latex,
  displayMode = false,
  className = "",
}) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex, {
        displayMode,
        throwOnError: false,
      });
    } catch (e) {
      return latex;
    }
  }, [latex, displayMode]);

  return (
    <span
      className={`inline-block select-none overflow-x-auto ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
