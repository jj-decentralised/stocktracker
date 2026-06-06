import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Banner } from "@/components/Banner";
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
      <Banner
        eyebrow="Price-discovery benchmark"
        title={
          <>
            How accurately does Hyperliquid
            <br />
            price stocks while Wall Street sleeps?
          </>
        }
        subtitle="For each stock we take Hyperliquid's last off-hours price before the opening bell and compare it to what the regular market actually did — measuring how good its overnight price discovery really is."
      />
      <main className="flex-1 py-2">
        <DiscoveryBoard />
      </main>
      <Footer />
    </>
  );
}
