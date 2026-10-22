import { Check } from "lucide-react";

const STEPS = ["Details", "Design", "Review", "Send"] as const;

/** Active step is a filled forest circle; completed steps are clickable unless the quote is already created. */
export default function Stepper({
  step,
  maxStep,
  locked,
  onGo,
}: {
  step: number;
  maxStep: number;
  locked: boolean;
  onGo: (s: number) => void;
}) {
  return (
    <ol aria-label="Quote steps" className="flex items-center gap-1 sm:gap-3">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step || (n <= maxStep && !active);
        const clickable = !locked && !active && n <= maxStep && n < 4;
        const circle = (
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
              active ? "border-forest bg-forest text-on-forest" : done ? "border-forest text-forest" : "border-line text-muted"
            }`}
          >
            {done && !active ? <Check aria-hidden size={14} strokeWidth={2.5} /> : n}
          </span>
        );
        return (
          <li key={label} className="flex items-center gap-1 sm:gap-3">
            {i > 0 && <span aria-hidden className={`h-px w-3 sm:w-8 ${n <= maxStep ? "bg-forest/50" : "bg-line"}`} />}
            {clickable ? (
              <button type="button" onClick={() => onGo(n)} className="flex items-center gap-2 rounded-lg p-1 text-sm">
                {circle}
                <span className="hidden sm:inline">{label}</span>
                <span className="sr-only sm:hidden">{`Step ${n}: ${label}`}</span>
              </button>
            ) : (
              <span aria-current={active ? "step" : undefined} className={`flex items-center gap-2 p-1 text-sm ${active ? "font-semibold" : "text-muted"}`}>
                {circle}
                <span className={active ? "" : "hidden sm:inline"}>{label}</span>
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
