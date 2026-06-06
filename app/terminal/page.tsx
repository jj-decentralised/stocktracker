import type { Metadata } from "next";
import { TerminalView } from "@/components/terminal/TerminalView";

export const metadata: Metadata = {
  title: "Stock Tracker — Visual Index",
  description:
    "High-density visual index of equities — real-time price action and volume trajectory across global exchanges.",
};

export default function TerminalPage() {
  return <TerminalView />;
}
