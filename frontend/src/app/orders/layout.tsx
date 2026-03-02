import { Metadata } from "next";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = { title: "Orders – NPMX POS" };

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
