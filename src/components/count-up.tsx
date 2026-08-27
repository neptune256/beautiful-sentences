"use client";

import { useEffect, useState } from "react";

/** 듀오링고식 숫자 카운트업. target이 바뀔 때마다(= key로 리마운트) 0부터 다시 센다. */
export function CountUp({
  target,
  durationMs = 700,
}: {
  target: number;
  durationMs?: number;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target <= 0) {
      setValue(target);
      return;
    }
    const start = performance.now();
    let frame: number;

    function tick(now: number) {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return <>{value}</>;
}
