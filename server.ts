import { createPagesFunctionHandler } from "@remix-run/cloudflare-pages";
import * as build from "@remix-run/dev/server-build";

const handleRequest = createPagesFunctionHandler({
  build,
  mode: process.env.NODE_ENV,
  getLoadContext: (context) => ({
    cloudflare: {
      env: context.env,
      cf: context.request.cf,
      ctx: context.waitUntil.bind(context),
    },
  }),
});

export const onRequest = handleRequest;