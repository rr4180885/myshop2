// Vercel serverless function entry point
const handler = require("../dist/index.cjs");

module.exports = handler.default || handler;
