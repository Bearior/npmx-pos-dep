import { Metadata } from "next";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = { title: "Discounts – NPMX POS" };

export default function DiscountsLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
