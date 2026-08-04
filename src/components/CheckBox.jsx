// A single tappable tick box. Large touch target for the 7am-cereal case.
// `color` tints the filled state to the owning person; `title` names who ticked.
export default function CheckBox({ done, color, title, disabled, onToggle }) {
  return (
    <button
      type="button"
      className={`checkbox${done ? ' checkbox--done' : ''}`}
      style={done && color ? { background: color, borderColor: color } : undefined}
      aria-pressed={done}
      title={title}
      disabled={disabled}
      onClick={() => onToggle(!done)}
    >
      {done ? (
        <svg viewBox="0 0 16 16" aria-hidden="true" className="checkbox-tick">
          <path
            d="M13 4.5 6.5 11 3 7.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </button>
  )
}
