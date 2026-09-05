"use client";

import { useState, useRef, useEffect, ReactNode } from "react";

interface ResizablePanelProps {
  children: ReactNode;
  direction: "horizontal" | "vertical";
  initialSize?: number;
  minSize?: number;
  maxSize?: number;
  onResize?: (size: number) => void;
}

export function ResizablePanel({
  children,
  direction,
  initialSize = 50,
  minSize = 20,
  maxSize = 80,
  onResize,
}: ResizablePanelProps) {
  const [size, setSize] = useState(initialSize);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const container = containerRef.current.parentElement;
      if (!container) return;

      if (direction === "horizontal") {
        const containerWidth = container.offsetWidth;
        const newSize = (e.clientX / containerWidth) * 100;
        const clampedSize = Math.max(minSize, Math.min(maxSize, newSize));
        setSize(clampedSize);
        onResize?.(clampedSize);
      } else {
        const containerHeight = container.offsetHeight;
        const newSize = (e.clientY / containerHeight) * 100;
        const clampedSize = Math.max(minSize, Math.min(maxSize, newSize));
        setSize(clampedSize);
        onResize?.(clampedSize);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = direction === "horizontal" ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, direction, minSize, maxSize, onResize]);

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{
        [direction === "horizontal" ? "width" : "height"]: `${size}%`,
      }}
    >
      {children}
      <div
        onMouseDown={handleMouseDown}
        className={`absolute ${
          direction === "horizontal"
            ? "right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 bg-gray-600 transition"
            : "bottom-0 left-0 right-0 h-1 cursor-row-resize hover:bg-blue-500 bg-gray-600 transition"
        } ${isResizing ? "bg-blue-500" : ""}`}
        style={{
          [direction === "horizontal" ? "right" : "bottom"]: "-2px",
          zIndex: 10,
        }}
      />
    </div>
  );
}

