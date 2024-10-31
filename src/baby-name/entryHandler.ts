import { NextApiRequest, NextApiResponse } from "next";
import { getStatus, Routes } from "./utils";
import { compose, validateMethod } from "./middlewares";

const entryHandler = (routes: Routes) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const path = req.query.path as string[];
    const route = routes[path[0]];
    const method = route.method;

    if (!route) {
      return getStatus("NOT_FOUND", res);
    }

    const { handler, middlewares = [] } = route;

    try {
      return compose(validateMethod(method), ...middlewares)(handler)(req, res);
    } catch (error) {
      return getStatus("INTERNAL_SERVER_ERROR", res);
    }
  };
};

export default entryHandler;
