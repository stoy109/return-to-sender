import { useI18n } from "../i18n.tsx";

export type NudgeStep = "stop" | "check" | "report";

export function Nudge({ step, done }: { step: NudgeStep; done: boolean }) {
  const { t } = useI18n();
  const items: Array<{ id: NudgeStep; key: string }> = [
    { id: "stop", key: "nudge.stop" },
    { id: "check", key: "nudge.check" },
    { id: "report", key: "nudge.report" },
  ];
  return (
    <section class="nudge" aria-label="Stop, check, report">
      <ol class="nudge-steps">
        {items.map((item) => (
          <li key={item.id} class={item.id === step ? "is-current" : undefined}>
            {t(item.key)}
            {item.id === "check" && done ? <span class="done-mark">{t("nudge.done")}</span> : null}
          </li>
        ))}
      </ol>
      <p class="nudge-line">{t("nudge.line")}</p>
      <p class="name-note">{t("name.meaning")}</p>
    </section>
  );
}
