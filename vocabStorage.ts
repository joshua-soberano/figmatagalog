import AsyncStorage from "@react-native-async-storage/async-storage";
import { VocabWord } from "@/assets/utils/likelihood";
import defaultVocabWords from "@/assets/utils/all_lessons_vocab.json";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

// Key to use in AsyncStorage
const STORAGE_KEY = "vocabWords";

export async function loadVocabWords(): Promise<VocabWord[]> {
  const json = await AsyncStorage.getItem(STORAGE_KEY);
  let words: VocabWord[];

  if (json) {
    words = JSON.parse(json);
  } else {
    // First time: seed with default JSON
    words = JSON.parse(JSON.stringify(defaultVocabWords));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(words));
  }

  // Add masteredDate for any mastered word missing it
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  let updated = false;

  for (const word of words) {
    if (word.mastered && !word.masteredDate) {
      word.masteredDate = today;
      updated = true;
    }
  }

  if (updated) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(words));
  }

  return words;
}


export async function saveVocabWords(words: VocabWord[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(words));
}

export async function updateSingleWord(updated: VocabWord) {
  const words = await loadVocabWords();
  const index = words.findIndex(w => w.id === updated.id);
  if (index !== -1) {
    words[index] = updated;
    await saveVocabWords(words);
  }
}

export async function resetVocabWords() {
  const freshCopy = JSON.parse(JSON.stringify(defaultVocabWords));
  await saveVocabWords(freshCopy);
  console.log("resetVocabWords")
}


// React context for vocab
const VocabContext = createContext<{
  vocab: VocabWord[];
  refresh: () => Promise<void>;
  updateWord: (word: VocabWord) => Promise<void>;
  reset: () => Promise<void>;
} | undefined>(undefined);

export const useVocab = () => {
  const context = useContext(VocabContext);
  if (!context) throw new Error("useVocab must be used within a VocabProvider");
  return context;
};

export const VocabProvider = ({ children }: { children: React.ReactNode }) => {
  const [vocab, setVocab] = useState<VocabWord[]>([]);

  const refresh = useCallback(async () => {
    const data = await loadVocabWords();
    setVocab(data);
  }, []);

  const updateWord = useCallback(async (word: VocabWord) => {
    await updateSingleWord(word);
    await refresh();
  }, [refresh]);

  const reset = useCallback(async () => {
    await resetVocabWords();
    await refresh();
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
  React.createElement(VocabContext.Provider, { value: { vocab, refresh, updateWord, reset } }, children)
);

};

export { VocabContext };
