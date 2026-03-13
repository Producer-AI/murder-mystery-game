import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";

import { components } from "./_generated/api";
import authConfig from "./auth.config";

export const authComponent = createClient(components.betterAuth);

export const createAuth = (
  ctx: Parameters<typeof authComponent.adapter>[0],
) => {
  return betterAuth({
    database: authComponent.adapter(ctx),
    baseURL: process.env.SITE_URL,
    basePath: "/api/auth",
    emailAndPassword: {
      enabled: true,
    },
    plugins: [
      username(),
      convex({
        authConfig,
      }),
    ],
  });
};

export const { getAuthUser } = authComponent.clientApi();
