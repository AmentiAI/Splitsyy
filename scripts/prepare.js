/* eslint-disable @typescript-eslint/no-require-imports */
// Skip husky install in CI/Vercel environments
if (process.env.CI === "true" || process.env.VERCEL === "1") {
  console.log("Skipping husky install in CI/Vercel environment");
  process.exit(0);
}

// Run husky install for local development
const { execSync } = require("child_process");
try {
  execSync("husky install", { stdio: "inherit" });
} catch {
  // Silently fail if husky isn't available
  process.exit(0);
}
