"use client";

import { useState, type ReactNode } from "react";

export function ExpandableText({
  text,
  clampLines = 4,
  className = "",
  children,
}: {
  text: string;
  clampLines?: number;
  className?: string;
  children?: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <p
        className={`whitespace-pre-wrap ${className}`}
        style={
          expanded
            ? undefined
            : {
                display: "-webkit-box",
                WebkitLineClamp: clampLines,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
        }
      >
        {text}
      </p>
      {expanded && children}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-1 text-xs font-semibold text-black/50 underline hover:text-black"
      >
        {expanded ? "접기" : "전체 글 + 평가 보기"}
      </button>
    </div>
  );
}
