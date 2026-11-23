import { useEffect, useRef } from "preact/hooks";
import type { DetectedKinds } from "../analyzer/types.ts";
import { SAMPLES } from "../analyzer/samples.ts";
import { useI18n } from "../i18n.tsx";

export type StepStatus = "wait" | "active" | "done";

const STEP_KEYS = ["step.links", "step.message", "step.score"] as const;
const KIND_KEYS: Array<{ id: keyof DetectedKinds; key: string }> = [
  { id: "link", key: "kind.link" },
  { id: "account", key: "kind.account" },
  { id: "phone", key: "kind.phone" },
  { id: "message", key: "kind.message" },
];

export function Composer({
  text,
  onText,
  phase,
  detected,
  exampleId,
  examplesOpen,
  steps,
  onCheck,
  onToggleExamples,
  onExample,
}: {
  text: string;
  onText: (value: string) => void;
  phase: "edit" | "analyzing" | "result" | "error";
  detected: DetectedKinds;
  exampleId: string | null;
  examplesOpen: boolean;
  steps: StepStatus[];
  onCheck: () => void;
  onToggleExamples: () => void;
  onExample: (id: string) => void;
}) {
  const { t } = useI18n();
  const area = useRef<HTMLTextAreaElement>(null);
  const locked = phase === "analyzing" || phase === "result";
  const canCheck = text.trim().length >= 3;

  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    const style = getComputedStyle(el);
    const line = Number.parseFloat(style.lineHeight) || 24;
    const pad = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);
    const minRows = locked ? 3 : 6;
    const next = Math.min(line * 14 + pad, Math.max(line * minRows + pad, el.scrollHeight));
    el.style.height = `${next}px`;
  }, [text, locked]);

  return (
    <section class="card card--input composer">
      {exampleId ? (
        <p class="example-flag">
          <span class="chip chip--outline">{t("input.exampleFlag")}</span>
          <span>{t("input.exampleNote")}</span>
        </p>
      ) : null}
      <label class="sr-only" for="message">
        {t("input.label")}
      </label>
      <textarea
        ref={area}
        id="message"
        class="mono"
        value={text}
        readOnly={locked}
        aria-readonly={locked}
        placeholder={t("input.placeholder")}
        spellcheck={false}
        autoComplete="off"
        onInput={(event) => onText(event.currentTarget.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && canCheck && !locked) {
            event.preventDefault();
            onCheck();
          }
        }}
      />
      <div class="chips" aria-label={t("input.label")}>
        {KIND_KEYS.filter((kind) => detected[kind.id]).map((kind) => (
          <span key={kind.id} class="chip chip--outline">
            {t(kind.key)}
          </span>
        ))}
      </div>
      <p class="helper">{t("input.helper")}</p>
      {phase === "analyzing" ? (
        <ol class="progress" aria-live="polite" aria-label={t("step.label")}>
          {STEP_KEYS.map((key, index) => {
            const status = steps[index] ?? "wait";
            return (
              <li
                key={key}
                class={status === "active" ? "is-active" : undefined}
                aria-current={status === "active" ? "step" : undefined}
              >
                <span class="mono">{t(key)}</span>
                <span class={status === "done" ? "mono" : "mono muted"}>
                  {status === "done" ? t("step.done") : "…"}
                </span>
              </li>
            );
          })}
        </ol>
      ) : null}
      {phase === "error" ? <p class="error-note">{t("input.error")}</p> : null}
      {phase === "edit" || phase === "error" ? (
        <button type="button" class="btn btn--primary" disabled={!canCheck} onClick={onCheck}>
          {phase === "error" ? t("input.retry") : t("input.check")}
        </button>
      ) : null}
      {phase === "edit" || phase === "error" ? (
        <>
          <button
            type="button"
            class="btn btn--text"
            aria-expanded={examplesOpen}
            onClick={onToggleExamples}
          >
            {t("input.example")}
          </button>
          {examplesOpen ? (
            <ul class="example-list">
              {SAMPLES.map((sample) => (
                <li key={sample.id}>
                  <button
                    type="button"
                    class={sample.id === exampleId ? "is-current" : undefined}
                    onClick={() => onExample(sample.id)}
                  >
                    <span class="chip chip--outline">{t("input.exampleFlag")}</span>
                    <span class="example-title">{t(sample.labelKey)}</span>
                    <span class="example-verdict">{t(`verdict.${sample.expectedVerdict}`)}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

export function Skeleton() {
  return (
    <div class="card skeleton" aria-hidden="true">
      <div class="sk-row">
        <div class="sk sk-stamp" />
        <div class="sk sk-score" />
      </div>
      <div class="sk sk-bar" />
      <div class="sk sk-line" />
      <div class="sk sk-line sk-short" />
      <div class="sk sk-block" />
    </div>
  );
}
