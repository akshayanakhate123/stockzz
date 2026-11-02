import type { Metadata } from "next";
import { COMPANIES, SECTORS } from "@/content/market";
import { Card, LinkButton, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <>
      <PageHeader eyebrow="About" title="Why Stockzz exists">
        Most people learn investing from tips and definitions. Stockzz lets you practise deciding under uncertainty, safely, with paper money, and
        then shows you whether your reasoning was sound, separately from whether you got lucky.
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-extrabold">How it works</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
            <li>Eleven short lessons, each with a worked example, an interactive lab and a quick check.</li>
            <li>A ten-round simulation: fictional news, ₹1,00,000 of virtual cash, eight fictional companies.</li>
            <li>Before each decision you state your reasoning and the main risk you see.</li>
            <li>Prices follow a fixed script, identical for everyone, so results reflect decisions rather than randomness.</li>
            <li>Debriefs and a final report score reasoning, risk awareness, diversification, consistency and understanding.</li>
          </ol>
        </Card>
        <Card>
          <h2 className="text-lg font-extrabold">The fictional market</h2>
          <ul className="mt-3 divide-y divide-line text-sm">
            {COMPANIES.map((c) => (
              <li key={c.ticker} className="flex justify-between gap-3 py-1.5">
                <span className="font-semibold">{c.name}</span>
                <span className="text-muted">{SECTORS[c.sector].name}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">All companies, prices and news events are invented for learning. Any resemblance to real companies is coincidental.</p>
        </Card>
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-extrabold">Important</h2>
          <p className="mt-2 text-sm text-muted">
            Stockzz is an educational tool. It is not investment advice, it does not connect to any broker, and simulated performance does not predict
            real-world results. Talk to a SEBI-registered adviser before making real investment decisions.
          </p>
          <LinkButton href="/learn" className="mt-4">
            Start learning
          </LinkButton>
        </Card>
      </div>
    </>
  );
}
