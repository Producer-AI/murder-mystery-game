import type * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-12 w-full rounded-none border border-border/70 bg-black/20 px-4 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-colors outline-none placeholder:text-muted-foreground/75 focus:border-primary/80 focus:bg-black/30 focus-visible:ring-2 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      type={type}
      {...props}
    />
  );
}

export { Input };
