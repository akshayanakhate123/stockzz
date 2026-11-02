import { Term } from "./glossary";
import { Icon } from "./icons";

/** Plain-language summary of how rounds are scored. Collapsed by default. */
export function ScoringExplainer() {
  const rows = [
    { name: "Decision reasoning", how: "Half from the reasoning you picked, half from how sensible your trades were, judged only on what you knew before the outcome." },
    { name: "Risk awareness", how: "70% from the main risk you named, 30% from whether any position or sector was bigger than your profile allows." },
    { name: "Diversification", how: "How many industries your invested money is spread across. Skipped when less than 15% is invested." },
    { name: "Consistency", how: "Did your action (buy, sell or hold) match the reasoning you chose?" },
    { name: "Understanding", how: "Whether you got the lesson quizzes and debrief checks right on the first try." },
  ];
  return (
    <details className="group rounded-xl border border-line bg-surface p-4 text-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-bold">
        <span className="flex items-center gap-2">
          <Icon name="info" size={16} className="text-brand" /> How you're scored
        </span>
        <Icon name="chevronRight" size={16} className="text-muted transition-transform group-open:rotate-90" />
      </summary>
      <p className="mt-3 text-muted">
        Profit is shown but never scored, a good decision can lose money and a poor one can get lucky. Each score runs 0–100: <b className="text-up">80+</b>{" "}
        strong, <b className="text-brand">55–79</b> developing, <b className="text-down">below 55</b> needs work. "Classified as" is the closest typical approach to
        what you did, which drives the feedback you see.
      </p>
      <dl className="mt-3 divide-y divide-line">
        {rows.map((r) => (
          <div key={r.name} className="py-2 sm:grid sm:grid-cols-[160px_1fr] sm:gap-3">
            <dt className="font-semibold">{r.name === "Consistency" ? <Term id="consistency">Consistency</Term> : r.name}</dt>
            <dd className="text-muted">{r.how}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
