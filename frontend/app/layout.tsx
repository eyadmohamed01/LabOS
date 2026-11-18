import type { Metadata } from "next";
import type { ReactNode } from "react";
import { themeInitializationScript } from "../lib/theme";

import "./globals.css";

export const metadata: Metadata = {
  title: "Overview · LabOS",
  description: "Operational dashboard for university research groups.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeInitializationScript }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
