"use client";

import {
  ArrowRight,
  KeyRound,
  ScrollText,
  Shield,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import {
  MysteryPanel,
  SectionEyebrow,
  StatusPill,
} from "@/components/game/mystery-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "signup";

type LoginFormState = {
  identifier: string;
  password: string;
};

type SignupFormState = {
  email: string;
  password: string;
  username: string;
};

const initialLoginState: LoginFormState = {
  identifier: "",
  password: "",
};

const initialSignupState: SignupFormState = {
  email: "",
  password: "",
  username: "",
};

function getAuthErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") {
    return "Unable to complete the request.";
  }

  const message =
    "message" in error && typeof error.message === "string"
      ? error.message
      : "statusText" in error && typeof error.statusText === "string"
        ? error.statusText
        : null;

  return message || "Unable to complete the request.";
}

export function AuthCard() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [loginForm, setLoginForm] = useState(initialLoginState);
  const [signupForm, setSignupForm] = useState(initialSignupState);

  const isLogin = mode === "login";

  const handleSuccess = () => {
    startTransition(() => {
      router.push("/dashboard");
      router.refresh();
    });
  };

  const handleLogin = async () => {
    const identifier = loginForm.identifier.trim();
    const password = loginForm.password;

    const result = identifier.includes("@")
      ? await authClient.signIn.email({
          email: identifier,
          password,
        })
      : await authClient.signIn.username({
          password,
          username: identifier,
        });

    if (result.error) {
      setErrorMessage(getAuthErrorMessage(result.error));
      return;
    }

    handleSuccess();
  };

  const handleSignup = async () => {
    const username = signupForm.username.trim();
    const email = signupForm.email.trim();
    const password = signupForm.password;

    const result = await authClient.signUp.email({
      email,
      name: username,
      password,
      username,
    });

    if (result.error) {
      setErrorMessage(getAuthErrorMessage(result.error));
      return;
    }

    handleSuccess();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsPending(true);

    try {
      if (isLogin) {
        await handleLogin();
      } else {
        await handleSignup();
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <MysteryPanel className="p-6 sm:p-8 lg:p-10" tone="dark">
        <div className="flex h-full flex-col justify-between gap-10">
          <div className="space-y-6">
            <SectionEyebrow>Host Login</SectionEyebrow>
            <div className="space-y-4">
              <h1 className="font-display text-5xl leading-none text-[var(--mystery-gold)] sm:text-6xl">
                Stage the case, then run the room in real time.
              </h1>
              <p className="max-w-xl text-sm leading-7 text-current/70 sm:text-base">
                This side is for the host. Sign in to create a game, build
                rounds, write the answer key, and keep standings on the admin
                side only.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: ScrollText,
                title: "Private key",
                text: "Questions, accepted variants, and scoring stay on the admin side only.",
              },
              {
                icon: Shield,
                title: "Live pacing",
                text: "Start and end full rounds with live guest updates and automatic scoring when a round closes.",
              },
              {
                icon: UserRound,
                title: "Guest-first entry",
                text: "Players join from phones with only a username and an optional room password.",
              },
            ].map(({ icon: Icon, text, title }) => (
              <article
                key={title}
                className="border border-white/8 bg-white/4 p-4"
              >
                <Icon className="mb-4 size-4 text-[var(--mystery-gold)]" />
                <p className="text-sm uppercase tracking-[0.28em] text-current/60">
                  {title}
                </p>
                <p className="mt-3 text-sm leading-7 text-current/68">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </MysteryPanel>

      <MysteryPanel className="p-6 sm:p-8 lg:p-10" tone="cream">
        <div className="space-y-8 text-[var(--mystery-ink)]">
          <div className="space-y-5">
            <div className="inline-flex border border-[var(--mystery-crimson)]/16 bg-[rgba(139,32,32,0.04)] p-1">
              {(["login", "signup"] as const).map((value) => (
                <button
                  key={value}
                  className={cn(
                    "min-w-32 px-4 py-2 text-xs font-medium tracking-[0.28em] uppercase transition-colors",
                    mode === value
                      ? "bg-[var(--mystery-crimson)] text-[var(--mystery-cream)]"
                      : "text-[var(--mystery-crimson)]/55 hover:text-[var(--mystery-crimson)]",
                  )}
                  onClick={() => {
                    setErrorMessage(null);
                    setMode(value);
                  }}
                  type="button"
                >
                  {value === "login" ? "Log In" : "Create Account"}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <SectionEyebrow className="text-[var(--mystery-crimson)]">
                {isLogin ? "Return to the control room" : "Register the host"}
              </SectionEyebrow>
              <h2 className="font-display text-4xl leading-none">
                {isLogin
                  ? "Open the dashboard."
                  : "Create your admin identity."}
              </h2>
              <p className="text-sm leading-7 text-[var(--mystery-ink)]/68">
                Guests never see this screen. They join from a direct room link
                later with just a username.
              </p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {isLogin ? (
              <>
                <div className="space-y-2">
                  <Label
                    className="text-[var(--mystery-crimson)]/72"
                    htmlFor="identifier"
                  >
                    Username or Email
                  </Label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[var(--mystery-crimson)]/35" />
                    <Input
                      autoComplete="username"
                      className="border-[var(--mystery-crimson)]/20 bg-[rgba(139,32,32,0.04)] pl-11 text-[var(--mystery-ink)] focus:border-[var(--mystery-crimson)]/70"
                      id="identifier"
                      onChange={(event) =>
                        setLoginForm((current) => ({
                          ...current,
                          identifier: event.target.value,
                        }))
                      }
                      placeholder="host.blackwood"
                      required
                      value={loginForm.identifier}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    className="text-[var(--mystery-crimson)]/72"
                    htmlFor="login-password"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[var(--mystery-crimson)]/35" />
                    <Input
                      autoComplete="current-password"
                      className="border-[var(--mystery-crimson)]/20 bg-[rgba(139,32,32,0.04)] pl-11 text-[var(--mystery-ink)] focus:border-[var(--mystery-crimson)]/70"
                      id="login-password"
                      onChange={(event) =>
                        setLoginForm((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                      placeholder="••••••••"
                      required
                      type="password"
                      value={loginForm.password}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label
                    className="text-[var(--mystery-crimson)]/72"
                    htmlFor="signup-username"
                  >
                    Username
                  </Label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[var(--mystery-crimson)]/35" />
                    <Input
                      autoComplete="username"
                      className="border-[var(--mystery-crimson)]/20 bg-[rgba(139,32,32,0.04)] pl-11 text-[var(--mystery-ink)] focus:border-[var(--mystery-crimson)]/70"
                      id="signup-username"
                      onChange={(event) =>
                        setSignupForm((current) => ({
                          ...current,
                          username: event.target.value,
                        }))
                      }
                      placeholder="host.blackwood"
                      required
                      value={signupForm.username}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    className="text-[var(--mystery-crimson)]/72"
                    htmlFor="signup-email"
                  >
                    Email
                  </Label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[var(--mystery-crimson)]/35" />
                    <Input
                      autoComplete="email"
                      className="border-[var(--mystery-crimson)]/20 bg-[rgba(139,32,32,0.04)] pl-11 text-[var(--mystery-ink)] focus:border-[var(--mystery-crimson)]/70"
                      id="signup-email"
                      onChange={(event) =>
                        setSignupForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      placeholder="host@blackwoodhouse.com"
                      required
                      type="email"
                      value={signupForm.email}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    className="text-[var(--mystery-crimson)]/72"
                    htmlFor="signup-password"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[var(--mystery-crimson)]/35" />
                    <Input
                      autoComplete="new-password"
                      className="border-[var(--mystery-crimson)]/20 bg-[rgba(139,32,32,0.04)] pl-11 text-[var(--mystery-ink)] focus:border-[var(--mystery-crimson)]/70"
                      id="signup-password"
                      onChange={(event) =>
                        setSignupForm((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                      placeholder="Choose something memorable"
                      required
                      type="password"
                      value={signupForm.password}
                    />
                  </div>
                </div>
              </>
            )}

            {errorMessage ? (
              <p className="border border-[var(--mystery-crimson)]/20 bg-[rgba(139,32,32,0.08)] px-4 py-3 text-sm leading-6 text-[var(--mystery-crimson)]">
                {errorMessage}
              </p>
            ) : null}

            <Button
              className="h-12 w-full rounded-none border-[var(--mystery-crimson)] bg-[var(--mystery-crimson)] tracking-[0.2em] uppercase hover:bg-[color:color-mix(in_srgb,var(--mystery-crimson)_86%,black)]"
              disabled={isPending}
              type="submit"
            >
              {isPending
                ? isLogin
                  ? "Checking credentials..."
                  : "Creating account..."
                : isLogin
                  ? "Enter Dashboard"
                  : "Create Account"}
              <ArrowRight className="size-4" />
            </Button>

            <div className="flex flex-wrap items-center gap-2 text-xs leading-6 text-[var(--mystery-ink)]/55">
              <StatusPill
                className="text-[var(--mystery-crimson)]"
                tone="muted"
              >
                host only
              </StatusPill>
              {isLogin
                ? "Use your existing Better Auth identity."
                : "This account becomes the admin for the games you create."}
            </div>
          </form>
        </div>
      </MysteryPanel>
    </section>
  );
}
