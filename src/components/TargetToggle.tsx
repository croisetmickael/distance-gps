export type Target = "A" | "B";

interface Props {
  value: Target;
  onChange: (t: Target) => void;
}

/** Choix du point que le prochain toucher sur la carte va placer. */
export default function TargetToggle({ value, onChange }: Props) {
  return (
    <div className="target" role="radiogroup" aria-label="Le prochain toucher sur la carte place">
      <span>Toucher la carte place</span>
      {(["A", "B"] as const).map((t) => (
        <button
          key={t}
          type="button"
          role="radio"
          aria-checked={value === t}
          className={`target-${t.toLowerCase()}${value === t ? " is-active" : ""}`}
          onClick={() => onChange(t)}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
