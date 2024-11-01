import { NextApiHandler, NextApiResponse } from "next";
import { MiddlewareFunction } from "./middlewares";

const StatusMap: Record<string, { message: string; status: number }> = {
  VALIDATION_ERROR: {
    message: "Validation error",
    status: 400,
  },
  INTERNAL_SERVER_ERROR: {
    message: "An unexpected error occurred",
    status: 500,
  },
  ADMIN_ONLY: {
    message: "Only administrators can perform this action",
    status: 403,
  },
  INVALID_TOKEN: {
    message: "The provided authentication token is invalid",
    status: 401,
  },
  NO_TOKEN: {
    message: "No authentication token was provided",
    status: 401,
  },
  SELF_ONLY: {
    message: "You can only modify your own data",
    status: 403,
  },
  UNAUTHORIZED: {
    message: "You are not authorized to perform this action",
    status: 401,
  },
  NOT_FOUND: {
    message: "Endpoint not found",
    status: 404,
  },
  METHOD_NOT_ALLOWED: {
    message: "Method not allowed",
    status: 405,
  },
  CREATED: {
    status: 201,
    message: "Resource created successfully",
  },
  READ: {
    status: 200,
    message: "Resource retrieved successfully",
  },
  UPDATED: {
    status: 200,
    message: "Resource updated successfully",
  },
  DELETED: {
    status: 200,
    message: "Resource deleted successfully",
  },
};

export const getStatus = (
  type: keyof typeof StatusMap,
  res: NextApiResponse,
  data?: any
) => {
  const status = StatusMap[type];
  if (status.status > 299) {
    return res
      .status(status.status)
      .json({ ...status, code: type, message: status.message + ": " + data });
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
