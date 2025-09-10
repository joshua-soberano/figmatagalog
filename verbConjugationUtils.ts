import verbConjugationData from "../assets/utils/verb_conjugations.json";
import { shuffleArray } from "./questionUtils";

// ------------------
// Type helpers
// ------------------

type Aspect = "infinitive" | "completed" | "incomplete" | "contemplated";
type Focus  = "actor" | "object" | "locative";

type ConjugationForm = {
  word: string;
  translation: string;
};

type VerbEntry = {
  root: string;
  meaning: string;
  actor:    Record<Aspect, ConjugationForm>;
  object:   Record<Aspect, ConjugationForm>;
  locative: Record<Aspect, ConjugationForm>;
};

export type VerbQuestion = {
  wordtotranslate: string;
  options: string[];
  translation: string;
  mode: "multiple" | "fill";
  targetLang: "AspectFocus" | "Word" | "TransFocus";
};

/**
 * Generate a mixed set of verb-conjugation questions.
 */
export function generateVerbQuestions(count = 10): VerbQuestion[] {
  // ensure correct typing of imported JSON
  const data = verbConjugationData as unknown as VerbEntry[];
  const questions: VerbQuestion[] = [];

  const aspects: Aspect[] = ["infinitive", "completed", "incomplete", "contemplated"];
  const focuses: Focus[]  = ["actor", "object", "locative"];
  const directions = [
    "word-to-label",      // AspectFocus
    "label-to-word",      // Word
    "word-to-transFocus", // TransFocus
    "transFocus-to-word"  // Word
  ] as const;

  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const coin = (): boolean => Math.random() < 0.5;

  for (let i = 0; i < count; i++) {
    const verb      = pick(data);
    const aspect    = pick(aspects);
    const focus     = pick(focuses);
    const entry     = verb[focus][aspect];
    const direction = pick(directions);
    let q: VerbQuestion;

    switch (direction) {
      case "word-to-label": {
        const correct = `(${aspect}, ${focus})`;
        const dips: string[] = [];
        while (dips.length < 3) {
          const cand = `(${pick(aspects)}, ${pick(focuses)})`;
          if (cand !== correct && !dips.includes(cand)) dips.push(cand);
        }
        q = {
          wordtotranslate: entry.word,
          options: shuffleArray([correct, ...dips]),
          translation: correct,
          mode: "multiple",
          targetLang: "AspectFocus"
        };
        break;
      }

      case "label-to-word": {
        const prompt = `${verb.root} (${aspect}, ${focus})`;
        if (coin()) {
          const correct = entry.word;
          const dips: string[] = [];
          while (dips.length < 3) {
            const other = pick(data)[focus][aspect].word;
            if (other !== correct && !dips.includes(other)) dips.push(other);
          }
          q = {
            wordtotranslate: prompt,
            options: shuffleArray([correct, ...dips]),
            translation: correct,
            mode: "multiple",
            targetLang: "Word"
          };
        } else {
          q = {
            wordtotranslate: prompt,
            options: [],
            translation: entry.word,
            mode: "fill",
            targetLang: "Word"
          };
        }
        break;
      }

      case "word-to-transFocus": {
        const correctmc = `${entry.translation} (${focus})`;
        const correctfill = `${entry.translation}`;

        if (coin()) {
          const dips: string[] = [];
          while (dips.length < 3) {
            const cand = `${pick(data)[focus][aspect].translation} (${pick(focuses)})`;
            if (cand !== correctmc && !dips.includes(cand)) dips.push(cand);
          }
          q = {
            wordtotranslate: entry.word,
            options: shuffleArray([correctmc, ...dips]),
            translation: correctmc,
            mode: "multiple",
            targetLang: "TransFocus"
          };
        } else {
          q = {
            wordtotranslate: entry.word,
            options: [],
            translation: correctfill,
            mode: "fill",
            targetLang: "TransFocus"
          };
          // console.log({i})
          // console.log(entry.word)
          // console.log(correctfill)
        }
        break;
      }

      case "transFocus-to-word": {
        const prompt = `${entry.translation} (${focus})`;
        if (coin()) {
          const correct = entry.word;
          const dips: string[] = [];
          while (dips.length < 3) {
            const other = pick(data)[focus][aspect].word;
            if (other !== correct && !dips.includes(other)) dips.push(other);
          }
          q = {
            wordtotranslate: prompt,
            options: shuffleArray([correct, ...dips]),
            translation: correct,
            mode: "multiple",
            targetLang: "Word"
          };
        } else {
          q = {
            wordtotranslate: prompt,
            options: [],
            translation: entry.word,
            mode: "fill",
            targetLang: "Word"
          };
        }
        break;
      }
    }

    // always push exactly one question per iteration
    questions.push(q);
  }

  return questions;
}
