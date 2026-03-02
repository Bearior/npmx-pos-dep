import { Metadata } from "next";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = { title: "Reports – NPMX POS" };

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
