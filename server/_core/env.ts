export const ENV = {
  appId: process.env.VITE_APP_ID ?? "standalone-app",
  cookieSecret: process.env.JWT_SECRET ?? "change-this-secret-in-production-min-32-chars",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "https://example.com",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "system-owner",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "https://example.com",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "not-configured",
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "not-configured",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? "not-configured",
};
