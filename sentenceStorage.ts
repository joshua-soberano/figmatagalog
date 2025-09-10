import AsyncStorage from "@react-native-async-storage/async-storage";
import defaultSentenceData from "@/assets/utils/all_lessons_sentences.json";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

// Key to use in AsyncStorage
const STORAGE_KEY = "sentenceWeights.v1";

// Type definition
export type SentenceItem = {
  id: number;
  tagalog: string;
  english: string;
  variants: string[];
  unit: number;
  weight: number; // 0 to 1
};

// Load all sentence items (from AsyncStorage or JSON seed)
export async function loadSentenceItems(): Promise<SentenceItem[]> {
  const json = await AsyncStorage.getItem(STORAGE_KEY);
  let items: SentenceItem[];

  if (json) {
    items = JSON.parse(json);
  } else {
    items = JSON.parse(JSON.stringify(defaultSentenceData));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  return items;
}

// Save the full list
export async function saveSentenceItems(items: SentenceItem[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// Update a single sentence by tagalog text
export async function updateSingleSentence(updated: SentenceItem) {
  const items = await loadSentenceItems();
  const index = items.findIndex(item => item.tagalog === updated.tagalog);
  if (index !== -1) {
    items[index] = updated;
    await saveSentenceItems(items);
  }
}

// Reset to default
export async function resetSentenceItems() {
  const freshCopy = JSON.parse(JSON.stringify(defaultSentenceData));
  await saveSentenceItems(freshCopy);
  console.log("resetSentenceItems");
}

// React context for sentence weights
const SentenceContext = createContext<{
  sentences: SentenceItem[];
  refresh: () => Promise<void>;
  updateSentence: (item: SentenceItem) => Promise<void>;
  reset: () => Promise<void>;
} | undefined>(undefined);

export const useSentences = () => {
  const context = useContext(SentenceContext);
  if (!context) throw new Error("useSentences must be used within a SentenceProvider");
  return context;
};

export const SentenceProvider = ({ children }: { children: React.ReactNode }) => {
  const [sentences, setSentences] = useState<SentenceItem[]>([]);

  const refresh = useCallback(async () => {
    const data = await loadSentenceItems();
    setSentences(data);
  }, []);

  const updateSentence = useCallback(async (item: SentenceItem) => {
    await updateSingleSentence(item);
    await refresh();
  }, [refresh]);

  const reset = useCallback(async () => {
    await resetSentenceItems();
    await refresh();
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return React.createElement(SentenceContext.Provider, {
  value: { sentences, refresh, updateSentence, reset }
}, children);

};

export {SentenceContext} ;
