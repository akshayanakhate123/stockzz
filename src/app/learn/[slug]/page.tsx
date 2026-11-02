import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LESSON, LESSONS } from "@/content/lessons";
import { LessonPlayer } from "./player";

export function generateStaticParams() {
  return LESSONS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const l = LESSON[slug];
  return l ? { title: l.title, description: l.summary } : {};
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!LESSON[slug]) notFound();
  return <LessonPlayer slug={slug} />;
}
