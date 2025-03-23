import { defineConfig } from "vitepress";
import { scanDir } from "./utils.mts";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "emile",
  description: "A 2D typescript game engine built for the web to make multiplayer game development easy",
  markdown: {
    theme: {
      light: "catppuccin-latte",
      dark: "catppuccin-mocha",
    },
  },
  ignoreDeadLinks: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Docs", link: "/docs/index.html" },
      { text: "Examples", link: "/examples/index.html" },
    ],

    sidebar: [
      {
        text: "Examples",
        items: [{ text: "Welcome", link: "/examples/index.html" }],
      },
      {
        text: "Docs",
        items: [
          { text: "Welcome", link: "/docs/index.html" },
          {
            text: "Engine API",
            link: "/docs/api/engine/README.html",
            collapsed: true,
            items: scanDir("../docs/api/engine"),
          },
          {
            text: "Game API",
            link: "/docs/api/game/README.html",
            collapsed: true,
            items: scanDir("../docs/api/game"),
          },
        ],
      },
      {
        text: "Contributing",
        items: [{ text: "How To Contribute", link: "/contributing/index.html" }],
      },
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/freddie-nelson/emile" }],
  },
});
