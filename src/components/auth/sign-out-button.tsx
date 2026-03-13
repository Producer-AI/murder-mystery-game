"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleSignOut = async () => {
    setIsPending(true);

    try {
      await authClient.signOut();
      startTransition(() => {
        router.push("/");
        router.refresh();
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button
      className="h-11 rounded-none border-white/10 bg-white/5 px-4 tracking-[0.18em] uppercase text-foreground hover:bg-white/10"
      disabled={isPending}
      onClick={handleSignOut}
      variant="outline"
    >
      <LogOut className="size-4" />
      {isPending ? "Signing out..." : "Sign out"}
    </Button>
  );
}
