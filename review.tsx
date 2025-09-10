import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { useProfile } from "./ProfileContext";
import { useRouter } from "expo-router";
import { loadVocabWords, updateSingleWord } from "./vocabStorage";
import { updateWordAfterAnswer } from "@/assets/utils/updateVocab";
import type { WrongAnswerRecord } from "./ProfileContext";
import { useSentences} from "./sentenceStorage";
import { updateSentenceAfterAnswer, overrideSentenceAsCorrect } from "@/assets/utils/updatesentences";

type WrongAnswer = WrongAnswerRecord;

const typeColors: Record<string, string> = {
  vocab: "#DCB0FE",
  verbs: "orange",
  sentences: "olive",
  grammar: "pink",
};

export default function ReviewScreen() {
  const router = useRouter();
  const { profile, loading, removeWrongAnswer, correctPreviousMistake } = useProfile();
  const { sentences, updateSentence } = useSentences();
  const [searchText, setSearchText] = useState("");
  const [openFilter, setOpenFilter] = useState(false);
  const [topicFilter, setTopicFilter] = useState<"all"|"vocab"|"verbs"|"sentences"|"grammar">("all");
  const filterItems = [
    { label: "All",       value: "all" },
    { label: "Vocab",     value: "vocab" },
    { label: "Verbs",     value: "verbs" },
    { label: "Sentences", value: "sentences" },
    { label: "Grammar",   value: "grammar" },
  ];

  if (loading || !profile) {
    return <Text style={styles.loading}>Loading profile…</Text>;
  }

  // sort descending, then apply filter
  const sortedWrong = [...profile.wrongAnswers]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const displayed = sortedWrong
  .filter(w =>
    (topicFilter === "all" || w.topic === topicFilter) &&
    (w.prompt.toLowerCase().includes(searchText.toLowerCase()) ||
     w.userAnswer.toLowerCase().includes(searchText.toLowerCase()) ||
     w.correctAnswer.toLowerCase().includes(searchText.toLowerCase()))
  );

const handleOverride = async (item: WrongAnswer) => {
  if (item.topic === "vocab") {
    const allWords = await loadVocabWords();
    const matched = allWords.find(
      w => w.tagalog === item.prompt || w.english.includes(item.prompt)
    );


    if (!matched) {
      console.warn("No vocab match for", item.prompt);
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const updated = updateWordAfterAnswer(
      matched,
      true, // ← manually overriding as correct
      item.topic,
      item.mode,
      today
    );
    await updateSingleWord(updated);
    console.log(`✅ Overridden vocab: ${updated.tagalog} updated to weight ${updated.weight}`);
  } 

  else if (item.topic === "sentences") {
  const match = sentences.find(
    s => s.english === item.correctAnswer || s.tagalog === item.prompt
  );

  if (!match) {
    console.warn("No sentence match for", item.prompt);
  } else {
    const updated = await overrideSentenceAsCorrect(match);
    console.log(`✅ Sentence overridden: new weight ${updated.weight}`);
  }
}


  // Update profile stats
  correctPreviousMistake(item.topic);
  removeWrongAnswer(item.id);
};



  return (
  <View style={{ flex: 1, backgroundColor: "#E9D9B7" , paddingTop: 30}}>
   {/* 1) Lifted-out dropdown so it won’t be clipped by FlatList */}
   <View style={{ padding: 20, zIndex: 1000, elevation: 1000 }}>
     <Text style={styles.sectionTitle}>Wrong Answers</Text>
     <TextInput
        placeholder="Search Here..."
        placeholderTextColor="black"
        value={searchText}
        onChangeText={setSearchText}
        style={{
            padding: 10,
            backgroundColor: "white",
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "#ccc",
            marginBottom: 10
        }}
        />

     <View style={{ zIndex: 1000, elevation: 1000 }}>
       <DropDownPicker
         open={openFilter}
         value={topicFilter}
         items={filterItems}
         setOpen={setOpenFilter}
         setValue={val => setTopicFilter(val as any)}
         style={styles.filter}
         dropDownContainerStyle={[styles.filter, { zIndex: 2000, elevation: 2000 }]}
       />
     </View>
   </View>

    <FlatList
      data={displayed}
      keyExtractor={(_, i) => i.toString()}
      contentContainerStyle={styles.content}
     ListHeaderComponent={null}
      renderItem={({ item }) => (
<View style={[styles.wrongItem, { backgroundColor: typeColors[item.topic] }]}>
  <Text style={styles.wrongPrompt}>{item.prompt}</Text>
  <Text style={styles.wrongText}>You answered: {item.userAnswer}</Text>
  <Text style={styles.wrongText}>Correct: {item.correctAnswer}</Text>
  <Text style={styles.wrongDate}>
    {new Date(item.timestamp).toLocaleString()}
  </Text>

  {item.mode === "fill" && (
    <TouchableOpacity
      style={styles.overrideButton}
      onPress={() => handleOverride(item)}
    >
      <Text style={styles.overrideButtonText}>Mark as Correct</Text>
    </TouchableOpacity>
  )}
</View>
  )}
    />

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
  container: {
    flex: 1,
  },
  headerContainer: { marginBottom: 10 },
  sectionTitle: { fontSize: 20, fontWeight: "600", marginBottom: 8 },
  filter: { backgroundColor: "#ADD8E6", borderRadius: 8, marginBottom: 16 },
  content: {
    padding: 20,
    maxWidth: 480,
    width: "100%",
    alignSelf: "center"
  },
  loading: {
    marginTop: 100,
    textAlign: "center",
    fontSize: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 5,
  },
  stat: {
    fontSize: 16,
    marginBottom: 5,
  },
  quizItem: {
    fontSize: 14,
    color: "#444",
    marginTop: 2,
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
    navItem: {
    padding: 15,
    width: 75,
    height: 75,
    alignItems: "center",
    justifyContent: "center",
    //backgroundColor: "white",
    
  },

  overrideButton: {
  backgroundColor: "green",
  paddingVertical: 6,
  paddingHorizontal: 10,
  borderRadius: 6,
  marginTop: 8,
},
overrideButtonText: {
  color: "white",
  fontWeight: "bold",
  fontSize: 14,
  textAlign: "center",
},

  homeButton: {
  marginTop: 8,
  backgroundColor: "#007AFF",
  paddingVertical: 8,
  paddingHorizontal: 8,
  borderRadius: 8,
},
homeButtonText: {
  color: "#FFF",
  fontSize: 12,
  fontWeight: "600",
  textAlign: "center",
},

wrongItem: {
  marginTop: 10,
  padding: 10,
  backgroundColor: "#FFF",
  borderRadius: 8,
  borderWidth: 1,
  borderColor: "#CCC",
},
wrongPrompt: {
  fontSize: 16,
  fontWeight: "600",
  marginBottom: 4,
},
wrongText: {
  fontSize: 14,
  marginBottom: 2,
},
wrongDate: {
  fontSize: 12,
  color: "#666",
  marginTop: 4,
},

});
