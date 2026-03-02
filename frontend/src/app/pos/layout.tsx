import { Metadata } from "next";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = { title: "POS Terminal – NPMX POS" };

export default function POSLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
