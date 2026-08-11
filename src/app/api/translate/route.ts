import { NextResponse } from "next/server";

import type { TranslationResult } from "@/lib/types";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

const translationSchema = {
  name: "thai_translation_result",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      detectedInput: {
        type: "string",
        enum: ["english", "romanized-thai", "thai"],
      },
      thai: { type: "string" },
      rtgs: { type: "string" },
      englishGloss: { type: "string" },
      syllables: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            syllable: { type: "string" },
            tone: { type: "string" },
            note: { type: "string" },
          },
          required: ["syllable", "tone", "note"],
        },
      },
      alternates: {
        type: "array",
        items: { type: "string" },
      },
      notes: { type: "string" },
    },
    required: [
      "detectedInput",
      "thai",
      "rtgs",
      "englishGloss",
      "syllables",
      "alternates",
      "notes",
    ],
  },
  strict: true,
} as const;

type OpenAiResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

function sanitizeResult(payload: TranslationResult): TranslationResult {
  return {
    detectedInput: payload.detectedInput,
    thai: payload.thai.trim(),
    rtgs: payload.rtgs.trim(),
    englishGloss: payload.englishGloss.trim(),
    syllables: payload.syllables.map((syllable) => ({
      syllable: syllable.syllable.trim(),
      tone: syllable.tone.trim(),
      note: syllable.note?.trim() || "",
    })),
    alternates: payload.alternates.map((alternate) => alternate.trim()).filter(Boolean),
    notes: payload.notes.trim(),
  };
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY on the server." },
      { status: 500 },
    );
  }

  let body: { text?: string };

  try {
    body = (await request.json()) as { text?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json(
      { error: "Enter English or phonetic Thai to translate." },
      { status: 400 },
    );
  }

  const openAiResponse = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.2,
      response_format: {
        type: "json_schema",
        json_schema: translationSchema,
      },
      messages: [
        {
          role: "system",
          content:
            "You are a Thai language assistant. Detect whether the input is English, phonetic Thai/romanized Thai, or already Thai. Return only valid JSON matching the schema. Convert the input into natural Thai script. Provide RTGS romanization, a concise English gloss, per-syllable tone labels with short notes for each syllable, a few alternate readings when relevant, and a brief study note. Keep explanations concise and learner-friendly.",
        },
        {
          role: "user",
          content: text,
        },
      ],
    }),
    cache: "no-store",
  });

  const payload = (await openAiResponse.json()) as OpenAiResponse;

  if (!openAiResponse.ok) {
    return NextResponse.json(
      {
        error:
          payload.error?.message ||
          "OpenAI returned an error while generating the translation.",
      },
      { status: openAiResponse.status },
    );
  }

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    return NextResponse.json(
      { error: "OpenAI returned an empty translation response." },
      { status: 502 },
    );
  }

  try {
    const result = sanitizeResult(JSON.parse(content) as TranslationResult);
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json(
      { error: "OpenAI returned an unreadable translation payload." },
      { status: 502 },
    );
  }
}
