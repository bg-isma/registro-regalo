import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

const pages = process.env.GITHUB_PAGES === "true";

export default defineConfig({
  site: "https://bg-isma.github.io",
  base: pages ? "/registro-regalo" : "/",
  trailingSlash: "always",
  devToolbar: { enabled: false },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
