import { randomUUID } from "crypto";
import pino from "pino";
import { pinoHttp } from "pino-http";

const isProd = process.env.NODE_ENV === "production";

export const logger = pino({
  level: isProd ? "info" : "debug",
  transport: isProd
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "yyyy-mm-dd HH:MM:ss",
          singleLine: true,
        },
      },
});
export const loggerHttp = pinoHttp({
  logger: logger,
  genReqId: () => randomUUID(),
  customLogLevel: (req, res, err) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  serializers: {
    req(req) {
      return { method: req.method, url: req.url, reqId: req.id };
    },
    res(res) {
      return { statusCode: res.statusCode };
    },
  },
});
