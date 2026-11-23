import { annotate } from "../analyzer/annotate.ts";
import type { AnalysisResult, Finding, LinkCheck, LinkFlag, ReportChannel } from "../analyzer/types.ts";
import { useI18n } from "../i18n.tsx";
import { copyText } from "../lib/copy.ts";
import { CEKREKENING_URL } from "../official.ts";
import type { KnownSender } from "../storage.ts";
import { IconCopy, IconExternal } from "./icons.tsx";
import { SaveSenderForm } from "./known-senders.tsx";
import { RiskBar, Stamp } from "./stamp.tsx";

function focusReason(id: string | undefined) {
  if (!id) return;
  const el = document.getElementById(`reason-${id}`);
  if (!el) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
  el.focus();
}

function Annotated({ text, findings }: { text: string; findings: readonly Finding[] }) {
  const segments = annotate(text, findings);
  const numbers = new Map(findings.map((finding, index) => [finding.id, index + 1]));
  return (
    <p class="annotated mono">
      {segments.map((segment, index) => {
        if (segment.level === "none") return <span key={index}>{segment.text}</span>;
        const nums = segment.findingIds
          .map((id) => numbers.get(id))
          .filter((num): num is number => typeof num === "number");
        return (
          <button
            key={index}
            type="button"
            class={`mark mark--${segment.level}`}
            onClick={() => focusReason(segment.findingIds[0])}
          >
            {segment.text}
            {nums.length > 0 ? <sup>{nums.join(" ")}</sup> : null}
          </button>
        );
      })}
    </p>
  );
}

function FlagChips({ link }: { link: LinkCheck }) {
  const { t } = useI18n();
  if (link.flags.length === 0) {
    return <span class="chip chip--outline">{t("result.nothingFlagged")}</span>;
  }
  return (
    <>
      {link.flags.map((flag) => (
        <FlagChip key={flag} flag={flag} domain={link.lookalikeOf} />
      ))}
    </>
  );
}

function FlagChip({ flag, domain }: { flag: LinkFlag; domain?: string }) {
  const { t } = useI18n();
  if (flag === "known_bad") return <span class="chip chip--red">{t("flag.known_bad")}</span>;
  if (flag === "lookalike") {
    return <span class="chip chip--hl">{t("flag.lookalike", { domain: domain ?? "" })}</span>;
  }
  if (flag === "shortened") return <span class="chip chip--hl">{t("flag.short")}</span>;
  return <span class="chip chip--hl">{t("flag.tld")}</span>;
}

function formatDate(value: number, lang: "en" | "id"): string {
  return new Intl.DateTimeFormat(lang === "id" ? "id-ID" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function ResultView({
  result,
  known,
  onReport,
  onEscalate,
  onSaveSender,
  onNew,
  onEdit,
  onToast,
}: {
  result: AnalysisResult;
  known: readonly KnownSender[];
  onReport: () => void;
  onEscalate: () => void;
  onSaveSender: (input: { raw: string; channels: ReportChannel[]; note: string }) => void;
  onNew: () => void;
  onEdit: () => void;
  onToast: (message: string) => void;
}) {
  const { lang, t } = useI18n();
  const verdict = result.verdict;
  const hasChecks = result.links.length + result.accounts.length + result.phones.length > 0;

  async function copyValue(value: string) {
    const ok = await copyText(value);
    onToast(ok ? t("result.copied") : t("result.copyFail"));
  }

  return (
    <article class="card result" id="result-heading" tabIndex={-1}>
      <h2 class="sr-only">{t("live.result", { verdict: t(`verdict.${verdict}`), score: String(result.score) })}</h2>
      {result.repeat ? (
        <div class="repeat-banner" id="repeat-banner">
          <p class="stamp stamp--likely_scam stamp--enter">{t("repeat.word")}</p>
          <p class="repeat-copy">
            {t("repeat.banner", { date: formatDate(result.repeat.firstReportedAt, lang) })}
          </p>
          <p class="why-line">{t("why.matters")}</p>
          <button type="button" class="btn btn--primary" onClick={onEscalate}>
            {t("repeat.follow")}
          </button>
        </div>
      ) : null}
      <div class="result-head">
        <Stamp verdict={verdict} animate />
        <p class="score mono" aria-hidden="true">
          {result.score}/100
        </p>
      </div>
      <RiskBar score={result.score} verdict={verdict} />
      <p class="summary" id="result-summary" tabIndex={-1} aria-live="polite">
        {t(`summary.${verdict}`)}
      </p>

      <h3 class="kicker">{t("result.message")}</h3>
      <Annotated text={result.input} findings={result.findings} />

      <h3 class="kicker">{t("result.why")}</h3>
      {result.findings.length === 0 ? (
        <p class="muted">{t("result.none")}</p>
      ) : (
        <ol class="reasons">
          {result.findings.map((finding, index) => (
            <li key={finding.id} id={`reason-${finding.id}`} class="reason" tabIndex={-1}>
              <div class="reason-top">
                <span class="reason-no mono">{index + 1}</span>
                <span class={finding.level === "scam" ? "chip chip--red" : "chip chip--hl"}>
                  {t(`cat.${finding.category}`)}
                </span>
              </div>
              <p>{t(finding.explanationId, finding.params)}</p>
              <blockquote class="mono">“{finding.evidence}”</blockquote>
            </li>
          ))}
        </ol>
      )}

      <h3 class="kicker">{t("result.checks")}</h3>
      {!hasChecks ? <p class="muted">{t("result.noChecks")}</p> : null}
      <div class="check-list">
        {result.links.map((link) => (
          <div key={`${link.start}-${link.raw}`} class="check-row">
            <p class="check-kicker">{t("link.kind")}</p>
            {/* Pasted links stay plain text. Do not wrap this in an anchor. */}
            <p class="mono check-value">{link.raw}</p>
            <div class="chips">
              <FlagChips link={link} />
            </div>
            <button type="button" class="btn btn--secondary" onClick={() => copyValue(link.raw)}>
              <IconCopy />
              {t("result.copy")}
            </button>
          </div>
        ))}
        {result.accounts.map((account) => (
          <div key={`${account.start}-${account.number}`} class="check-row">
            <p class="check-kicker">{t("account.kind")}</p>
            <p class="mono check-value">{account.number}</p>
            <a class="btn btn--secondary" href={CEKREKENING_URL} target="_blank" rel="noopener noreferrer">
              {t("result.accountAction")}
              <IconExternal />
              <span class="sr-only">({t("result.newTab")})</span>
            </a>
            <p class="caption">{t("result.accountCaption")}</p>
          </div>
        ))}
        {result.phones.map((phone) => (
          <div key={`${phone.start}-${phone.number}`} class="check-row">
            <p class="check-kicker">{t("phone.kind")}</p>
            <p class="mono check-value">{phone.number}</p>
          </div>
        ))}
      </div>

      <details class="how">
        <summary>{t("result.how")}</summary>
        <ul class="breakdown mono">
          {result.breakdown.map((part) => (
            <li key={part.id}>
              <span>
                {part.id === "combo" ? t("part.combo") : part.id === "repeat" ? t("part.repeat") : t(`cat.${part.id}`)}
              </span>
              <span>+{part.points}</span>
            </li>
          ))}
        </ul>
        {result.uncapped > 100 ? (
          <p class="small">
            {t("result.capped")} ({result.uncapped})
          </p>
        ) : null}
        <p class="small muted">{t("result.once")}</p>
      </details>

      <SaveSenderForm key={result.input} text={result.input} known={known} onSave={onSaveSender} />
      <p class="disclaimer">{t("disclaimer")}</p>

      <div class="actions">
        {verdict === "likely_scam" ? (
          <button type="button" class="btn btn--primary" onClick={onReport}>
            {t("report.prepare")}
          </button>
        ) : null}
        {verdict === "suspicious" ? (
          <button type="button" class="btn btn--secondary" onClick={onReport}>
            {t("report.anyway")}
          </button>
        ) : null}
        <button type="button" class="btn btn--text" onClick={onNew}>
          {t("input.new")}
        </button>
        <button type="button" class="btn btn--text" onClick={onEdit}>
          {t("input.edit")}
        </button>
      </div>
    </article>
  );
}
