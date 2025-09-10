import { shuffleArray } from "./questionUtils";
import { useProfile } from "@/app/ProfileContext";
import { useSentences } from "@/app/sentenceStorage";
import type { SentenceItem } from "@/app/sentenceStorage";

type SentenceQuestion = {
  wordtotranslate: string;
  options: string[];
  translation: string;
  mode: "multiple" | "fill";
  targetLang: "English" | "Tagalog";
};

// Optional utility if needed for shuffling with weights
function weightedSample<T extends { score: number }>(items: T[]): T {
  const total = items.reduce((sum, item) => sum + item.score, 0);
  const rand = Math.random() * total;
  let running = 0;
  for (const item of items) {
    running += item.score;
    if (rand <= running) return item;
  }
  return items[items.length - 1]; // fallback
}

export function generateSentenceQuestions(
  count: number,
  profile: { recentUnits: number[] },
  sentences: SentenceItem[]
): SentenceQuestion[] {
  const { recentUnits } = profile;
  // console.log(recentUnits)
  // console.log("all sentences:", sentences.map(s => s.id));


  // Filter only sentences from recent (i.e. completed) units
  const eligibleSentences = sentences.filter(s =>
    recentUnits.includes(s.unit)
  );

  if (eligibleSentences.length === 0) {
    return [];
  }

  // Score using recency rankings
  const unitRecencyMultipliers = recentUnits.reduce((acc, unit, idx) => {
    acc[unit] = 1 - idx * 0.3;
    return acc;
  }, {} as Record<number, number>);

  const weightedPool = eligibleSentences.map(s => {
    const score = s.weight * (unitRecencyMultipliers[s.unit] ?? 0.1);
    return { ...s, score };
  });

  const selected: SentenceItem[] = [];
  for (let i = 0; i < count; i++) {
    selected.push(weightedSample(weightedPool));
  }

  return selected.map(item => {
    const shuffledVariants = shuffleArray(item.variants).slice(0, 3);
    const allOptions = shuffleArray([item.english, ...shuffledVariants]);
    const mode: "multiple" | "fill" = Math.random() < 0.5 ? "multiple" : "fill";
    const targetLang = "English";
    
    return {
      wordtotranslate: item.tagalog,
      options: allOptions,
      translation: item.english,
      mode,
      targetLang,
    };
  });
}

