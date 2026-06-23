import { spawnSync } from "node:child_process";
import process from "node:process";

const result = spawnSync(
  process.execPath,
  ["scripts/prepare-real-uat-session.mjs"],
  { stdio: "inherit" },
);

process.exit(result.status ?? 1);
