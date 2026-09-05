import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Product identity mark. Links home so it doubles as an escape hatch. */
export function Brand({ className }: { className?: string }) {
  return (
    <Link
      href="/overview"
      className={cn("flex items-center", className)}
      aria-label="The Next Gen Store"
    >
      <Image
        src="/core/Next-gen-logo.svg"
        alt="The Next Gen Store"
        width={240}
        height={60}
        priority
        className="h-[80px] w-[240px] object-contain object-center"
      />
    </Link>
  );
}
