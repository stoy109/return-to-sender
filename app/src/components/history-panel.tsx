import { useEffect, useState } from "preact/hooks";
import type { Verdict } from "../analyzer/types.ts";
import { useI18n } from "../i18n.tsx";
import { formatRelative, snippet } from "../lib/time.ts";
import type { HistoryEntry } from "../storage.ts";
import { IconArrowLeft, IconTrash } from "./icons.tsx";
import { Stamp } from "./stamp.tsx";

export function HistoryPanel({
  entries,
  saveOn,
  showBack = false,
  onToggleSave,
  onOpen,
  onDelete,
  onClear,
  onBack,
}: {
  entries: readonly HistoryEntry[];
  saveOn: boolean;
  showBack?: boolean;
  onToggleSave: () => void;
  onOpen: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onBack?: () => void;
}) {
  const { lang, t } = useI18n();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section class="card history-card">
      {showBack ? (
        <button type="button" class="btn btn--text back-btn" onClick={onBack}>
          <IconArrowLeft />
          {t("history.back")}
        </button>
      ) : null}
      <div class="history-head">
        <h2>{t("history.title")}</h2>
        <div class="save-row">
          <span id="save-label">{t("history.save")}</span>
          <button
            type="button"
            class="switch"
            role="switch"
            aria-checked={saveOn}
            aria-labelledby="save-label"
            onClick={onToggleSave}
          />
        </div>
      </div>
      {entries.length === 0 ? (
        <p class="muted">{t("history.empty")}</p>
      ) : (
        <ul class="history-list">
          {entries.map((entry) => (
            <li key={entry.id} class="history-item">
              <button
                type="button"
                class="history-open"
                onClick={() => onOpen(entry)}
                aria-label={`${t(`verdict.${entry.verdict as Verdict}`)}, ${entry.score}/100, ${snippet(entry.input)}`}
              >
                <Stamp verdict={entry.verdict} mini />
                <span class="history-copy">
                  <span class="snippet mono">{snippet(entry.input)}</span>
                  <span class="history-meta">
                    {formatRelative(entry.createdAt, now, lang, t)} · {entry.score}
                  </span>
                </span>
              </button>
              <button
                type="button"
                class="icon-btn"
                aria-label={t("history.delete")}
                onClick={() => onDelete(entry.id)}
              >
                <IconTrash />
              </button>
            </li>
          ))}
        </ul>
      )}
      {entries.length > 0 ? (
        <button type="button" class="btn btn--danger" onClick={onClear}>
          {t("history.clear")}
        </button>
      ) : null}
    </section>
  );
}
