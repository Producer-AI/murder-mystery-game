import type * as React from "react";

import { cn } from "@/lib/utils";

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: This primitive forwards htmlFor to the consuming form field.
    <label
      className={cn(
        "text-[0.7rem] font-medium tracking-[0.3em] text-foreground/70 uppercase",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
