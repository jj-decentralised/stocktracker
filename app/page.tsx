import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SpreadDashboard } from "@/components/SpreadDashboard";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1 py-2">
        <SpreadDashboard />
      </main>
      <Footer />
    </>
  );
}
