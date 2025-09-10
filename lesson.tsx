import * as React from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { View, StyleSheet, Keyboard, Image, Text, TextInput, TouchableOpacity } from "react-native";
import { useEffect, useState } from "react";
import { lessonMap } from "@/assets/lessons/lessonindex";
import { useProfile } from "./ProfileContext";
import { useVocab } from "./vocabStorage";
import { useSentences } from "./sentenceStorage";
import Markdown from 'react-native-markdown-display';


export default function LessonScreen() {
  const router = useRouter();
  const {profile, toggleLessonCompleted, recordDailyQuest, recordUnitCompleted} = useProfile();
  const { mode, topic, lessonId  } = useLocalSearchParams();
  const { sentences, updateSentence } = useSentences();
  const params = useLocalSearchParams();
  const [content, setContent] = useState<{ lesson_writeup: string; vocab?: number[]; sentences?: number[] } | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const numericLessonId = Array.isArray(lessonId) ? parseInt(lessonId[0], 10) : parseInt(lessonId, 10);
  const isCompleted = profile?.completedLessons[numericLessonId];
  const {vocab, updateWord} = useVocab()
  const topicParam = Array.isArray(topic) ? topic[0] : topic;

  const topicColors: Record<string,string> = {
  vocab: "#DCB0FE",       // Purple
  verbs: "orange",        // Orange
  sentences: "olive",     // Olive
  grammar: "pink",        // Pink
  };

  const topicTitles: Record<string, string> = {
    vocab: "Vocabulary Practice",
    verbs: "Verb Conjugations",
    sentences: "Sentence Practice",
    grammar: "Grammar Practice",
  };

const themeColor = topicColors[topicParam] || "#DCB0FE";

const updateVocabAndSentences = async () => {
  const today = new Date().toISOString().split("T")[0];

  if (content?.vocab) {
    for (const id of content.vocab) {
      const word = vocab.find(w => w.id === id);
      if (word) {
        const updatedWord = {
          ...word,
          weight: word.weight || 1,
          firstSeenDate: word.firstSeenDate || today,
        };
        await updateWord(updatedWord);
      }
    }
  }

  if (content?.sentences) {
    for (const id of content.sentences) {
      const s = sentences.find(s => s.id === id);
      if (s) {
        const updatedSentence = {
          ...s,
          weight: s.weight || 1,
        };
        await updateSentence(updatedSentence);
      }
    }
  }
};


  useEffect(() => {
  const loadLesson = async () => {
    try {
      const id = Array.isArray(lessonId) ? parseInt(lessonId[0], 10) : parseInt(lessonId, 10);
      const loader = lessonMap[id];
      const data = await loader();


      setContent(data.default);
    } catch (error) {
      console.error("Error loading lesson:", error);
    }
  };

  loadLesson();
}, [lessonId]);


  if (!content) {
    return <Text>Loading lesson...</Text>;
  }


  return (
    <View style={{ flex: 1, backgroundColor: "#E9D9B7" }}>

      <View style={styles.headerRow}>
        <Image
          source={{
            uri: "https://cdn.builder.io/api/v1/image/assets/TEMP/af5676338e10bd7e496a262d91053bcc5b39e124?placeholderIfAbsent=true&apiKey=1d7b2223161b43eca772885930310230",
          }}
          style={styles.profileIcon}
        />
      </View>


    <ScrollView style={[styles.container, {alignItems: undefined}]} contentContainerStyle = {{ alignItems: "center" }}>

      <View style={[styles.titleSection, { backgroundColor: "lightblue" }]}>
        <Image
          source={{
            uri: "https://cdn.builder.io/api/v1/image/assets/TEMP/da75a8aea0ee0f95acce77ed32718d3080375406?placeholderIfAbsent=true&apiKey=1d7b2223161b43eca772885930310230",
          }}
          style={styles.titleIcon}
        />
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>Lessons</Text>
        </View>
      </View>

      <View
  style={[
    styles.lessonStatusContainer,
    { backgroundColor: isCompleted ? "#88D498" : "#FDD835" },
  ]}
>
  <TouchableOpacity
  style={styles.checkbox}
  onPress={() => {
  toggleLessonCompleted(numericLessonId);
  recordDailyQuest("lesson");
  recordUnitCompleted(numericLessonId);

  setShowPopup(true); // ✅ Show popup immediately

  // ✅ Kick off background updates (non-blocking)
  updateVocabAndSentences().catch(console.error);
}}

>

    {isCompleted && <View style={styles.checkboxInner} />}
  </TouchableOpacity>

  <Text style={styles.lessonStatusText}>
    {isCompleted ? "✔️ I finished this lesson" : "🟡 Still Learning. \n Click When Done"}
  </Text>
</View>


<ScrollView contentContainerStyle={{ padding: 16 }}>
      {content.vocab && (
  <>
    <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12, alignSelf: 'flex-start' }}>
      📚 Vocabulary
    </Text>
    {content.vocab.map((id, index) => {
      const word = vocab.find(w => w.id === id);
      if (!word) return null;
      return (
        <View key={index} style={{ marginBottom: 6, alignSelf: 'flex-start' }}>
          <Text style={{ fontSize: 16 }}>
            <Text style={{ fontWeight: 'bold' }}>{word.tagalog}</Text>
            {" – "}
            {Array.isArray(word.english) ? word.english.join('; ') : word.english}
            {word.partOfSpeech && (
              <Text style={{ fontStyle: 'italic' }}> ({word.partOfSpeech})</Text>
            )}
          </Text>
        </View>
      );
    })}
    <View style={{ height: 16 }} />
  </>
)}


  <Markdown
    style={{
      body: { fontSize: 16, lineHeight: 24 },
      heading1: { fontSize: 26, fontWeight: 'bold', marginBottom: 12 },
      heading2: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
      heading3: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
      paragraph: { marginBottom: 12 },
      listItem: { marginLeft: 16 },
      strong: { fontWeight: 'bold' },
      em: { fontStyle: 'italic' },
    }}
  >
    {content.lesson_writeup}
  </Markdown>
</ScrollView>

<View
  style={[
    styles.lessonStatusContainer,
    { backgroundColor: isCompleted ? "#88D498" : "#FDD835" },
  ]}
>
  <TouchableOpacity
  style={styles.checkbox}
  onPress={() => {
  toggleLessonCompleted(numericLessonId);
  recordDailyQuest("lesson");
  recordUnitCompleted(numericLessonId);

  setShowPopup(true); // ✅ Show popup immediately

  // ✅ Kick off background updates (non-blocking)
  updateVocabAndSentences().catch(console.error);
}}

>

    {isCompleted && <View style={styles.checkboxInner} />}
  </TouchableOpacity>

  <Text style={styles.lessonStatusText}>
    {isCompleted ? "✔️ I finished this lesson" : "🟡 Still Learning. \n Click When Done"}
  </Text>
</View>



    </ScrollView>


{showPopup && (
  <View style={styles.popupOverlay}>
    <View style={styles.popupBox}>
      <Text style={styles.popupText}>🎉 Great job! You’ve finished this lesson.</Text>
      <TouchableOpacity
        style={styles.popupButton}
        onPress={() => {
          setShowPopup(false);
          router.push("/dashboard");
        }}
      >
        <Text style={styles.popupButtonText}>← Return to Dashboard</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.popupButton, { backgroundColor: "#ccc" }]}
        onPress={() => setShowPopup(false)}
      >
        <Text style={[styles.popupButtonText, { color: "#333" }]}>Stay on this page</Text>
      </TouchableOpacity>
    </View>
  </View>
)}

    
    <View style={styles.bottomNavigation}>
      <TouchableOpacity onPress={() => router.push("/dictionary")}
        style={styles.navItem}>
         <Image
          source={require("../assets/images/material-symbols_dictionary.png")}
          style={[styles.navIcon, { width: 50, height: 50 }]}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push("/study")}
        style={styles.navItem}>
        <Image
          source={require("../assets/images/desk.png")}
          style={styles.navIcon}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push("/dashboard")}
        style={styles.navItem}>
         <Image
          source={require("../assets/images/material-symbols_home-outline.png")}
          style={[styles.navIcon, { width: 50, height: 50 }]}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push("/profile")}
        style={styles.navItem}>
        <Image
          source={require("../assets/images/pajamas_profile.png")}
          style={styles.navIcon}
        />
      </TouchableOpacity>
      </View>

    </View>
    
  );
}

const styles = StyleSheet.create({
  backButton: {
    padding: 10,
    backgroundColor: "#eee",
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  container: {
    flex: 1,
    maxWidth: 480,
    width: "100%",
    alignSelf: "center",
    alignItems: "center",
  },
  headerRow: {
    flexDirection: "row",
    marginTop: 5,
    width: "100%",
    maxWidth: 338,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  profileIcon: {
    width: 45,
    height: 45,
    resizeMode: "contain",
    marginRight: -45,
  },
  titleSection: {
    width: "100%",              // Make the section fill the container            // Match your main container's maxWidth
    maxWidth: 480,
    flexDirection: "row",
    paddingHorizontal: 19,
    paddingTop: 10,
    paddingBottom: 10,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCB0FE", // Purple background
    alignSelf: "center",        // Center the section if maxWidth is set
    marginVertical: 10,              // Optional: space from header
  },
  titleIcon: {
    width: 44,
    height: 44,
    resizeMode: "contain",
  },
  titleContainer: {
    alignItems: "center",
    position: "absolute"
  },
  titleText: {
    fontFamily: "Inter",
    fontSize: 25,
    color: "rgba(0, 0, 0, 1)",
    fontWeight: "800",
    textAlign: "center",
    textDecorationLine: "underline",
  },

  navItem: {
    padding: 15,
    width: 75,
    height: 75,
    alignItems: "center",
    justifyContent: "center",
    //backgroundColor: "white",
    
  },

  bottomNavigation: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    backgroundColor: "#D9D9D9",
    alignSelf: "stretch",
    flexDirection: "row",
    marginTop: 5,
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "space-evenly",
    bottom: 0,
    height: 80
  },
  navIcon: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },

lessonStatusContainer: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  padding: 15,
  borderRadius: 15,
  marginHorizontal: 20,
  marginBottom: 8,
  minHeight: 60,
  minWidth: 300, // keeps it wide enough for both texts
},


checkbox: {
  width: 24,
  height: 24,
  borderRadius: 4,
  borderWidth: 2,
  borderColor: "#333",
  backgroundColor: "#fff",
  marginRight: 12,
  alignItems: "center",
  justifyContent: "center",
},

checkboxInner: {
  width: 14,
  height: 14,
  backgroundColor: "#333",
  borderRadius: 2,
},

lessonStatusText: {
  fontSize: 16,
  fontWeight: "bold",
},

popupOverlay: {
  position: "absolute",
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: "rgba(0, 0, 0, 0.4)",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
},

popupBox: {
  backgroundColor: "white",
  padding: 24,
  borderRadius: 16,
  width: "80%",
  alignItems: "center",
},

popupText: {
  fontSize: 18,
  fontWeight: "bold",
  textAlign: "center",
  marginBottom: 16,
},

popupButton: {
  backgroundColor: "#DCB0FE",
  paddingVertical: 12,
  paddingHorizontal: 20,
  borderRadius: 10,
  marginTop: 10,
},

popupButtonText: {
  fontSize: 16,
  fontWeight: "600",
  color: "#000",
},


});
