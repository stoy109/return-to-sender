import { useEffect, useRef, useState } from "preact/hooks";
import { detectKinds } from "./analyzer/extract.ts";
import { createAnalyzer } from "./analyzer/index.ts";
import { SAMPLES, type Sample } from "./analyzer/samples.ts";
import { applyKnownSenders, identifySender } from "./analyzer/senders.ts";
import type { AnalysisResult, ReportChannel } from "./analyzer/types.ts";
import { Composer, Skeleton, type StepStatus } from "./components/composer.tsx";
import { ConfirmDialog } from "./components/dialog.tsx";
import { EscalationView } from "./components/escalation-view.tsx";
import { HistoryPanel } from "./components/history-panel.tsx";
import { IconHistory, IconSenders } from "./components/icons.tsx";
import { KnownSendersView } from "./components/known-senders.tsx";
import { Nudge, type NudgeStep } from "./components/nudge.tsx";
import { ReportView } from "./components/report-view.tsx";
import { ResultView } from "./components/result-view.tsx";
import { I18nProvider, useI18n, type Lang } from "./i18n.tsx";
import {
  draftFrom,
  loadHistory,
  loadKnownSenders,
  loadLang,
  loadSavePref,
  saveHistory,
  saveKnownSenders,
  saveLang,
  saveSavePref,
  type HistoryEntry,
  type KnownSender,
  type ReportDraft,
} from "./storage.ts";

type Phase = "edit" | "analyzing" | "result" | "error";
type Pane = "check" | "report" | "escalation" | "senders";
type MobileScreen = "main" | "history" | "senders";

function ensureSeed(list: KnownSender[], sample: Sample, now = Date.now()): KnownSender[] {
  if (!sample.seed) return list;
  const identified = identifySender(sample.seed.raw);
  if (!identified) return list;
  if (list.some((sender) => sender.key === identified.key)) return list;
  return [
    {
      id: `seed-${identified.key}`,
      kind: identified.kind,
      raw: identified.raw,
      key: identified.key,
      firstReportedAt: now - sample.seed.daysAgo * 86_400_000,
      channels: sample.seed.channels,
      note: sample.seed.note,
    },
    ...list,
  ];
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function useDesktop() {
  const query = "(min-width: 960px)";
  const [desktop, setDesktop] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setDesktop(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  return desktop;
}

export function App() {
  const [lang, setLang] = useState<Lang>(() => loadLang());
  return (
    <I18nProvider lang={lang}>
      <Shell lang={lang} setLang={setLang} />
    </I18nProvider>
  );
}

function Shell({ lang, setLang }: { lang: Lang; setLang: (lang: Lang) => void }) {
  const { t } = useI18n();
  const desktop = useDesktop();
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("edit");
  const [pane, setPane] = useState<Pane>("check");
  const [mobileScreen, setMobileScreen] = useState<MobileScreen>("main");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [steps, setSteps] = useState<StepStatus[]>(["wait", "wait", "wait"]);
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const [known, setKnown] = useState<KnownSender[]>(() => loadKnownSenders());
  const [saveOn, setSaveOn] = useState(() => loadSavePref());
  const [exampleId, setExampleId] = useState<string | null>(null);
  const [examplesOpen, setExamplesOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [memoryDraft, setMemoryDraft] = useState<ReportDraft | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const runRef = useRef(0);

  useEffect(() => {
    document.documentElement.lang = lang;
    saveLang(lang);
  }, [lang]);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  useEffect(() => {
    saveKnownSenders(known);
  }, [known]);

  useEffect(() => {
    setResult((current) => {
      if (!current) return current;
      const next = applyKnownSenders(current, known);
      const sameScore = next.score === current.score && next.uncapped === current.uncapped;
      const sameRepeat = (next.repeat?.key ?? "") === (current.repeat?.key ?? "");
      return sameScore && sameRepeat ? current : next;
    });
  }, [known]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    return () => {
      runRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (phase !== "result" || pane !== "check") return;
    document.getElementById("result-summary")?.focus();
  }, [phase, pane, result]);

  const active = history.find((entry) => entry.id === activeId) ?? null;
  const draft = result ? draftFrom(result, active?.report ?? memoryDraft ?? undefined) : null;
  const detected = detectKinds(text);

  const nudge: { step: NudgeStep; done: boolean } =
    pane === "report" || pane === "escalation"
      ? { step: "report", done: false }
      : phase === "result" && result?.verdict === "likely_scam"
        ? { step: "report", done: false }
        : phase === "analyzing" || phase === "result"
          ? { step: "check", done: result?.verdict === "safe" }
          : { step: "stop", done: false };

  function chooseLang(next: Lang) {
    setLang(next);
  }

  function onText(value: string) {
    setText(value);
    setExampleId(null);
    if (phase === "error") setPhase("edit");
  }

  function applyExample(id: string) {
    const sample = SAMPLES.find((item) => item.id === id);
    if (!sample) return;
    const nextKnown = ensureSeed(known, sample);
    if (nextKnown !== known) setKnown(nextKnown);
    setText(sample.text);
    setExampleId(sample.id);
    setPhase("edit");
    setResult(null);
    setPane("check");
    setMobileScreen("main");
    setExamplesOpen(!sample.autoCheck);
    if (sample.autoCheck) void runCheck(sample.text, nextKnown);
  }

  function toggleExamples() {
    if (!examplesOpen && !exampleId) {
      const first = SAMPLES[0];
      setText(first.text);
      setExampleId(first.id);
      setPhase("edit");
      setResult(null);
    }
    setExamplesOpen((open) => !open);
  }

  function reset() {
    runRef.current += 1;
    setText("");
    setResult(null);
    setPhase("edit");
    setPane("check");
    setExampleId(null);
    setExamplesOpen(false);
    setActiveId(null);
    setMemoryDraft(null);
    setMobileScreen("main");
  }

  function editAgain() {
    setPhase("edit");
    setPane("check");
    setResult(null);
  }

  async function runCheck(forced?: string, knownList: KnownSender[] = known) {
    const snapshot = forced ?? text;
    if (snapshot.trim().length < 3 || phase === "analyzing") return;
    const run = ++runRef.current;
    setExamplesOpen(false);
    setPhase("analyzing");
    setPane("check");
    setMobileScreen("main");
    setResult(null);
    setSteps(["active", "wait", "wait"]);
    let timer: number | undefined;
    try {
      const analysis = await new Promise<AnalysisResult>((resolve, reject) => {
        timer = window.setTimeout(() => reject(new Error("timeout")), 15000);
        createAnalyzer("heuristic").analyze(snapshot).then(resolve, reject);
      });
      window.clearTimeout(timer);
      if (run !== runRef.current) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduced) {
        await wait(420);
        if (run !== runRef.current) return;
        setSteps(["done", "active", "wait"]);
        await wait(420);
        if (run !== runRef.current) return;
        setSteps(["done", "done", "active"]);
        await wait(420);
        if (run !== runRef.current) return;
      }
      setSteps(["done", "done", "done"]);
      const boosted = applyKnownSenders(analysis, knownList);
      setResult(boosted);
      setPhase("result");
      if (saveOn) {
        const entry: HistoryEntry = {
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          input: boosted.input,
          score: boosted.score,
          verdict: boosted.verdict,
          result: boosted,
        };
        setHistory((prev) => [entry, ...prev].slice(0, 50));
        setActiveId(entry.id);
        setMemoryDraft(null);
      } else {
        setActiveId(null);
        setMemoryDraft(null);
      }
    } catch {
      if (timer) window.clearTimeout(timer);
      if (run !== runRef.current) return;
      setPhase("error");
    }
  }

  function openEntry(entry: HistoryEntry) {
    setText(entry.input);
    setResult(entry.result);
    setPhase("result");
    setPane("check");
    setActiveId(entry.id);
    setExampleId(null);
    setExamplesOpen(false);
    setMemoryDraft(null);
    setMobileScreen("main");
    setResult(applyKnownSenders(entry.result, known));
  }

  function saveSender(input: { raw: string; channels: ReportChannel[]; note: string }) {
    const identified = identifySender(input.raw);
    if (!identified) {
      setToast(t("senders.invalid"));
      return;
    }
    setKnown((prev) => {
      const existing = prev.find((sender) => sender.key === identified.key);
      if (existing) {
        return prev.map((sender) =>
          sender.key === identified.key
            ? { ...sender, raw: identified.raw, channels: input.channels, note: input.note }
            : sender,
        );
      }
      return [
        {
          id: crypto.randomUUID(),
          kind: identified.kind,
          raw: identified.raw,
          key: identified.key,
          firstReportedAt: Date.now(),
          channels: input.channels,
          note: input.note,
        },
        ...prev,
      ];
    });
    setToast(t("senders.saved"));
  }

  function exportSenders() {
    const blob = new Blob(
      [JSON.stringify({ v: 1, exportedAt: new Date().toISOString(), senders: known }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "return-to-sender-known-senders.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function updateDraft(next: ReportDraft) {
    if (activeId) {
      setHistory((prev) => prev.map((entry) => (entry.id === activeId ? { ...entry, report: next } : entry)));
    } else {
      setMemoryDraft(next);
    }
  }

  function removeEntry(id: string) {
    setHistory((prev) => prev.filter((entry) => entry.id !== id));
    if (id === activeId) {
      setActiveId(null);
      if (draft) setMemoryDraft(draft);
    }
  }

  function clearAll() {
    setHistory([]);
    if (activeId) {
      setActiveId(null);
      if (draft) setMemoryDraft(draft);
    }
    setConfirmClear(false);
  }

  const showHistoryScreen = !desktop && mobileScreen === "history";
  const showSenderScreen = pane === "senders" || (!desktop && mobileScreen === "senders");
  const showEscalation = pane === "escalation" && !!result?.repeat && !showHistoryScreen && !showSenderScreen;
  const showReport = pane === "report" && !!result && !!draft && !showHistoryScreen && !showSenderScreen;

  return (
    <div
      class="app"
      data-phase={phase}
      data-pane={
        showHistoryScreen ? "history" : showSenderScreen ? "senders" : showEscalation ? "escalation" : showReport ? "report" : "check"
      }
      data-repeat={result?.repeat ? "true" : "false"}
      data-verdict={result?.verdict ?? ""}
    >
      <svg class="defs" width="0" height="0" aria-hidden="true">
        <filter id="rough" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="turbulence" baseFrequency="0.06" numOctaves="2" seed="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" />
        </filter>
      </svg>
      <a class="skip" href="#main">
        {t("nav.skip")}
      </a>
      <header class="band">
        <div class="band-inner">
          <h1 class="wordmark">
            <span>Return to</span>
            <span>Sender</span>
          </h1>
          <div class="band-tools">
            <div class="lang" role="radiogroup" aria-label={t("lang.label")}>
              <button type="button" role="radio" aria-checked={lang === "en"} onClick={() => chooseLang("en")}>
                EN
              </button>
              <span aria-hidden="true">|</span>
              <button type="button" role="radio" aria-checked={lang === "id"} onClick={() => chooseLang("id")}>
                ID
              </button>
            </div>
            {!desktop ? (
              <>
                <button
                  type="button"
                  class="icon-btn"
                  aria-label={t("senders.open")}
                  aria-pressed={mobileScreen === "senders"}
                  onClick={() => {
                    setMobileScreen((current) => (current === "senders" ? "main" : "senders"));
                    setPane("check");
                  }}
                >
                  <IconSenders />
                </button>
                <button
                  type="button"
                  class="icon-btn"
                  aria-label={t("history.open")}
                  aria-pressed={mobileScreen === "history"}
                  onClick={() => setMobileScreen((current) => (current === "history" ? "main" : "history"))}
                >
                  <IconHistory />
                </button>
              </>
            ) : null}
          </div>
        </div>
      </header>
      <div class="wrap">
        <div class="layout">
          <main id="main">
            {showHistoryScreen ? (
              <HistoryPanel
                entries={history}
                saveOn={saveOn}
                showBack
                onBack={() => setMobileScreen("main")}
                onToggleSave={() => {
                  setSaveOn((value) => {
                    saveSavePref(!value);
                    return !value;
                  });
                }}
                onOpen={openEntry}
                onDelete={removeEntry}
                onClear={() => setConfirmClear(true)}
              />
            ) : showSenderScreen ? (
              <KnownSendersView
                senders={known}
                showBack
                onBack={() => {
                  setPane("check");
                  setMobileScreen("main");
                }}
                onDelete={(id) => setKnown((prev) => prev.filter((sender) => sender.id !== id))}
                onExport={exportSenders}
              />
            ) : showEscalation && result ? (
              <EscalationView
                result={result}
                onBack={() => setPane("check")}
                onToast={setToast}
              />
            ) : showReport && result && draft ? (
              <ReportView
                draft={draft}
                result={result}
                onChange={updateDraft}
                onBack={() => setPane("check")}
                onToast={setToast}
              />
            ) : (
              <>
                {!desktop ? <Nudge step={nudge.step} done={nudge.done} /> : null}
                <Composer
                  text={text}
                  onText={onText}
                  phase={phase}
                  detected={detected}
                  exampleId={exampleId}
                  examplesOpen={examplesOpen}
                  steps={steps}
                  onCheck={() => void runCheck()}
                  onToggleExamples={toggleExamples}
                  onExample={applyExample}
                />
                {phase === "analyzing" ? <Skeleton /> : null}
                {phase === "result" && result ? (
                  <ResultView
                    result={result}
                    known={known}
                    onReport={() => {
                      setPane("report");
                      window.scrollTo({ top: 0, behavior: "auto" });
                    }}
                    onEscalate={() => {
                      setPane("escalation");
                      window.scrollTo({ top: 0, behavior: "auto" });
                    }}
                    onSaveSender={saveSender}
                    onNew={reset}
                    onEdit={editAgain}
                    onToast={setToast}
                  />
                ) : null}
              </>
            )}
          </main>
          {desktop ? (
            <aside class="rail">
              <Nudge step={nudge.step} done={nudge.done} />
              <button
                type="button"
                class="btn btn--secondary rail-link"
                onClick={() => {
                  setPane("senders");
                  window.scrollTo({ top: 0, behavior: "auto" });
                }}
              >
                {t("senders.open")}
              </button>
              <HistoryPanel
                entries={history}
                saveOn={saveOn}
                onToggleSave={() => {
                  setSaveOn((value) => {
                    saveSavePref(!value);
                    return !value;
                  });
                }}
                onOpen={openEntry}
                onDelete={removeEntry}
                onClear={() => setConfirmClear(true)}
              />
            </aside>
          ) : null}
        </div>
        <footer class="footer">
          <p class="disclaimer">{t("disclaimer")}</p>
          <p class="credit">{t("footer.credit")}</p>
        </footer>
      </div>
      {toast ? (
        <div class="toast" role="status">
          {toast}
        </div>
      ) : null}
      <ConfirmDialog
        open={confirmClear}
        title={t("history.clearTitle")}
        body={t("history.clearBody")}
        confirmLabel={t("history.clear")}
        cancelLabel={t("history.cancel")}
        onConfirm={clearAll}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}
