"use client";

import { controlClasses } from "@/components/ui/field";
import { COUNTRIES } from "@/lib/countries";
import { cn } from "@/lib/utils";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

export function CountrySelect({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const listId = useId();
  const [text, setText] = useState(value);
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const query = editing ? text : value;

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const source = needle ? COUNTRIES.filter((country) => country.toLowerCase().includes(needle)) : COUNTRIES;
    return source.slice(0, 8);
  }, [query]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  function choose(country: string) {
    onChange(country);
    setText(country);
    setEditing(false);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <span className="mb-2 block text-sm font-medium text-ink" id={`${listId}-label`}>
        Country
      </span>
      <span className="relative block">
        <input
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-labelledby={`${listId}-label`}
          aria-invalid={Boolean(error)}
          className={cn(controlClasses, "pr-11")}
          value={query}
          placeholder="Search for a country"
          autoComplete="off"
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setEditing(true);
            setText(event.target.value);
            setOpen(true);
            setActiveIndex(0);
            if (COUNTRIES.includes(event.target.value as (typeof COUNTRIES)[number])) onChange(event.target.value);
            else onChange("");
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((index) => Math.min(index + 1, Math.max(matches.length - 1, 0)));
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
            }
            if (event.key === "Enter" && open && matches[activeIndex]) {
              event.preventDefault();
              choose(matches[activeIndex]);
            }
            if (event.key === "Escape") setOpen(false);
          }}
        />
        <ChevronDown
          size={18}
          aria-hidden="true"
          className={cn("pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-ink-mute transition", open ? "rotate-180" : "")}
        />
      </span>
      {error ? (
        <span className="mt-2 block text-sm text-danger" role="alert">
          {error}
        </span>
      ) : null}
      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-line bg-foam p-1.5 shadow-float animate-fade"
        >
          {matches.length === 0 ? <li className="px-3 py-3 text-sm text-ink-soft">No matching country</li> : null}
          {matches.map((country, index) => (
            <li key={country} role="option" aria-selected={country === value}>
              <button
                type="button"
                className={cn(
                  "flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-base",
                  index === activeIndex ? "bg-paper-2 text-ink" : "text-ink hover:bg-paper",
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(country)}
              >
                {country}
                {country === value ? <Check size={16} aria-hidden="true" className="text-leaf" /> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
