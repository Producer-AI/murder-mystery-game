"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Tone = "cream" | "crimson" | "dark";

const pageToneClasses: Record<Tone, string> = {
  cream:
    "bg-[linear-gradient(145deg,rgba(250,246,241,1)_0%,rgba(245,237,228,1)_45%,rgba(250,246,241,1)_100%)] text-[var(--mystery-ink)]",
  crimson:
    "bg-[linear-gradient(145deg,rgba(114,24,24,1)_0%,rgba(147,29,29,1)_35%,rgba(91,16,16,1)_100%)] text-[var(--mystery-cream)]",
  dark: "bg-[linear-gradient(145deg,rgba(26,10,10,1)_0%,rgba(39,14,14,1)_35%,rgba(13,5,5,1)_100%)] text-[var(--mystery-gold)]",
};

const panelToneClasses: Record<Tone, string> = {
  cream:
    "border-[color:rgba(139,32,32,0.14)] bg-[rgba(255,252,247,0.72)] text-[var(--mystery-ink)] shadow-[0_24px_80px_rgba(91,16,16,0.08)]",
  crimson:
    "border-[color:rgba(250,246,241,0.2)] bg-[rgba(255,255,255,0.06)] text-[var(--mystery-cream)] shadow-[0_24px_80px_rgba(0,0,0,0.24)]",
  dark: "border-[color:rgba(212,165,116,0.14)] bg-[rgba(17,7,7,0.62)] text-[var(--mystery-gold)] shadow-[0_24px_80px_rgba(0,0,0,0.42)]",
};

const ornamentToneClasses: Record<Tone, string> = {
  cream: "border-[color:rgba(139,32,32,0.24)]",
  crimson: "border-[color:rgba(250,246,241,0.24)]",
  dark: "border-[color:rgba(212,165,116,0.24)]",
};

export function MysteryPage({
  children,
  className,
  tone = "dark",
}: {
  children: ReactNode;
  className?: string;
  tone?: Tone;
}) {
  return (
    <main
      className={cn(
        "relative min-h-screen overflow-hidden",
        pageToneClasses[tone],
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_top_left,rgba(212,165,116,0.12),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(139,32,32,0.12),transparent_32%),linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:auto,auto,120px_120px,120px_120px]" />
      <div className="pointer-events-none absolute inset-3 border border-white/5 sm:inset-5" />
      <CornerOrnaments tone={tone} />
      <div className="relative">{children}</div>
    </main>
  );
}

export function MysteryPanel({
  children,
  className,
  tone = "dark",
}: {
  children: ReactNode;
  className?: string;
  tone?: Tone;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden border p-5 backdrop-blur-md sm:p-6",
        panelToneClasses[tone],
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-current/35 to-transparent opacity-70" />
      {children}
    </section>
  );
}

export function StatusPill({
  children,
  className,
  tone = "gold",
}: {
  children: ReactNode;
  className?: string;
  tone?: "gold" | "muted" | "red";
}) {
  const toneClass =
    tone === "red"
      ? "border-[color:rgba(255,255,255,0.18)] bg-[rgba(139,32,32,0.18)] text-[var(--mystery-cream)]"
      : tone === "muted"
        ? "border-white/10 bg-white/5 text-current/70"
        : "border-[color:rgba(212,165,116,0.16)] bg-[rgba(212,165,116,0.1)] text-[var(--mystery-gold)]";

  return (
    <span
      className={cn(
        "inline-flex items-center border px-3 py-1 text-[0.62rem] font-medium tracking-[0.32em] uppercase",
        toneClass,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SectionEyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[0.68rem] tracking-[0.45em] uppercase opacity-60",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function DisplayTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h1
      className={cn(
        "font-display text-4xl leading-none sm:text-5xl",
        className,
      )}
    >
      {children}
    </h1>
  );
}

export function StatTile({
  label,
  tone = "dark",
  value,
}: {
  label: string;
  tone?: Tone;
  value: ReactNode;
}) {
  return (
    <MysteryPanel className="p-4 sm:p-5" tone={tone}>
      <p className="text-[0.68rem] tracking-[0.35em] uppercase opacity-55">
        {label}
      </p>
      <div className="mt-3 text-2xl leading-tight">{value}</div>
    </MysteryPanel>
  );
}

function CornerOrnaments({ tone }: { tone: Tone }) {
  const sharedClassName = cn(
    "absolute size-14 border-current/20 opacity-70",
    ornamentToneClasses[tone],
  );

  return (
    <>
      <span className={cn(sharedClassName, "top-4 left-4 border-t border-l")} />
      <span
        className={cn(sharedClassName, "top-4 right-4 border-t border-r")}
      />
      <span
        className={cn(sharedClassName, "bottom-4 left-4 border-b border-l")}
      />
      <span
        className={cn(sharedClassName, "right-4 bottom-4 border-r border-b")}
      />
    </>
  );
}
