import { buildEscalationDraft, providerForSender, providerFormUrl } from "../analyzer/senders.ts";
import type { AnalysisResult } from "../analyzer/types.ts";
import { useI18n } from "../i18n.tsx";
import { copyText } from "../lib/copy.ts";
import { CEKREKENING_URL, IASC_URL, PATROLI_SIBER_URL } from "../official.ts";
import { IconArrowLeft, IconExternal } from "./icons.tsx";

function formatDate(value: number, lang: "en" | "id"): string {
  return new Intl.DateTimeFormat(lang === "id" ? "id-ID" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function EscalationView({
  result,
  onBack,
  onToast,
}: {
  result: AnalysisResult;
  onBack: () => void;
  onToast: (message: string) => void;
}) {
  const { lang, t } = useI18n();
  const repeat = result.repeat;
  if (!repeat) return null;
  const provider = providerForSender(repeat.kind, repeat.key);
  const formUrl = providerFormUrl(provider);
  const reportedOn = formatDate(repeat.firstReportedAt, lang);
  const channels = repeat.channels.map((channel) => t(`channel.${channel}`)).join(", ");
  const draft = buildEscalationDraft({
    provider,
    senderDisplay: repeat.raw,
    reportedOn,
    channels,
    note: repeat.note,
    message: result.input,
    language: lang,
  });

  async function copyDraft() {
    const ok = await copyText(draft);
    onToast(ok ? t("result.copied") : t("result.copyFail"));
  }

  return (
    <div class="report" id="escalation">
      <button type="button" class="btn btn--text back-btn" onClick={onBack}>
        <IconArrowLeft />
        {t("escalate.back")}
      </button>
      <section class="card">
        <h2>{t("escalate.title")}</h2>
        <p>{t("escalate.intro")}</p>
        <p class="why-line">{t("why.matters")}</p>
        <pre class="draft-box mono" id="escalation-draft">
          {draft}
        </pre>
        <button type="button" class="btn btn--primary" onClick={copyDraft}>
          {t("escalate.copy")}
        </button>
        <p class="caption">{t("escalate.notSent")}</p>
      </section>
      <section class="card">
        <h2 class="h2-small">{t("report.submitTitle")}</h2>
        {formUrl ? (
          <>
            <a class="btn btn--secondary" href={formUrl} target="_blank" rel="noopener noreferrer">
              {t("escalate.form")}
              <IconExternal />
              <span class="sr-only">({t("result.newTab")})</span>
            </a>
            <p class="caption">{t("escalate.formCaption")}</p>
          </>
        ) : null}
        <div class="link-stack">
          <a class="btn btn--secondary" href={IASC_URL} target="_blank" rel="noopener noreferrer">
            {t("report.iasc")}
            <IconExternal />
            <span class="sr-only">({t("result.newTab")})</span>
          </a>
          <a class="btn btn--secondary" href={CEKREKENING_URL} target="_blank" rel="noopener noreferrer">
            {t("result.accountAction")}
            <IconExternal />
            <span class="sr-only">({t("result.newTab")})</span>
          </a>
          <a class="btn btn--secondary" href={PATROLI_SIBER_URL} target="_blank" rel="noopener noreferrer">
            {t("escalate.police")}
            <IconExternal />
            <span class="sr-only">({t("result.newTab")})</span>
          </a>
        </div>
        <p class="caption">{t("report.caption")}</p>
      </section>
    </div>
  );
}
