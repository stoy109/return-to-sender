import type { AnalysisResult } from "../analyzer/types.ts";
import { useI18n, type T } from "../i18n.tsx";
import { copyText } from "../lib/copy.ts";
import { IASC_URL } from "../official.ts";
import { EVIDENCE_IDS, type Channel, type ReportDraft } from "../storage.ts";
import { IconArrowLeft, IconExternal } from "./icons.tsx";

function asChannel(value: string): Channel {
  if (value === "sms" || value === "whatsapp" || value === "email" || value === "call") return value;
  return "";
}

export function summaryText(draft: ReportDraft, result: AnalysisResult, t: T): string {
  const channel = draft.channel ? t(`report.channel.${draft.channel}`) : "—";
  const evidence = EVIDENCE_IDS.map(
    (id) => `${draft.evidence[id] ? "[x]" : "[ ]"} ${t(`report.evidence.${id}`)}`,
  ).join("\n");
  return [
    t("report.headingLine"),
    t("report.caption"),
    "",
    `${t("report.received")}: ${draft.receivedAt || "—"}`,
    `${t("report.channel")}: ${channel}`,
    `${t("report.sender")}: ${draft.sender || "—"}`,
    `${t("report.message")}:`,
    draft.message || "—",
    `${t("report.links")}:`,
    draft.links || "—",
    `${t("report.accounts")}:`,
    draft.accounts || "—",
    `${t("report.happened")}:`,
    draft.happened || "—",
    `${t("report.losses")}:`,
    draft.losses || "—",
    "",
    `${t("report.evidenceTitle")}:`,
    evidence,
    "",
    `${t(`verdict.${result.verdict}`)}: ${result.score}/100`,
    t("disclaimer"),
    IASC_URL,
  ].join("\n");
}

export function ReportView({
  draft,
  result,
  onChange,
  onBack,
  onToast,
}: {
  draft: ReportDraft;
  result: AnalysisResult;
  onChange: (next: ReportDraft) => void;
  onBack: () => void;
  onToast: (message: string) => void;
}) {
  const { t } = useI18n();

  async function copySummary() {
    const ok = await copyText(summaryText(draft, result, t));
    onToast(ok ? t("result.copied") : t("result.copyFail"));
  }

  return (
    <div class="report">
      <button type="button" class="btn btn--text back-btn" onClick={onBack}>
        <IconArrowLeft />
        {t("report.back")}
      </button>
      <section class="card summary-card">
        <h2>{t("report.title")}</h2>
        <p>{t("report.intro")}</p>
        <div class="field">
          <label for="received">{t("report.received")}</label>
          <span class="hint">{t("report.receivedHint")}</span>
          <input
            id="received"
            type="datetime-local"
            value={draft.receivedAt}
            onInput={(event) => onChange({ ...draft, receivedAt: event.currentTarget.value })}
          />
        </div>
        <div class="field">
          <label for="channel">{t("report.channel")}</label>
          <select
            id="channel"
            value={draft.channel}
            onChange={(event) => onChange({ ...draft, channel: asChannel(event.currentTarget.value) })}
          >
            <option value="">{t("report.channelPlaceholder")}</option>
            <option value="sms">{t("report.channel.sms")}</option>
            <option value="whatsapp">{t("report.channel.whatsapp")}</option>
            <option value="email">{t("report.channel.email")}</option>
            <option value="call">{t("report.channel.call")}</option>
          </select>
        </div>
        <div class="field">
          <label for="sender">{t("report.sender")}</label>
          <input
            id="sender"
            type="text"
            value={draft.sender}
            onInput={(event) => onChange({ ...draft, sender: event.currentTarget.value })}
          />
        </div>
        <div class="field">
          <label for="report-message">{t("report.message")}</label>
          <textarea
            id="report-message"
            rows={6}
            value={draft.message}
            onInput={(event) => onChange({ ...draft, message: event.currentTarget.value })}
          />
        </div>
        <div class="field">
          <label for="report-links">{t("report.links")}</label>
          <textarea
            id="report-links"
            rows={3}
            value={draft.links}
            onInput={(event) => onChange({ ...draft, links: event.currentTarget.value })}
          />
        </div>
        <div class="field">
          <label for="report-accounts">{t("report.accounts")}</label>
          <textarea
            id="report-accounts"
            rows={2}
            value={draft.accounts}
            onInput={(event) => onChange({ ...draft, accounts: event.currentTarget.value })}
          />
        </div>
        <div class="field">
          <label for="happened">{t("report.happened")}</label>
          <textarea
            id="happened"
            rows={3}
            placeholder={t("report.happenedPlaceholder")}
            value={draft.happened}
            onInput={(event) => onChange({ ...draft, happened: event.currentTarget.value })}
          />
        </div>
        <div class="field">
          <label for="losses">{t("report.losses")}</label>
          <input
            id="losses"
            type="text"
            placeholder={t("report.lossesPlaceholder")}
            value={draft.losses}
            onInput={(event) => onChange({ ...draft, losses: event.currentTarget.value })}
          />
        </div>
        <button type="button" class="btn btn--primary" onClick={copySummary}>
          {t("report.copy")}
        </button>
      </section>

      <section class="card">
        <h2 class="h2-small">{t("report.evidenceTitle")}</h2>
        <div class="checklist">
          {EVIDENCE_IDS.map((id) => (
            <label key={id} class="checkline">
              <input
                type="checkbox"
                checked={draft.evidence[id]}
                onChange={(event) =>
                  onChange({
                    ...draft,
                    evidence: { ...draft.evidence, [id]: event.currentTarget.checked },
                  })
                }
              />
              <span>{t(`report.evidence.${id}`)}</span>
            </label>
          ))}
        </div>
      </section>

      <section class="card">
        <h2 class="h2-small">{t("report.submitTitle")}</h2>
        <a class="btn btn--secondary" href={IASC_URL} target="_blank" rel="noopener noreferrer">
          {t("report.iasc")}
          <IconExternal />
          <span class="sr-only">({t("result.newTab")})</span>
        </a>
        <p class="bank-note">{t("report.bank")}</p>
        <p class="caption">{t("report.caption")}</p>
        <p class="disclaimer">{t("disclaimer")}</p>
      </section>
    </div>
  );
}
