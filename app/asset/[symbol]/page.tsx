import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AssetDetail } from "@/components/AssetDetail";
import { ASSETS, isCategory, type Category } from "@/lib/universe";

interface Props {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ category?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { symbol } = await params;
  const asset = ASSETS.find((a) => a.symbol === symbol.toUpperCase());
  if (!asset) return { title: "Not found — The Spread" };
  return {
    title: `${asset.symbol} · ${asset.name} — The Spread`,
    description: `Live Hyperliquid vs. Wall Street price and spread for ${asset.name} (${asset.symbol}).`,
  };
}

export default async function AssetPage({ params, searchParams }: Props) {
  const { symbol } = await params;
  const { category: categoryParam } = await searchParams;
  const sym = symbol.toUpperCase();

  // Prefer the asset within the requested category; otherwise first match.
  const asset =
    ASSETS.find(
      (a) =>
        a.symbol === sym &&
        (!isCategory(categoryParam) || a.category === categoryParam),
    ) ?? ASSETS.find((a) => a.symbol === sym);

  if (!asset) notFound();

  const category: Category = isCategory(categoryParam)
    ? categoryParam
    : asset.category;

  return (
    <>
      <Header />
      <main className="flex-1">
        <AssetDetail
          symbol={asset.symbol}
          name={asset.name}
          category={category}
          unit={asset.unit}
        />
      </main>
      <Footer />
    </>
  );
}
