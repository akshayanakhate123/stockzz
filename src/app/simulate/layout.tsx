import type { Metadata } from "next";
import { TickerTape } from "@/components/ticker-tape";

export const metadata: Metadata = { title: "Simulation" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TickerTape />
      {children}
    </>
  );
}
