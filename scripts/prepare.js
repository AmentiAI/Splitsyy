/* eslint-disable @typescript-eslint/no-require-imports */
// Skip husky install in CI/Vercel environments
// This script runs during npm install, so we need to be very defensive
const isCI =
  process.env.CI === "true" ||
  process.env.VERCEL === "1" ||
  process.env.VERCEL_ENV ||
  process.env.NOW_REGION ||
  !process.env.USER; // Vercel doesn't set USER

if (isCI) {
  // Exit immediately in CI/Vercel - don't even try to run husky
  process.exit(0);
}

// Only run husky in local development
const { execSync } = require("child_process");
try {
  execSync("husky install", {
    stdio: "inherit",
  });
} catch {
  // Silently fail - this is OK
  process.exit(0);
}
