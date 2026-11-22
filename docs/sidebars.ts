import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docs: [
    {
      type: "category",
      label: "Getting Started",
      collapsed: false,
      items: [
        "getting-started/prerequisites",
        "getting-started/setup",
        "getting-started/environment",
        "getting-started/first-launch",
        "getting-started/verify",
      ],
    },
    {
      type: "category",
      label: "Developer Guide",
      items: [
        "developer-guide/project-structure",
        "developer-guide/where-to-add-code",
        "developer-guide/frontend",
        "developer-guide/backend",
        "developer-guide/authentication",
        "developer-guide/communication",
        "developer-guide/dev-vs-prod",
        "developer-guide/docker",
        "developer-guide/make-commands",
        "developer-guide/wifi-testing",
        "developer-guide/troubleshooting",
      ],
    },
    {
      type: "category",
      label: "Contribution Guidelines",
      items: [
        "contributing/git-workflow",
        "contributing/commit-messages",
        "contributing/pull-requests",
        "contributing/coding-conventions",
        "contributing/naming",
        "contributing/dependencies",
      ],
    },
    {
      type: "category",
      label: "Documentation Guide",
      items: [
        "documentation/organization",
        "documentation/new-page",
        "documentation/new-category",
        "documentation/updating",
        "documentation/markdown",
        "documentation/preview-and-build",
        "documentation/contributing",
      ],
    },
  ],
};

export default sidebars;
