import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Banner } from "@/components/Banner";
import { SpreadDashboard } from "@/components/SpreadDashboard";

export default function Home() {
  return (
    <>
      <Header />
      <Banner
        eyebrow="Hyperliquid × Wall Street"
        title={
          <>
            Live Spreads,
            <br />
            On-Chain vs. Wall Street
          </>
        }
        subtitle="Real-time aggregate data across venues. Each card overlays the live Hyperliquid price against the traditional-market price — the gap is the spread. Premium when Hyperliquid trades above, discount when below."
      />
      <main className="flex-1 py-2">
        <SpreadDashboard />
      </main>
      <Footer />
    </>
  );
}
