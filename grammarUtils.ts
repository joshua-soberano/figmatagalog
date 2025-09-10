import pronounsData from "../assets/utils/personal_pronouns.json";
import { shuffleArray } from "./questionUtils";

// Type definitions for clarity and safety
export type Role = "ang" | "ng" | "sa";
export type Person = "1st" | "2nd" | "3rd";
export type Number = "singular" | "plural";
export type Inclusivity = "inclusive" | "exclusive";

export type GrammarQuestion = {
  wordtotranslate: string;
  options: string[];
  translation: string;
  mode: "multiple" | "fill";
  targetLang: "Pronoun" | "Translation";
  acceptedAnswers?: string[];
};


export function generateGrammarQuestions(count = 10): GrammarQuestion[] {
  const questions: GrammarQuestion[] = [];

  const roles: Role[] = ["ang", "ng", "sa"];
  const persons: Person[] = ["1st", "2nd", "3rd"];
  const numbers: Number[] = ["singular", "plural"];
  const inclusivity: Inclusivity[] = ["inclusive", "exclusive"];

  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const coin = (): boolean => Math.random() < 0.5;

  for (let i = 0; i < count; i++) {
    const role = pick(roles);
    const person = pick(persons);
    const number = pick(numbers);

    let tagalogForm = "";
    let label = `(${role}, ${person}, ${number})`;
    let translation = "";

    if (person === "1st" && number === "plural") {
      const inclExcl = pick(inclusivity);
      const pluralEntry = (pronounsData[role][person][number] as Record<Inclusivity, { form: string; translation: string }>)[inclExcl];
      tagalogForm = pluralEntry.form;
      translation = pluralEntry.translation;
      label = `(${role}, ${person}, ${number}, ${inclExcl})`;
    } else {
      const entry = pronounsData[role][person][number] as { form: string; translation: string };
      tagalogForm = entry.form;
      translation = entry.translation;
    }

    if (!tagalogForm || !translation) continue;

    // pick question variant
    const variant = Math.floor(Math.random() * 4);
    let mode: "multiple" | "fill" = "multiple";
    let options: string[] = [];
    let correct: string = "";
    let field: "form" | "translation" | "label" = "form";
    let prompt: string = "";

    const makeDistractors = (field: "form" | "translation" | "label", correct: string): string[] => {
      const dips: string[] = [];
      while (dips.length < 3) {
        const r2 = pick(roles);
        const p2 = pick(persons);
        const n2 = pick(numbers);
        let val: string;
        if (p2 === "1st" && n2 === "plural") {
          const ie2 = pick(inclusivity);
          const pe2 = (pronounsData[r2][p2][n2] as Record<Inclusivity, { form: string; translation: string }>)[ie2];
          if (field === "label") {
            val = `(${r2}, ${p2}, ${n2}, ${ie2})`;
          } else {
            val = pe2[field];
          }
        } else {
          const e2 = pronounsData[r2][p2][n2] as { form: string; translation: string };
          if (field === "label") {
            val = `(${r2}, ${p2}, ${n2})`;
          } else {
            val = e2[field];
          }
        }
        if (val && val !== correct && !dips.includes(val)) dips.push(val);
      }
      return dips;
    };

    switch (variant) {
      case 0:
        // label -> form
        field = "form";
        correct = tagalogForm;
        mode = coin() ? "multiple" : "fill";
        if (mode === "multiple") options = shuffleArray([correct, ...makeDistractors(field, correct)]);
        prompt = label;
        break;
      case 1:
        // form -> label (always MC)
        field = "label";
        correct = label;
        mode = "multiple";
        options = shuffleArray([correct, ...makeDistractors(field, correct)]);
        prompt = tagalogForm;
        break;
      case 2:
        // form -> translation
        field = "translation";
        correct = translation;
        mode = coin() ? "multiple" : "fill";
        if (mode === "multiple") options = shuffleArray([correct, ...makeDistractors(field, correct)]);
        prompt = tagalogForm;
        break;
      case 3:
        // translation -> form
        field = "form";
        correct = tagalogForm;
        mode = coin() ? "multiple" : "fill";
        if (mode === "multiple") options = shuffleArray([correct, ...makeDistractors(field, correct)]);
        prompt = translation;
        break;
    }

    const normalized = (s: string) => s.trim().toLowerCase();
const acceptedAnswers =
  field === "translation" && mode === "fill"
    ? (() => {
        const variants = correct.split("/").map(s => s.trim());
        const expanded = variants.flatMap(ans => {
          const withoutParen = ans.replace(/\s*\(.*?\)/, "").trim();
          return withoutParen !== ans ? [withoutParen, ans] : [ans];
        });
        return [...new Set(expanded)]; // dedupe
      })()
    : undefined;


questions.push({
  wordtotranslate: prompt,
  options,
  translation: correct,
  mode,
  targetLang: field === "label" ? "Pronoun" : "Translation",
  acceptedAnswers,
});



  }

  return questions;
}
