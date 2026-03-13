/**
 * Generated `api` utility.
 *
 * This dynamic stub keeps local TypeScript working before the Convex project is
 * linked. Run `npx convex dev` to replace it with the fully generated version.
 */

import type { ComponentApi as BetterAuthComponentApi } from "@convex-dev/better-auth/_generated/component.js";
import type { AnyApi, AnyComponents } from "convex/server";
import { anyApi, componentsGeneric } from "convex/server";

export const api: AnyApi = anyApi;
export const internal: AnyApi = anyApi;
export const components = componentsGeneric() as unknown as AnyComponents & {
  betterAuth: BetterAuthComponentApi<"betterAuth">;
};
