import type { Metadata } from "next";
import { ItemPage, itemMetadata } from "@/lib/itemPage";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return itemMetadata((await params).slug, "app");
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <ItemPage slug={(await params).slug} kind="app" />;
}
