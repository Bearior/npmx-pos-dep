import { Metadata } from "next";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = { title: "Tables – NPMX POS" };

export default function TablesLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
