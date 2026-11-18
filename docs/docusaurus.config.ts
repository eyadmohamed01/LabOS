import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";
import { themes as prismThemes } from "prism-react-renderer";

const config: Config = {
  title: "LabOS",
  tagline: "Developer documentation",
  favicon: "img/favicon.svg",
  url: "https://eyadmohamed01.github.io",
  baseUrl: "/",
  future: {
    experimental_router: "hash",
  },
  organizationName: "eyadmohamed01",
  projectName: "LabOS",
  onBrokenLinks: "throw",
  onBrokenAnchors: "throw",
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },
  presets: [
    [
      "classic",
      {
        docs: {
          path: "pages",
          routeBasePath: "/",
          sidebarPath: "./sidebars.ts",
          editUrl: "https://github.com/eyadmohamed01/LabOS/tree/main/docs/pages/",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    navbar: {
      title: "LabOS",
    },
    footer: {
      style: "dark",
      copyright: "LabOS developer documentation",
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
