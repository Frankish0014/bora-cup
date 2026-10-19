"use client";

import { CommentsField } from "@/components/cupping/CommentsField";
import { RatingSelector } from "@/components/cupping/RatingSelector";
import { revealRating } from "@/components/cupping/useKeyboardInset";
import {
  COE_ATTRIBUTES,
  CVA_INTENSITIES,
  CVA_TAGS,
  ROASTERY_ATTRIBUTES,
  SCA_ATTRIBUTES,
  type CuppingDraft,
  type FormTypeId,
} from "@/lib/forms";
import { cn } from "@/lib/utils";

export function ProtocolFields({
  coffeeId,
  draft,
  onChange,
}: {
  coffeeId: string;
  draft: CuppingDraft;
  onChange: (partial: Partial<CuppingDraft> | { payload: Record<string, unknown> }) => void;
}) {
  if (draft.formType === "bora") {
    return (
      <div className="space-y-2.5 sm:space-y-4">
        <CommentsField
          id={`${coffeeId}-aroma`}
          label="Aroma"
          placeholder="Aroma notes"
          value={draft.aroma}
          onChange={(aroma) => onChange({ aroma })}
        />
        <CommentsField
          id={`${coffeeId}-flavor`}
          label="Flavor"
          placeholder="Flavor notes"
          value={draft.flavor}
          onChange={(flavor) => onChange({ flavor })}
        />
        <CommentsField
          id={`${coffeeId}-overall`}
          label="Overall"
          placeholder="Overall impression"
          value={draft.overall}
          onChange={(overall) => onChange({ overall })}
          onFocus={() => revealRating(coffeeId)}
        />
        <div id={`rating-${coffeeId}`} className="scroll-mt-28 scroll-mb-[calc(8rem+var(--keyboard-inset,0px))]">
          <RatingSelector label="Rating" group={`${coffeeId}-rating`} value={draft.score} onChange={(score) => onChange({ score })} />
        </div>
      </div>
    );
  }

  if (draft.formType === "sca_traditional") {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
          {SCA_ATTRIBUTES.map((attribute) => (
            <NumberPick
              key={attribute.key}
              label={attribute.label}
              hint={attribute.hint}
              value={numberOrNull(draft.payload[attribute.key])}
              options={attribute.key === "uniformity" || attribute.key === "cleanCup" || attribute.key === "sweetness" ? CUP_POINTS : SCA_POINTS}
              onChange={(value) => onChange({ payload: { ...draft.payload, [attribute.key]: value } })}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumberPick
            label="Taint cups"
            hint="−2 each"
            value={numberOrNull(draft.payload.taintCups) ?? 0}
            options={CUP_COUNTS}
            onChange={(value) => onChange({ payload: { ...draft.payload, taintCups: value } })}
          />
          <NumberPick
            label="Fault cups"
            hint="−4 each"
            value={numberOrNull(draft.payload.faultCups) ?? 0}
            options={CUP_COUNTS}
            onChange={(value) => onChange({ payload: { ...draft.payload, faultCups: value } })}
          />
        </div>
        <CommentsField id={`${coffeeId}-notes`} label="Cup notes" placeholder="Descriptors and defects" value={draft.overall} onChange={(overall) => onChange({ overall })} />
      </div>
    );
  }

  if (draft.formType === "sca_cva") {
    const tags = Array.isArray(draft.payload.tags) ? (draft.payload.tags as string[]) : [];
    return (
      <div className="space-y-3">
        <p className="text-[11px] text-ink-mute">Starts at 0. Each selected intensity and preference averages into the lot score.</p>
        <div className="grid grid-cols-2 gap-2">
          {CVA_INTENSITIES.map((item) => (
            <NumberPick
              key={item.key}
              label={item.label}
              hint="0–15"
              value={numberOrNull(draft.payload[item.key])}
              options={CVA_POINTS}
              onChange={(value) => onChange({ payload: { ...draft.payload, [item.key]: value } })}
            />
          ))}
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-ink-soft">Check-all-that-apply</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {CVA_TAGS.map((tag) => {
              const on = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    onChange({
                      payload: {
                        ...draft.payload,
                        tags: on ? tags.filter((item) => item !== tag) : [...tags, tag],
                      },
                    })
                  }
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px]",
                    on ? "border-leaf bg-leaf text-white" : "border-line bg-foam text-ink-soft",
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
        <NumberPick
          label="Preference"
          hint="9-point hedonic scale"
          value={numberOrNull(draft.payload.hedonic)}
          options={HEDONIC}
          onChange={(value) => onChange({ payload: { ...draft.payload, hedonic: value } })}
        />
        <CommentsField id={`${coffeeId}-cva-notes`} label="Notes" placeholder="Descriptive notes" value={draft.overall} onChange={(overall) => onChange({ overall })} />
      </div>
    );
  }

  if (draft.formType === "coe") {
    return (
      <div className="space-y-3">
        <p className="text-[11px] text-ink-mute">Starts at 0. The 36-point base is added with the first attribute, then each score adds on.</p>
        <div className="grid grid-cols-2 gap-2">
          {COE_ATTRIBUTES.map((attribute) => (
            <NumberPick
              key={attribute.key}
              label={attribute.label}
              hint="0–8"
              value={numberOrNull(draft.payload[attribute.key])}
              options={COE_POINTS}
              onChange={(value) => onChange({ payload: { ...draft.payload, [attribute.key]: value } })}
            />
          ))}
        </div>
        <CommentsField id={`${coffeeId}-coe-notes`} label="Notes" placeholder="Cup comments" value={draft.overall} onChange={(overall) => onChange({ overall })} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {ROASTERY_ATTRIBUTES.map((attribute) => (
          <NumberPick
            key={attribute.key}
            label={attribute.label}
            hint="6–10"
            value={numberOrNull(draft.payload[attribute.key])}
            options={SCA_POINTS}
            onChange={(value) => onChange({ payload: { ...draft.payload, [attribute.key]: value } })}
          />
        ))}
      </div>
      <CommentsField id={`${coffeeId}-roastery-notes`} label="Notes" placeholder="Roastery notes" value={draft.overall} onChange={(overall) => onChange({ overall })} />
    </div>
  );
}

export function formBadge(formType: FormTypeId) {
  if (formType === "bora") return "Bora sheet";
  if (formType === "sca_traditional") return "SCA Traditional";
  if (formType === "sca_cva") return "SCA CVA";
  if (formType === "coe") return "Cup of Excellence";
  return "Roastery scorecard";
}

function NumberPick({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number | null;
  options: number[];
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium text-ink-soft">{label}</span>
      {hint ? <span className="block text-[10px] text-ink-mute">{hint}</span> : null}
      <select
        className="mt-1 min-h-10 w-full rounded-lg border border-line bg-foam px-2 text-sm text-ink"
        value={value == null ? "" : String(value)}
        onChange={(event) => {
          if (!event.target.value) return;
          onChange(Number(event.target.value));
        }}
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {Number.isInteger(option) ? option : option.toFixed(2)}
          </option>
        ))}
      </select>
    </label>
  );
}

function numberOrNull(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

const SCA_POINTS = Array.from({ length: 17 }, (_, index) => Math.round((6 + index * 0.25) * 100) / 100);
const CUP_POINTS = [0, 2, 4, 6, 8, 10];
const CUP_COUNTS = [0, 1, 2, 3, 4, 5];
const CVA_POINTS = Array.from({ length: 16 }, (_, index) => index);
const HEDONIC = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const COE_POINTS = Array.from({ length: 17 }, (_, index) => Math.round(index * 0.5 * 10) / 10);
