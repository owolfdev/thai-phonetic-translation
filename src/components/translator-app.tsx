"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { TranslationResult } from "@/lib/types";

const EXAMPLES = [
  "sawasdee khrap",
  "thank you",
  "khob khun mak",
  "Where is the train station?",
];

type ApiResponse = {
  result?: TranslationResult;
  error?: string;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

function CopyIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function SpeakerIcon({ active }: { active: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`h-4 w-4 ${active ? "animate-pulse" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {active ? (
        <rect x="8" y="8" width="8" height="8" rx="1.5" />
      ) : (
        <>
          <path d="M5 10v4h3l5 4V6l-5 4H5Z" />
          <path d="M17 9a5 5 0 0 1 0 6" />
          <path d="M19.5 6.5a8.5 8.5 0 0 1 0 11" />
        </>
      )}
    </svg>
  );
}

function InstallIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v10" />
      <path d="m8 9 4 4 4-4" />
      <path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function inputLabel(inputType: TranslationResult["detectedInput"]) {
  switch (inputType) {
    case "english":
      return "English";
    case "romanized-thai":
      return "Phonetic Thai";
    case "thai":
      return "Thai";
    default:
      return "Input";
  }
}

export function TranslatorApp() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [thaiVoice, setThaiVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [installPromptEvent, setInstallPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installMessage, setInstallMessage] = useState("");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stopSpeaking = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setIsSpeaking(false);
  }, []);

  const refreshVoices = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSpeechSupported(false);
      setThaiVoice(null);
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    const availableThaiVoice =
      voices.find((voice) => voice.lang.toLowerCase().startsWith("th-th")) ??
      voices.find((voice) => voice.lang.toLowerCase().startsWith("th"));

    setSpeechSupported(true);
    setThaiVoice(availableThaiVoice ?? null);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const synth = window.speechSynthesis;
    const timeout = window.setTimeout(refreshVoices, 0);
    synth.addEventListener("voiceschanged", refreshVoices);

    return () => {
      window.clearTimeout(timeout);
      synth.removeEventListener("voiceschanged", refreshVoices);
      stopSpeaking();
    };
  }, [refreshVoices, stopSpeaking]);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = window.setTimeout(() => setCopied(false), 1400);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const updateInstalledState = () => {
      const standaloneNavigator = window.navigator as Navigator & {
        standalone?: boolean;
      };

      setIsInstalled(
        mediaQuery.matches || standaloneNavigator.standalone === true,
      );
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
      setInstallMessage("");
      updateInstalledState();
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPromptEvent(null);
      setInstallMessage("App installed");
    };

    updateInstalledState();

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt,
    );
    window.addEventListener("appinstalled", handleAppInstalled);
    mediaQuery.addEventListener("change", updateInstalledState);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      mediaQuery.removeEventListener("change", updateInstalledState);
    };
  }, []);

  async function handleCopy() {
    if (!result?.thai) {
      return;
    }

    try {
      await navigator.clipboard.writeText(result.thai);
      setCopied(true);
    } catch {
      setError("Clipboard access was blocked by the browser.");
    }
  }

  function handleSpeakToggle() {
    if (!result?.thai || !thaiVoice || !speechSupported) {
      return;
    }

    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(result.thai);
    utterance.lang = thaiVoice.lang || "th-TH";
    utterance.voice = thaiVoice;
    utterance.rate = 0.9;
    utterance.onend = () => {
      utteranceRef.current = null;
      setIsSpeaking(false);
    };
    utterance.onerror = () => {
      utteranceRef.current = null;
      setIsSpeaking(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }

  async function handleInstall() {
    if (!installPromptEvent) {
      return;
    }

    await installPromptEvent.prompt();
    const choice = await installPromptEvent.userChoice;

    if (choice.outcome === "accepted") {
      setInstallMessage("Install accepted");
    } else {
      setInstallMessage("Install dismissed");
    }

    setInstallPromptEvent(null);
  }

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const trimmedInput = input.trim();
      if (!trimmedInput) {
        setError("Enter English or phonetic Thai to translate.");
        return;
      }

      stopSpeaking();
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: trimmedInput }),
        });

        const payload = (await response.json()) as ApiResponse;

        if (!response.ok || !payload.result) {
          throw new Error(payload.error || "Translation failed.");
        }

        setResult(payload.result);
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Translation failed.";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [input, stopSpeaking],
  );

  const voiceUnavailableReason = useMemo(() => {
    if (!speechSupported) {
      return "Speech synthesis is not supported in this browser";
    }

    if (!thaiVoice) {
      return "No Thai voice available on this device";
    }

    return "";
  }, [speechSupported, thaiVoice]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <div className="paper-panel flex flex-col gap-6">
          <div className="space-y-3">
            <p className="eyebrow">Thai Language Studio</p>
            <h1 className="text-3xl leading-tight font-bold text-stone-900 sm:text-5xl">
              Translate English and phonetic Thai into natural Thai script.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-stone-700 sm:text-base">
              Powered by OpenAI for translation and transliteration, with
              built-in Thai text-to-speech for listening practice.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2" htmlFor="translation-input">
              <span className="text-xs font-bold tracking-[0.2em] text-stone-700 uppercase">
                Enter English or phonetic Thai
              </span>
              <textarea
                id="translation-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                className="min-h-44 w-full rounded-[1.75rem] border border-teal-900/20 bg-white/90 px-5 py-4 text-sm leading-7 text-stone-900 shadow-sm outline-none transition focus-visible:border-teal-700 focus-visible:ring-2 focus-visible:ring-teal-700/25"
                placeholder="Try: sawasdee khrap, khob khun mak, or Where is the bathroom?"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setInput(example)}
                  className="rounded-full border border-teal-900/20 bg-white px-3 py-1.5 text-xs font-bold tracking-[0.12em] text-teal-900 uppercase transition hover:bg-teal-900 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
                >
                  {example}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-full border border-teal-900 bg-teal-900 px-5 py-3 text-xs font-bold tracking-[0.18em] text-(--paper) uppercase transition hover:bg-transparent hover:text-teal-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-teal-900 disabled:hover:text-(--paper)"
              >
                {loading ? "Translating..." : "Translate"}
              </button>
              {!isInstalled && installPromptEvent ? (
                <button
                  type="button"
                  onClick={handleInstall}
                  className="inline-flex items-center gap-2 rounded-full border border-gold-700/40 px-5 py-3 text-xs font-bold tracking-[0.18em] text-gold-800 uppercase transition hover:bg-gold-700 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-700"
                >
                  <InstallIcon />
                  Install App
                </button>
              ) : null}
              {isInstalled ? (
                <span className="rounded-full border border-gold-700/30 bg-gold-500/10 px-4 py-2 text-[11px] font-bold tracking-[0.16em] text-gold-800 uppercase">
                  Installed
                </span>
              ) : null}
              <p className="text-xs leading-6 text-stone-600">
                Keep your API key on the server with `OPENAI_API_KEY`.
              </p>
            </div>
            {installMessage ? (
              <p className="text-xs leading-6 text-stone-600">
                {installMessage}
              </p>
            ) : null}
          </form>

          {error ? (
            <div className="rounded-3xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          ) : null}
        </div>

        <aside className="paper-panel flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Current Result</p>
              <h2 className="mt-2 text-xl font-bold text-stone-900">
                Thai output and study notes
              </h2>
            </div>
            {result ? (
              <span className="rounded-full border border-gold-700/35 bg-gold-500/10 px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-gold-800 uppercase">
                {inputLabel(result.detectedInput)}
              </span>
            ) : null}
          </div>

          {result ? (
            <div className="flex flex-1 flex-col gap-5">
              <div className="rounded-[1.75rem] border border-teal-900/10 bg-white/80 p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-teal-900/10 pb-4">
                  <div>
                    <p className="text-xs font-bold tracking-[0.18em] text-stone-600 uppercase">
                      Thai script
                    </p>
                    <p className="thai-text mt-3 text-3xl leading-tight text-teal-950 sm:text-4xl">
                      {result.thai}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center gap-2 rounded-full border border-teal-900/20 px-3.5 py-2 text-xs font-bold tracking-[0.14em] text-teal-900 uppercase transition hover:bg-teal-900 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
                    >
                      <CopyIcon />
                      {copied ? "Copied" : "Copy Thai text"}
                    </button>
                    <button
                      type="button"
                      onClick={handleSpeakToggle}
                      disabled={!result.thai || Boolean(voiceUnavailableReason)}
                      title={voiceUnavailableReason || undefined}
                      aria-label={
                        isSpeaking ? "Stop reading" : "Read Thai text aloud"
                      }
                      className="inline-flex items-center gap-2 rounded-full border border-teal-900/20 px-3.5 py-2 text-xs font-bold tracking-[0.14em] text-teal-900 uppercase transition hover:bg-teal-900 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800 disabled:cursor-not-allowed disabled:border-stone-300 disabled:text-stone-400 disabled:hover:bg-transparent disabled:hover:text-stone-400"
                    >
                      <SpeakerIcon active={isSpeaking} />
                      {isSpeaking ? "Stop audio" : "Read aloud"}
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold tracking-[0.16em] text-stone-600 uppercase">
                      RTGS Romanization
                    </p>
                    <p className="mt-2 text-sm leading-7 text-stone-800">
                      {result.rtgs}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold tracking-[0.16em] text-stone-600 uppercase">
                      English gloss
                    </p>
                    <p className="mt-2 text-sm leading-7 text-stone-800">
                      {result.englishGloss}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(240px,0.9fr)]">
                <div className="rounded-[1.75rem] border border-teal-900/10 bg-white/80 p-5 shadow-sm">
                  <p className="text-xs font-bold tracking-[0.16em] text-stone-600 uppercase">
                    Per-syllable tones
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {result.syllables.map((syllable, index) => (
                      <div
                        key={`${syllable.syllable}-${index}`}
                        className="rounded-2xl border border-dashed border-teal-900/15 bg-(--paper) px-4 py-3"
                      >
                        <p className="thai-text text-xl text-teal-950">
                          {syllable.syllable}
                        </p>
                        <p className="mt-1 text-xs font-bold tracking-[0.12em] text-gold-800 uppercase">
                          {syllable.tone}
                        </p>
                        {syllable.note ? (
                          <p className="mt-2 text-xs leading-6 text-stone-600">
                            {syllable.note}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1.75rem] border border-teal-900/10 bg-white/80 p-5 shadow-sm">
                    <p className="text-xs font-bold tracking-[0.16em] text-stone-600 uppercase">
                      Alternate readings
                    </p>
                    <ul className="mt-3 space-y-2 text-sm leading-7 text-stone-800">
                      {result.alternates.length ? (
                        result.alternates.map((alternate) => (
                          <li
                            key={alternate}
                            className="rounded-2xl border border-dashed border-teal-900/15 px-3 py-2"
                          >
                            {alternate}
                          </li>
                        ))
                      ) : (
                        <li className="text-stone-500">No close alternates.</li>
                      )}
                    </ul>
                  </div>

                  <div className="rounded-[1.75rem] border border-teal-900/10 bg-white/80 p-5 shadow-sm">
                    <p className="text-xs font-bold tracking-[0.16em] text-stone-600 uppercase">
                      Notes
                    </p>
                    <p className="mt-3 text-sm leading-7 text-stone-800">
                      {result.notes}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-[1.75rem] border border-dashed border-teal-900/20 bg-white/65 p-8 text-center text-sm leading-7 text-stone-600">
              Submit a phrase to see Thai script, RTGS, gloss, alternates,
              tone-by-tone guidance, and the read-aloud control.
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
