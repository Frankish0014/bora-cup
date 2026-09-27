import { Button } from "@/components/ui/button";

export function CuppingNavigation({
  isFirst,
  pending,
  onBack,
  onNext,
}: {
  isFirst: boolean;
  pending: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      {isFirst ? null : (
        <Button variant="secondary" className="min-h-12 px-5" onClick={onBack} disabled={pending}>
          Back
        </Button>
      )}
      <Button className="min-h-12 flex-1 text-base" onClick={onNext} disabled={pending}>
        {pending ? "Saving…" : "Save & next"}
      </Button>
    </div>
  );
}
