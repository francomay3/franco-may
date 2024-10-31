import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import z from "zod";
import { getStatus } from "./utils";
import admin from "@/config/firebase-admin";

export const compose = (...middlewares: MiddlewareFunction[]) => {
  return (handler: NextApiHandler): NextApiHandler => {
    return middlewares.reduceRight((acc, middleware) => {
      return middleware(acc);
    }, handler);
  };
};
export type MiddlewareFunction = (handler: NextApiHandler) => NextApiHandler;

type WithAuth = (options?: {
  withSelfOnly?: boolean;
  adminOnly?: boolean;
}) => MiddlewareFunction;

export const withAuth: WithAuth = (options = {}) => {
  const { withSelfOnly, adminOnly } = options || {};

  return (handler) => {
    return async (req, res) => {
      const tokenSchema = z.string().min(20);
      const tokenResult = tokenSchema.safeParse(
        req.headers.authorization?.split("Bearer ")[1]
      );
      if (!tokenResult.success) {
        return getStatus("VALIDATION_ERROR", res, tokenResult.error.message);
      }
      const token = req.headers.authorization?.split("Bearer ")[1];

      if (!token) {
        return getStatus("NO_TOKEN", res);
      }

      try {
        const decodedToken = await admin.auth().verifyIdToken(token);

        if (!decodedToken) {
          return getStatus("INVALID_TOKEN", res);
        }

        const email = decodedToken.email || "";
        const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
        const isAdmin = adminEmails?.includes(email) || false;

        if (adminOnly && !isAdmin) {
          return getStatus("ADMIN_ONLY", res);
        }

        const decodedUid = decodedToken.uid;
        const requestedUid = req.body.uid;
        const isActingOnOwnData = decodedUid === requestedUid;

        if (!isAdmin && withSelfOnly && !isActingOnOwnData) {
          return getStatus("SELF_ONLY", res);
        }

        return handler(req, res);
      } catch (error) {
        return getStatus("UNAUTHORIZED", res);
      }
    };
  };
};

type ValidateBody = (schema: z.ZodSchema) => MiddlewareFunction;

export const validateBody: ValidateBody = (schema) => {
  return (handler: NextApiHandler) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      try {
        const result = schema.safeParse(req.body);
        if (!result.success) {
          return getStatus("VALIDATION_ERROR", res, result.error.message);
        }

        return handler(req, res);
      } catch (error) {
        return getStatus("INTERNAL_SERVER_ERROR", res);
      }
    };
  };
};
