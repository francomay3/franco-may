import { NextApiHandler, NextApiResponse } from "next";
import { MiddlewareFunction } from "./middlewares";

const StatusMap = {
  VALIDATION_ERROR: {
    error: "Validation error",
    status: 400,
    ok: false,
  },
  INTERNAL_SERVER_ERROR: {
    error: "An unexpected error occurred",
    status: 500,
    ok: false,
  },
  ADMIN_ONLY: {
    error: "Only administrators can perform this action",
    status: 403,
    ok: false,
  },
  INVALID_TOKEN: {
    error: "The provided authentication token is invalid",
    status: 401,
    ok: false,
  },
  NO_TOKEN: {
    error: "No authentication token was provided",
    status: 401,
    ok: false,
  },
  SELF_ONLY: {
    error: "You can only modify your own data",
    status: 403,
    ok: false,
  },
  UNAUTHORIZED: {
    error: "You are not authorized to perform this action",
    status: 401,
    ok: false,
  },
  NOT_FOUND: {
    error: "Endpoint not found",
    status: 404,
    ok: false,
  },
  METHOD_NOT_ALLOWED: {
    error: "Method not allowed",
    status: 405,
    ok: false,
  },
  CREATED: {
    status: 201,
    message: "Resource created successfully",
    ok: true,
  },
  READ: {
    status: 200,
    message: "Resource retrieved successfully",
    ok: true,
  },
  UPDATED: {
    status: 200,
    message: "Resource updated successfully",
    ok: true,
  },
  DELETED: {
    status: 200,
    message: "Resource deleted successfully",
    ok: true,
  },
};

export const getStatus = (
  type: keyof typeof StatusMap,
  res: NextApiResponse,
  data?: any
) => {
  const status = StatusMap[type];
  if (!status.ok) {
    return res
      .status(status.status)
      .json({ ...status, code: type, message: data });
  }
  return res.status(status.status).json({ ...status, code: type, data });
};

export type Route = {
  method: Method;
  handler: NextApiHandler;
  middlewares?: MiddlewareFunction[];
};

export type Routes = Record<string, Route>;

export type Method = "GET" | "POST" | "PATCH" | "DELETE";
