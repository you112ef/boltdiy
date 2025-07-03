/// <reference types="@remix-run/dev" />
/// <reference types="@remix-run/cloudflare" />
/// <reference types="@cloudflare/workers-types" />

declare module "@remix-run/cloudflare" {
  interface AppLoadContext {
    cloudflare: {
      env: {
        // Add your environment variables here
        [key: string]: any;
      };
      cf: IncomingRequestCfProperties;
      ctx: ExecutionContext;
    };
  }
}