import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/client.ts", "src/chat.ts", "src/types.ts"],
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: true
}); 