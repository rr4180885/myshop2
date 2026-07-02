// Vercel serverless function entry point
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const handler = require("../dist/index.cjs");

export default handler.default || handler;
