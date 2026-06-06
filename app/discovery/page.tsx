import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DiscoveryBoard } from "@/components/DiscoveryBoard";

export const metadata: Metadata = {
  title: "Price Discovery — The Spread",
  description:
    "A benchmark of how accurately Hyperliquid's off-hours price predicts the next regular session open — across stocks.",
};

export default function DiscoveryPage() {
  return (
    <>
      <Header />
      <main className="flex-1 py-2">
        <DiscoveryBoard />
      </main>
      <Footer />
    </>
  );
}
