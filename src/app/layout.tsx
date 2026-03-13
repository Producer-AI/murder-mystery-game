import type { Metadata } from "next";

import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import { getToken } from "@/lib/auth-server";
import { cn } from "@/lib/utils";

import "./globals.css";

export const metadata: Metadata = {
  title: "Blackwood Archive",
  description:
    "Simple Better Auth and Convex sign in for the murder mystery app.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialToken = await getToken();

  return (
    <html lang="en" className="bg-background">
      <body
        className={cn(
          "min-h-screen bg-background font-sans text-foreground antialiased",
        )}
      >
        <ConvexClientProvider initialToken={initialToken ?? null}>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
