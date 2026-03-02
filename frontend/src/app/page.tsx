import { redirect } from "next/navigation";

/**
 * Root page – redirects to the POS terminal.
 */
export default function Home() {
  redirect("/pos");
}
