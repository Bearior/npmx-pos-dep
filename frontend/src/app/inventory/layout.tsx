import { Metadata } from "next";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = { title: "Inventory – NPMX POS" };

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
