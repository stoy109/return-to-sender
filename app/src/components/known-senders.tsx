import { useMemo, useState } from "preact/hooks";
import { extractCandidates, identifySender } from "../analyzer/senders.ts";
import type { ReportChannel, SenderKind } from "../analyzer/types.ts";
import { useI18n } from "../i18n.tsx";
import type { KnownSender } from "../storage.ts";
import { IconArrowLeft, IconTrash } from "./icons.tsx";

const CHANNELS: ReportChannel[] = [
  "sms",
  "whatsapp",
  "email",
  "call",
  "iasc",
  "cekrekening",
  "police",
  "provider",
];

function formatDate(value: number, lang: "en" | "id"): string {
  return new Intl.DateTimeFormat(lang === "id" ? "id-ID" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function SaveSenderForm({
  text,
  known,
  onSave,
}: {
  text: string;
  known: readonly KnownSender[];
  onSave: (input: { raw: string; channels: ReportChannel[]; note: string }) => void;
}) {
  const { lang, t } = useI18n();
  const candidates = useMemo(() => extractCandidates(text), [text]);
  const [picked, setPicked] = useState(candidates[0]?.raw ?? "");
  const [manual, setManual] = useState("");
  const [note, setNote] = useState(() => text.replace(/\s+/g, " ").trim().slice(0, 180));
  const chosen = (manual.trim() || picked).trim();
  const identified = chosen ? identifySender(chosen) : null;
  const existing = identified ? known.find((sender) => sender.key === identified.key) : undefined;
  const [channels, setChannels] = useState<ReportChannel[]>(() => {
    const kind: SenderKind | undefined = candidates[0]?.kind;
    if (kind === "email") return ["email"];
    if (kind === "domain") return ["provider"];
    return ["sms"];
  });

  function toggle(channel: ReportChannel) {
    setChannels((current) =>
      current.includes(channel) ? current.filter((item) => item !== channel) : [...current, channel],
    );
  }

  return (
    <section class="save-sender">
      <h3 class="kicker">{t("senders.title")}</h3>
      {existing ? (
        <p>{t("senders.already", { date: formatDate(existing.firstReportedAt, lang) })}</p>
      ) : (
        <p class="muted small">{t("senders.hint")}</p>
      )}
      {candidates.length > 0 ? (
        <div class="field">
          <label for="sender-pick">{t("senders.pick")}</label>
          <select id="sender-pick" value={picked} onChange={(event) => setPicked(event.currentTarget.value)}>
            {candidates.map((candidate) => (
              <option key={candidate.key} value={candidate.raw}>
                {t(`senders.kind.${candidate.kind}`)} · {candidate.raw}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div class="field">
        <label for="sender-manual">{t("senders.manual")}</label>
        <input
          id="sender-manual"
          type="text"
          value={manual}
          onInput={(event) => setManual(event.currentTarget.value)}
        />
      </div>
      <fieldset class="channel-set">
        <legend>{t("senders.channels")}</legend>
        {CHANNELS.map((channel) => (
          <label key={channel} class="checkline">
            <input
              type="checkbox"
              checked={channels.includes(channel)}
              onChange={() => toggle(channel)}
            />
            <span>{t(`channel.${channel}`)}</span>
          </label>
        ))}
      </fieldset>
      <div class="field">
        <label for="sender-note">{t("senders.note")}</label>
        <textarea
          id="sender-note"
          rows={3}
          placeholder={t("senders.notePlaceholder")}
          value={note}
          onInput={(event) => setNote(event.currentTarget.value)}
        />
      </div>
      <button
        type="button"
        class="btn btn--secondary"
        disabled={!identified}
        onClick={() => {
          if (!identified) return;
          onSave({ raw: chosen, channels, note: note.trim() });
        }}
      >
        {t("senders.save")}
      </button>
    </section>
  );
}

export function KnownSendersView({
  senders,
  showBack = false,
  onBack,
  onDelete,
  onExport,
}: {
  senders: readonly KnownSender[];
  showBack?: boolean;
  onBack?: () => void;
  onDelete: (id: string) => void;
  onExport: () => void;
}) {
  const { lang, t } = useI18n();
  return (
    <section class="card" id="known-senders">
      {showBack ? (
        <button type="button" class="btn btn--text back-btn" onClick={onBack}>
          <IconArrowLeft />
          {t("senders.back")}
        </button>
      ) : null}
      <div class="history-head">
        <h2>{t("senders.title")}</h2>
        <button type="button" class="btn btn--secondary" onClick={onExport}>
          {t("senders.export")}
        </button>
      </div>
      {senders.length === 0 ? (
        <p class="muted">{t("senders.empty")}</p>
      ) : (
        <ul class="history-list">
          {senders.map((sender) => (
            <li key={sender.id} class="history-item">
              <div class="history-open sender-row">
                <span class={`chip ${sender.kind === "phone" ? "chip--red" : "chip--hl"}`}>
                  {t(`senders.kind.${sender.kind}`)}
                </span>
                <span class="history-copy">
                  <span class="snippet mono">{sender.raw}</span>
                  <span class="history-meta">
                    {formatDate(sender.firstReportedAt, lang)}
                    {sender.channels.length > 0
                      ? ` · ${sender.channels.map((channel) => t(`channel.${channel}`)).join(", ")}`
                      : ""}
                  </span>
                  {sender.note ? <span class="sender-note">{sender.note}</span> : null}
                </span>
              </div>
              <button
                type="button"
                class="icon-btn"
                aria-label={t("senders.delete")}
                onClick={() => onDelete(sender.id)}
              >
                <IconTrash />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
