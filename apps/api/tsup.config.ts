import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./src/index.ts"],
  // The workspace packages (`@repo/*`) ship as raw `.ts` source with no build
  // step, so they must be transpiled/bundled into dist. Everything else (real
  // npm deps) stays external and is resolved from node_modules at runtime.
  noExternal: [/^@repo\//],
  format: ["cjs"],
  target: "node20",
  splitting: false,
  bundle: true,
  outDir: "./dist",
  clean: true,
  loader: { ".json": "copy" },
  // Minify off to keep stack traces readable when debugging the bundled output.
  minify: false,
  sourcemap: false,
});
