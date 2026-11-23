import type { AnalysisResult, Analyzer } from "./types.ts";

/**
 * Placeholder for a later model-backed analyzer.
 * The demo never constructs this. Implement `analyze`, keep the same result
 * shape, and change the on-screen privacy line if text would leave the device.
 */
export class LlmAnalyzer implements Analyzer {
  readonly id = "llm";

  analyze(input: string, signal?: AbortSignal): Promise<AnalysisResult> {
    void input;
    void signal;
    return Promise.reject(new Error("LLM_ANALYZER_NOT_CONFIGURED"));
  }
}
