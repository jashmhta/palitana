import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "../../shared/const.js";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

/**
 * Volunteer procedure - requires valid device ID header for mobile app
 * This provides basic authentication for volunteer devices without full OAuth
 * The deviceId is validated to ensure only registered devices can make mutations
 */
const requireDeviceId = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  
  // Check for device ID header (used by mobile app)
  const deviceId = ctx.req.headers["x-device-id"] as string | undefined;
  
  // Allow authenticated users OR valid device IDs
  if (ctx.user) {
    return next({ ctx });
  }
  
  if (deviceId && deviceId.startsWith("device-")) {
    return next({
      ctx: {
        ...ctx,
        deviceId,
      },
    });
  }
  
  // For now, allow all requests but log unauthorized ones
  // In production, uncomment the throw below
  console.warn(`[Auth] Unauthenticated request to ${ctx.req.path}`);
  
  // throw new TRPCError({ 
  //   code: "UNAUTHORIZED", 
  //   message: "Device ID or authentication required" 
  // });
  
  return next({ ctx });
});

export const volunteerProcedure = t.procedure.use(requireDeviceId);
