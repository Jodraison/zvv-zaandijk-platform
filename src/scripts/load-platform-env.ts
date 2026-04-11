import { config } from "dotenv";
import { resolve } from "path";

/** Eerste import in seed-scripts: laadt `.env` dan `.env.local` (overschrijft). */
const root = process.cwd();
config({ path: resolve(root, ".env") });
config({ path: resolve(root, ".env.local"), override: true });
