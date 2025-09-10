import { Stack } from "expo-router";
import { VocabProvider } from "./vocabStorage";
import { ProfileProvider } from "./ProfileContext"; // update path as needed
import { SentenceProvider } from "./sentenceStorage";
import { useEffect } from 'react';
import { Asset } from 'expo-asset';
import { loadOnnxModel } from '@/assets/utils/loadmodel'

export default function RootLayout() {
  useEffect(() => {
    // Preload ONNX model through the proper helper
    loadOnnxModel().then(() => {
      console.log("Model preloaded");
    }).catch(err => {
      console.error("Failed to preload model:", err);
    });
  }, []);

  return (
    <VocabProvider>
      <ProfileProvider>
        <SentenceProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="quiz" options={{ headerShown: false }} />
          <Stack.Screen name="dashboard" options={{ headerShown: false }} />
          <Stack.Screen name="lesson" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
          <Stack.Screen name="dictionary" options={{ headerShown: false }} />
          <Stack.Screen name="study" options={{ headerShown: false }} />
          <Stack.Screen name="review" options={{ headerShown: false }} />
          <Stack.Screen name="conjugation" options={{ headerShown: false }} />
          <Stack.Screen name="grammar" options={{ headerShown: false }} />
        </Stack>
        </SentenceProvider>
      </ProfileProvider>
    </VocabProvider>
  );
}
 