import { useEffect, useMemo, useRef, useState } from "react";

function buildSyntheticEvent(name, value) {
  return {
    target: {
      name,
      value
    }
  };
}

export function SearchableSelectInput({
  id,
  name,
  value,
  options,
  onChange,
  placeholder,
  disabled = false,
  emptyLabel = "No matches found.",
  helperText = "Choose a suggested option or keep typing your own."
}) {
  const containerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const normalizedValue = String(value || "").trim().toLowerCase();
  const filteredOptions = useMemo(() => {
    if (!normalizedValue) {
      return options;
    }

    return options.filter((option) => option.label.toLowerCase().includes(normalizedValue));
  }, [normalizedValue, options]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  function applyValue(nextValue) {
    onChange(buildSyntheticEvent(name, nextValue));
    setOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="rounded-2xl border border-zinc-300 bg-white px-3 py-2 transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
        <input
          id={id}
          className="w-full border-0 bg-transparent p-0 text-sm text-zinc-950 outline-none placeholder:text-zinc-400"
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          disabled={disabled}
        />
      </div>

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.14)]">
          <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Suggestions</p>
            <p className="mt-1 text-xs text-zinc-500">{helperText}</p>
          </div>
          <div className="max-h-72 overflow-y-auto py-2">
            {filteredOptions.length ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-emerald-50 ${
                    option.label === value ? "bg-emerald-50 font-semibold text-emerald-900" : "text-zinc-700"
                  }`}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => applyValue(option.label)}
                >
                  <span>{option.label}</span>
                  {option.label === value ? <span className="text-xs font-bold uppercase tracking-[0.14em]">Selected</span> : null}
                </button>
              ))
            ) : (
              <div className="px-4 py-4 text-sm text-zinc-500">{emptyLabel}</div>
            )}
          </div>
          {value ? (
            <button
              className="w-full border-t border-zinc-100 bg-white px-4 py-3 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => applyValue(value)}
            >
              Use “{value}”
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
