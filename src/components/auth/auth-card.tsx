"use client";

import { ArrowRight, Fingerprint, KeyRound, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

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
  username: string;
  email: string;
  password: string;
};

const initialLoginState: LoginFormState = {
  identifier: "",
  password: "",
};

const initialSignupState: SignupFormState = {
  username: "",
  email: "",
  password: "",
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
          username: identifier,
          password,
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
      password,
      name: username,
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
    <section className="relative isolate w-full max-w-5xl overflow-hidden border border-white/10 bg-card/80 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
      <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative overflow-hidden border-b border-white/10 px-8 py-10 lg:border-r lg:border-b-0 lg:px-12 lg:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(202,161,78,0.18),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.03),transparent_58%)]" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div className="space-y-6">
              <p className="text-[0.68rem] tracking-[0.45em] text-primary/75 uppercase">
                Blackwood Archive
              </p>
              <div className="space-y-4">
                <h1 className="font-display text-5xl leading-none tracking-[0.03em] text-foreground sm:text-6xl">
                  Enter the case files.
                </h1>
                <p className="max-w-md text-sm leading-7 text-foreground/72 sm:text-base">
                  The house is quiet, the witnesses are scattered, and the
                  ledger only opens for invited names. Use a private username
                  and password to step inside the investigation.
                </p>
              </div>
            </div>

            <div className="grid gap-4 text-sm text-foreground/74 sm:grid-cols-2">
              <article className="border border-white/10 bg-black/15 p-4">
                <Fingerprint className="mb-4 size-5 text-primary" />
                <p className="font-medium text-foreground">
                  Private identities
                </p>
                <p className="mt-2 leading-6">
                  Sign in with either your username or your email. The session
                  is tied to Convex from the first request.
                </p>
              </article>
              <article className="border border-white/10 bg-black/15 p-4">
                <KeyRound className="mb-4 size-5 text-primary" />
                <p className="font-medium text-foreground">One simple flow</p>
                <p className="mt-2 leading-6">
                  No providers, no recovery steps, no profile editing yet. Just
                  entry and exit for the first playable build.
                </p>
              </article>
            </div>
          </div>
        </div>

        <div className="px-8 py-10 lg:px-12 lg:py-14">
          <div className="space-y-8">
            <div className="space-y-5">
              <div className="inline-flex border border-white/10 bg-black/20 p-1">
                {(["login", "signup"] as const).map((value) => (
                  <button
                    type="button"
                    key={value}
                    className={cn(
                      "min-w-32 px-4 py-2 text-xs font-medium tracking-[0.28em] uppercase transition-colors",
                      mode === value
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground/60 hover:text-foreground",
                    )}
                    onClick={() => {
                      setMode(value);
                      setErrorMessage(null);
                    }}
                  >
                    {value === "login" ? "Log In" : "Create Account"}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <h2 className="font-display text-3xl text-foreground">
                  {isLogin ? "Return to the manor" : "Open a new dossier"}
                </h2>
                <p className="text-sm leading-7 text-foreground/66">
                  {isLogin
                    ? "Use the identity already assigned to you."
                    : "Create a username, add your email, and secure it with a password."}
                </p>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {isLogin ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="identifier">Username or Email</Label>
                    <div className="relative">
                      <UserRound className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-foreground/40" />
                      <Input
                        id="identifier"
                        autoComplete="username"
                        className="pl-11"
                        placeholder="detective.blackwood"
                        value={loginForm.identifier}
                        onChange={(event) =>
                          setLoginForm((current) => ({
                            ...current,
                            identifier: event.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-foreground/40" />
                      <Input
                        id="login-password"
                        autoComplete="current-password"
                        className="pl-11"
                        placeholder="••••••••"
                        type="password"
                        value={loginForm.password}
                        onChange={(event) =>
                          setLoginForm((current) => ({
                            ...current,
                            password: event.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="signup-username">Username</Label>
                    <div className="relative">
                      <Fingerprint className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-foreground/40" />
                      <Input
                        id="signup-username"
                        autoComplete="username"
                        className="pl-11"
                        placeholder="detective.blackwood"
                        value={signupForm.username}
                        onChange={(event) =>
                          setSignupForm((current) => ({
                            ...current,
                            username: event.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <UserRound className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-foreground/40" />
                      <Input
                        id="signup-email"
                        autoComplete="email"
                        className="pl-11"
                        placeholder="you@blackwoodhouse.com"
                        type="email"
                        value={signupForm.email}
                        onChange={(event) =>
                          setSignupForm((current) => ({
                            ...current,
                            email: event.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-foreground/40" />
                      <Input
                        id="signup-password"
                        autoComplete="new-password"
                        className="pl-11"
                        placeholder="Choose something memorable"
                        type="password"
                        value={signupForm.password}
                        onChange={(event) =>
                          setSignupForm((current) => ({
                            ...current,
                            password: event.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-3 pt-2">
                <Button
                  className="h-12 w-full rounded-none bg-primary text-primary-foreground hover:bg-primary/85"
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

                {errorMessage ? (
                  <p className="border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm leading-6 text-destructive">
                    {errorMessage}
                  </p>
                ) : null}

                <p className="text-xs leading-6 text-foreground/50">
                  {isLogin
                    ? "If your identifier includes @, this screen treats it as an email sign-in."
                    : "Your username is also used as your display name for now."}
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
