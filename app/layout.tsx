import type { Metadata } from "next";
import "./globals.css";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { NavigationLoader } from "@/components/admin/NavigationLoader";

export const metadata: Metadata = {
  title: "Invitation Creator",
  description: "Create your digital wedding invitation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <NavigationLoader />
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}

