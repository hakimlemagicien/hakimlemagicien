// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { createRequire } from "node:module";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const require = createRequire(import.meta.url);

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },

  vite: {
    resolve: {
      alias: {
        tslib: require.resolve("tslib/tslib.es6.mjs"),
      },
    },
    ssr: {
      noExternal: ["tslib", "@radix-ui/react-dialog"],
    },
  },

  nitro: {
    preset: "vercel",
    output: {
      dir: ".vercel/output",
      serverDir: ".vercel/output/functions/__server.func",
      publicDir: ".vercel/output/static",
    },
    noExternals: ["tslib", "@radix-ui/react-dialog"],
    traceDeps: ["tslib"],
    externals: {
      inline: ["tslib", "@radix-ui/react-dialog"],
    },
  },
});
