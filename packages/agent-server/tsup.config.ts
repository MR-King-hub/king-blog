import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  // workspace 包必须打进产物，服务器上没有 monorepo
  noExternal: ["@approval-channel/core", "@blog/shared"],
});
