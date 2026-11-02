import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ROUNDS } from "@/content/rounds";
import { Debrief } from "./debrief";

export function generateStaticParams() {
  return ROUNDS.map((r) => ({ round: String(r.id) }));
}

export async function generateMetadata({ params }: { params: Promise<{ round: string }> }): Promise<Metadata> {
  const { round } = await params;
  return { title: `Round ${round} debrief` };
}

export default async function ReviewPage({ params }: { params: Promise<{ round: string }> }) {
  const { round } = await params;
  const id = Number(round);
  if (!ROUNDS.some((r) => r.id === id)) notFound();
  return <Debrief roundId={id} />;
}
