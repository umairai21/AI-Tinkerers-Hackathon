// Generates the Convex Auth signing keys and sets them, plus SITE_URL, on a Convex deployment.
//
//   node scripts/setup-auth.mjs                                  dev deployment, http://localhost:3000
//   node scripts/setup-auth.mjs --prod --site-url https://...    production deployment
//
// Running it again rotates the keys, which signs out every existing visitor.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

const args = process.argv.slice(2);
const prod = args.includes("--prod");
const siteUrlIndex = args.indexOf("--site-url");
const siteUrl = siteUrlIndex >= 0 ? args[siteUrlIndex + 1] : prod ? null : "http://localhost:3000";
if (!siteUrl) {
  console.error("Pass --site-url with your public URL when using --prod.");
  process.exit(1);
}

const keys = await generateKeyPair("RS256", { extractable: true });
const privateKey = await exportPKCS8(keys.privateKey);
const publicKey = await exportJWK(keys.publicKey);
const values = {
  JWT_PRIVATE_KEY: privateKey.trimEnd().replace(/\n/g, " "),
  JWKS: JSON.stringify({ keys: [{ use: "sig", ...publicKey }] }),
  SITE_URL: siteUrl,
};

// Call the Convex CLI through node directly so no shell mangles the multi-line key.
const require = createRequire(import.meta.url);
const convexPackage = require.resolve("convex/package.json");
const convexCli = path.join(path.dirname(convexPackage), require(convexPackage).bin.convex);

for (const [name, value] of Object.entries(values)) {
  const result = spawnSync(
    process.execPath,
    [convexCli, "env", "set", `${name}=${value}`, ...(prod ? ["--prod"] : [])],
    { stdio: ["inherit", "inherit", "inherit"] },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}
