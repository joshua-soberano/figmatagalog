import { shuffleArray } from "./questionUtils";
import { getVocabWithLikelihoods } from "@/assets/utils/likelihood";

function weightedRandomIndex(weights: number[]): number {
  const rnd = Math.random();
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (rnd <= sum) return i;
  }
  return weights.length - 1; // fallback
}

export async function generateVocabQuestions(count = 50, profileUnit = 1) {
  const modes = ["multiple", "fill"] as const;
  const questions = [];

  const { vocabList, vocabLikelihoods } = await getVocabWithLikelihoods(profileUnit);

  for (let i = 0; i < count; i++) {
    const index = weightedRandomIndex(vocabLikelihoods);
    const item = vocabList[index];
    const direction = Math.random() < 0.5 ? "T2E" : "E2T";

    let wordtotranslate: string;
let translation: string;
let acceptedAnswers: string[];
let wrongPool: string[];

if (direction === "T2E") {
  wordtotranslate = item.tagalog;
  acceptedAnswers = Array.isArray(item.english) ? item.english : [item.english];
  translation = acceptedAnswers[0];
  wrongPool = vocabList
    .filter(e => !acceptedAnswers.includes(e.english as any))
    .flatMap(e => (Array.isArray(e.english) ? e.english : [e.english]));
} else {
  wordtotranslate = Array.isArray(item.english)
  ? item.english.length > 1
    ? item.english[item.english.length - 1]  // ✅ last if multiple
    : item.english[0]                         // ✅ first if only one
  : item.english;                             // ✅ fallback if it's not an array

  translation = item.tagalog;
  acceptedAnswers = [item.tagalog];
  wrongPool = vocabList
    .filter(e => e.tagalog !== item.tagalog)
    .map(e => e.tagalog);
}




    const wrongOptions = shuffleArray(wrongPool).slice(0, 3);
    const correctOptions = Array.isArray(translation) ? translation : [translation];
    const allOptions = shuffleArray([...correctOptions, ...wrongOptions]);
    const mode = modes[Math.floor(Math.random() * modes.length)];
    const targetLang: "English" | "Tagalog" = direction === "T2E" ? "English" : "Tagalog";

      questions.push({
  wordtotranslate,
  options: allOptions,
  translation,
  acceptedAnswers,
  mode,
  targetLang,
});





  }

  return questions;
}
