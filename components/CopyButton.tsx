"use client";

import { useState } from "react";

/** Copies text to the clipboard. `getText` runs on click so it can read window.location. */
export default function CopyButton({
  getText,
  label,
  className = "btn",
}: {
  getText: () => string;
  label: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");

  async function copy() {
    const text = getText();
    try {
      await navigator.clipboard.writeText(text);
      setState("done");
    } catch {
      // Older browsers or blocked clipboard: fall back to a hidden textarea.
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      setState(ok ? "done" : "failed");
    }
    window.setTimeout(() => setState("idle"), 2500);
  }

  return (
    <>
      <button type="button" className={className} onClick={copy}>
        {label}
      </button>
      <span role="status" className="sr-only">
        {state === "done" ? "Copied" : state === "failed" ? "Copy failed" : ""}
      </span>
      {state === "done" && <span className="text-sm text-ok">Copied. Paste it in WhatsApp.</span>}
      {state === "failed" && (
        <span className="text-sm text-danger">Couldn&apos;t copy. Select the text and copy it yourself.</span>
      )}
    </>
  );
}
