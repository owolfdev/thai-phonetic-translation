export type TranslationInputType = "english" | "romanized-thai" | "thai";

export type TranslationSyllable = {
  syllable: string;
  tone: string;
  note?: string;
};

export type TranslationResult = {
  detectedInput: TranslationInputType;
  thai: string;
  rtgs: string;
  englishGloss: string;
  syllables: TranslationSyllable[];
  alternates: string[];
  notes: string;
};
