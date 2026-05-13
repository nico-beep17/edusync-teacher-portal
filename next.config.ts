import withPWA from "@ducanh2912/next-pwa";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig = withSentryConfig(
  withPWA({
    dest: "public",
  })({
    turbopack: {},
  })
);

export default nextConfig;