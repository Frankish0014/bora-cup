import { buttonClasses } from "@/components/ui/button";
import { StatusScreen } from "@/components/shared/StatusScreen";
import Link from "next/link";

export default function NotFound() {
  return (
    <StatusScreen eyebrow="404" title="Page not found" message="That page is not part of this cupping.">
      <Link href="/" className={buttonClasses("primary")}>
        Back home
      </Link>
    </StatusScreen>
  );
}
