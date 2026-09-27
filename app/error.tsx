"use client";

import { Button } from "@/components/ui/button";
import { StatusScreen } from "@/components/shared/StatusScreen";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <StatusScreen eyebrow="Error" title="Something went wrong" message="The page hit an unexpected problem. Try again, and if it keeps happening let the organizers know.">
      <Button onClick={reset}>Try again</Button>
    </StatusScreen>
  );
}
