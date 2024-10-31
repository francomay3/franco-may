import { NextApiRequest, NextApiResponse } from "next";
import { getStatus, Routes } from "./utils";
import { compose } from "./middlewares";

const handler = (routes: Routes) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Methods", "GET, POST");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Authorization, Content-Type"
      );
      return res.status(200).end();
    }

    const path = req.query.path as string[];
    const route = routes[path[0]];

    if (!route) {
      return getStatus("NOT_FOUND", res);
    }

    const { handler, middlewares } = route;

    if (route.method !== req.method) {
      return getStatus("METHOD_NOT_ALLOWED", res);
    }

    try {
      return compose(...(middlewares || []))(handler)(req, res);
    } catch (error) {
      return getStatus("INTERNAL_SERVER_ERROR", res);
    }
  };
};

export default handler;
