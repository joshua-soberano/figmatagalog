import * as React from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { View, StyleSheet, Keyboard, Image, Text, TextInput, TouchableOpacity, TextStyle } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { useState } from "react";
import { useVocab } from "./vocabStorage";
import { VocabWord } from "@/assets/utils/updateVocab";
import { FlatList } from "react-native";
import { memo } from "react";


export default function DictionaryScreen() {
  const router = useRouter();
  const { mode, topic } = useLocalSearchParams();

  const topicParam = Array.isArray(topic) ? topic[0] : topic ?? "";
  const modeParam = Array.isArray(mode) ? mode[0] : mode ?? "";

  const [searchText, setSearchText] = useState("");
  const [finishedLesson, setFinishedLesson] = React.useState(false);
  const { filter: filterParam } = useLocalSearchParams();
  const [filter, setFilter] = useState<"all" | "mastered" | "in_training" | "unseen">(
  filterParam === "mastered" || filterParam === "in_training" || filterParam === "unseen"
    ? filterParam
    : "all"
);

  const { vocab, updateWord } = useVocab();

  const [searchLanguage, setSearchLanguage] = useState<"tagalog" | "english">("tagalog");


  // 1) Sort
const sortedVocab = [...vocab].sort((a, b) =>
  a.tagalog.localeCompare(b.tagalog)
);

// 2) Apply text‐search first
const searched = sortedVocab.filter((word) => {
  const term = searchText.toLowerCase();
  return searchLanguage === "tagalog"
    ? word.tagalog.toLowerCase().startsWith(term)
    : word.english.some(e => e.toLowerCase().startsWith(term));

});

// console.log(searched)
// console.log(filter)

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([
    { label: "All Words", value: "all" },
    { label: "Mastered Words", value: "mastered" },
    { label: "Mastered & In Training Words", value: "mastered_in_training" },
    { label: "In Training Words", value: "in_training" },
    { label: "Unseen Words", value: "unseen" },
  ]);

  const getFilteredWords = (filter: string, vocab: VocabWord[]) => {
  switch (filter) {
    case "mastered":
      return vocab.filter(word => word.mastered);
    case "in_training":
      return vocab.filter(word => !word.mastered && word.firstSeenDate);
    case "unseen":
      return vocab.filter(word => word.weight === 0 && !word.firstSeenDate);
    default:
      return vocab; // "all"
  }
  };

  const filteredWords = getFilteredWords(filter, searched);

  // console.log(filteredWords)


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

  const WordRow = React.memo(({ word, toggleMasteredState }: { word: VocabWord, toggleMasteredState: (word: VocabWord) => void }) => (
  <View style={{ flexDirection: "row" }}>
    <View style={[styles.gridRow, { width: "85%", backgroundColor: "#fff", borderBottomWidth: 1, borderColor: "#ccc" }]}>
      <View style={[styles.cell, { flex: 3 }]}>
        <Text style={styles.wordText}>{word.tagalog}</Text>
      </View>
      <View style={styles.verticalDivider} />
      <View style={[styles.cell, { flex: 3 }]}>
        <Text style={styles.wordText}>{word.english.join("; ")}</Text>
      </View>
    </View>

    <TouchableOpacity
      onPress={() => toggleMasteredState(word)}
      style={{
        width: "15%",
        height: 48,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        borderLeftWidth: 1,
        borderColor: "#ccc",
      }}
    >
      <View
        style={[
          styles.statusDot,
          {
            backgroundColor: word.mastered ? "green" : word.firstSeenDate ? "yellow" : "red",
            opacity: word.mastered ? 1 : 0.8,
          },
        ]}
      />
    </TouchableOpacity>
  </View>
));


const themeColor = topicColors[topicParam] || "#DCB0FE";

const toggleMasteredState = async (word: VocabWord) => {
  const isMastered   = word.mastered;
  const isInTraining = !word.mastered && !!word.firstSeenDate;
  const isUnseen     = !word.mastered && !word.firstSeenDate;

  // Start with a shallow clone
  const updatedWord: VocabWord = { ...word };

  if (isMastered) {
    // Mastered → In-Training
    updatedWord.mastered       = false;
    updatedWord.firstSeenDate  = word.firstSeenDate || new Date().toISOString();
    updatedWord.masteredDate   = undefined;     // ← clear the masteredDate
  }
  else if (isInTraining) {
    // In-Training → Mastered
    updatedWord.mastered       = true;
    updatedWord.masteredDate   = new Date().toISOString().split("T")[0];
    // firstSeenDate stays as-is
  }
  else if (isUnseen) {
    // Unseen → In-Training
    updatedWord.mastered       = false;
    updatedWord.firstSeenDate  = new Date().toISOString();
    updatedWord.weight         = 1;
  }

  await updateWord(updatedWord);
};




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

      <View style={[styles.container, {alignItems: undefined}]}>

        <View style={[styles.titleSection, { backgroundColor: "#FF8488" }]}>
          <Image
            style={styles.titleIcon}
          />
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>Dictionary</Text>
          </View>
        </View>

        <View style={styles.languageToggle}>
          <TouchableOpacity
            onPress={() => setSearchLanguage("tagalog")}
            style={styles.checkboxRow}
          >
            <View style={[styles.checkbox, searchLanguage === "tagalog" && styles.checkboxChecked]} />
            <Text style={styles.checkboxLabel}>Tagalog</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSearchLanguage("english")}
            style={styles.checkboxRow}
          >
            <View style={[styles.checkbox, searchLanguage === "english" && styles.checkboxChecked]} />
            <Text style={styles.checkboxLabel}>English</Text>
          </TouchableOpacity>
        </View>


        <TextInput
            style={styles.searchBar}
            placeholder="Search..."
            placeholderTextColor="#555"
            onChangeText={setSearchText}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
        />

{/* Legend: Mastered / In-Training / Unseen */}
<View style={styles.legendContainer}>
  <View style={styles.legendItem}>
    <View style={[styles.statusDot, { backgroundColor: "green" }]} />
    <Text style={styles.legendLabel}>Mastered</Text>
  </View>
  <View style={styles.legendItem}>
    <View style={[styles.statusDot, { backgroundColor: "yellow", opacity: 0.8 }]} />
    <Text style={styles.legendLabel}>In Training</Text>
  </View>
  <View style={styles.legendItem}>
    <View style={[styles.statusDot, { backgroundColor: "red", opacity: 0.4 }]} />
    <Text style={styles.legendLabel}>Unseen</Text>
  </View>
</View>


        <DropDownPicker
          open={open}
          value={filter}
          items={[
            { label: "All Words", value: "all" },
            { label: "Mastered", value: "mastered" },
            { label: "In Training", value: "in_training" },
            { label: "Unseen", value: "unseen" },
          ]}
          setOpen={setOpen}
          setValue={(val) => setFilter(val)}
          placeholder="Filter words"
          style={{
            backgroundColor: "#ADD8E6",
            borderRadius: 10,
            width: "90%",
            alignSelf: "center",
            marginBottom: 10,
          }}
          dropDownContainerStyle={{
            backgroundColor: "#EFEFEF",
            width: "90%",
            alignSelf: "center",
          }}
        />

        {/* Column Headers OUTSIDE the box */}
<View style={{ paddingHorizontal: 12, backgroundColor: "#E9D9B7", flex: 1 }}>

  {/* 1) HEADER ROW (static) */}
  <View style={{ flexDirection: "row" }}>
    {/* Tagalog + English container */}
    <View
      style={[
        styles.gridRow,
        {
          width: "85%",
          backgroundColor: "#fff",
          borderTopLeftRadius: 12,
          borderTopRightRadius: 0,
          borderBottomWidth: 1,
          borderColor: "#ccc",
        },
      ]}
    >
      <View style={[styles.cell, { flex: 3 }]}>
        <Text style={styles.columnHeaderText}>Tagalog</Text>
      </View>
      <View style={styles.verticalDivider} />
      <View style={[styles.cell, { flex: 3 }]}>
        <Text style={styles.columnHeaderText}>English</Text>
      </View>
    </View>

    {/* Status placeholder header */}
    <View
      style={{
        width: "15%",
        height: 48,
        backgroundColor: "#fff",
        borderTopRightRadius: 12,
        borderLeftWidth: 1,
        borderColor: "#ccc",
      }}
    />
  </View>

  {/* 2) SCROLLABLE CONTENT */}

<FlatList
  data={filteredWords}
  keyExtractor={(item, index) => item.id?.toString() ?? index.toString()}
  renderItem={({ item }) => (
    <WordRow word={item} toggleMasteredState={toggleMasteredState} />
  )}
  initialNumToRender={20}
  maxToRenderPerBatch={30}
  windowSize={10}
  removeClippedSubviews
/>

</View>






      </View>

    
    <View style={styles.bottomNavigation}>
      <TouchableOpacity onPress={() => router.push("/dashboard")}
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

  searchBar: {
  backgroundColor: "#ADD8E6", // Light blue
  borderRadius: 10,
  paddingHorizontal: 15,
  paddingVertical: 10,
  fontSize: 16,
  marginHorizontal: 20,
  marginBottom: 10,
  width: "90%",
  alignSelf: "center",
},

wordBox: {
  backgroundColor: "#FFF",
  borderRadius: 20,
  width: "90%",
  alignSelf: "center",
  marginTop: 10,
  marginBottom: 20,
  borderWidth: 1,
  borderColor: "#ccc",
},


columnHeaderText: {
  fontWeight: "bold",
  fontSize: 16,
  textAlign: "center",
  textDecorationLine: "underline",
},

wordText: {
  fontSize: 15,
  textAlign: "center",
},

gridHeaderContainer: {
  width: "90%",
  alignSelf: "center",
  marginTop: 15,
  marginBottom: 0,
},

languageToggle: {
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  marginBottom: 10,
  gap: 20,
},

checkboxRow: {
  flexDirection: "row",
  alignItems: "center",
},

checkbox: {
  width: 20,
  height: 20,
  borderWidth: 2,
  borderColor: "#333",
  marginRight: 8,
  backgroundColor: "#fff",
  borderRadius: 4,
},

checkboxChecked: {
  backgroundColor: "#333",
},

checkboxLabel: {
  fontSize: 16,
  fontWeight: "500",
},


statusText: {
  fontSize: 12,
  color: "#333",
},

statusDot: {
  width: 14,
  height: 14,
  borderRadius: 7,
},

horizontalDivider: {
  height: 1,
  backgroundColor: "#ccc",
  marginHorizontal: 10,
},

verticalDivider: {
  width: 1,
  backgroundColor: "#ccc",
  height: "100%", 
  flexShrink: 0

},

gridRow: {
  flexDirection: "row",
  alignItems: "stretch",  // <--- stretch children to fill height
  minHeight: 48,
  backgroundColor: "#fff",
},


cell: {
  paddingVertical: 10,
  paddingHorizontal: 8,
  flexShrink: 1
},

legendContainer: {
  flexDirection: "row",
  justifyContent: "space-around",
  alignItems: "center",
  marginVertical: 8,
  width: "90%",
  alignSelf: "center",
},
legendItem: {
  flexDirection: "row",
  alignItems: "center",
},
legendLabel: {
  marginLeft: 4,
  fontSize: 14,
  color: "#333",
},



});
