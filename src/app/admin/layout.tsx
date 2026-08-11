import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IXA Owner Hub",
  description: "Privater Arbeitsbereich von IXA-Leads.",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    noimageindex: true,
    nocache: true,
  },
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
