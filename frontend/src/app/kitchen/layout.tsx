import { Metadata } from "next";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = { title: "Kitchen Display – NPMX POS" };

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
