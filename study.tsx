import * as React from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { View, StyleSheet, Keyboard, Image, Text, TextInput, TouchableOpacity, TextStyle } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { useState } from "react";
import { useProfile } from "./ProfileContext";
import lessonNames from "../assets/utils/lessonnames.json";

export default function StudyScreen() {
  const router = useRouter();
  const {profile} = useProfile()
  const { mode, topic } = useLocalSearchParams();
  const [finishedLesson, setFinishedLesson] = React.useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showNotCompleted, setShowNotCompleted] = useState(false);

  const [selectedTab, setSelectedTab] = useState<"completed" | "notCompleted">("completed");

  const completedLessons = lessonNames.filter(
  lesson => profile?.completedLessons?.[lesson.lessonId]
);

const notCompletedLessons = lessonNames.filter(
  lesson => !profile?.completedLessons?.[lesson.lessonId]
);

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

      <ScrollView style={[styles.container, {alignItems: undefined}]}>

        <View style={[styles.titleSection, { backgroundColor: "gold" }]}>
          <Image
            style={styles.titleIcon}
          />
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>More Practice!</Text>
          </View>
        </View>

        <View style={styles.challengeGrid}>
                <TouchableOpacity onPress={() => {
                    const randomMode = Math.random() < 0.5 ? "multiple" : "fill";
                    router.push(`/quiz?mode=${randomMode}&topic=vocab`);}}
                    style={[styles.challengeBox, { backgroundColor: topicColors["vocab"] }]}>
                  <Text style={styles.challengeText}>Vocabulary{"\n"}Practice</Text>
                  <Image 
                  source={require("../assets/images/mdi_checkbox-outline.png")} style={styles.image8} />
                </TouchableOpacity>
        
                <TouchableOpacity onPress={() => {
                    const randomMode = Math.random() < 0.5 ? "multiple" : "fill";
                    router.push(`/quiz?mode=${randomMode}&topic=verbs`);}}
                    style={[styles.challengeBox, { backgroundColor: topicColors["verbs"] }]}>
                  <Text style={styles.challengeText}>Verb{"\n"}Conjugations</Text>
                  <Image source={require("../assets/images/mdi_checkbox-outline.png")} style={styles.image8} />
                </TouchableOpacity>
        
                <TouchableOpacity onPress={() => {
                    const randomMode = Math.random() < 0.5 ? "multiple" : "fill";
                    router.push(`/quiz?mode=${randomMode}&topic=sentences`);}}
                    style={[styles.challengeBox, { backgroundColor: topicColors["sentences"] }]}>
                  <Text style={styles.challengeText}>Sentence{"\n"}Practice</Text>
                  <Image source={require("../assets/images/mdi_checkbox-outline.png")} style={styles.image8} />
                </TouchableOpacity >
        
                <TouchableOpacity onPress={() => {
                    const randomMode = Math.random() < 0.5 ? "multiple" : "fill";
                    router.push(`/quiz?mode=${randomMode}&topic=grammar`);}}
                    style={[styles.challengeBox, { backgroundColor: topicColors["grammar"] }]}>
                  <Text style={styles.challengeText}>Grammar{"\n"}Practice</Text>
                  <Image source={require("../assets/images/mdi_checkbox-outline.png")} style={styles.image8} />
                </TouchableOpacity >
              </View>


            <View style={[styles.titleSection, { backgroundColor: "lightblue" }]}>
                    <Image
                        style={styles.titleIcon}
                    />
                    <View style={styles.titleContainer}>
                        <Text style={styles.titleText}>All Lessons</Text>
                    </View>
                    </View>

                <View style={styles.lessonBox}>
        {/* Completed Section */}
        <TouchableOpacity
            onPress={() => setShowCompleted(!showCompleted)}
            style={styles.sectionRow}
            >
            <Text style={styles.sectionLabel}>Completed</Text>
            <Text style={styles.triangle}>
                {showCompleted ? "▼" : "▶"}
            </Text>
        </TouchableOpacity>
        {showCompleted &&
          completedLessons.map((lesson, index) => (
            <TouchableOpacity
              key={lesson.lessonId}
              onPress={() =>
                router.push({
                  pathname: "/lesson",
                  params: { lessonId: String(lesson.lessonId), topic: "vocab" },
                })
              }
            >
              <Text style={styles.lessonItem}>
                Unit {lesson.lessonId}: {lesson.title}
              </Text>
            </TouchableOpacity>
          ))}


        {/* Not Completed Section */}
        <TouchableOpacity
            onPress={() => setShowNotCompleted(!showNotCompleted)}
            style={styles.sectionRow}
            >
            <Text style={styles.sectionLabel}>Not Completed</Text>
            <Text style={styles.triangle}>
                {showNotCompleted ? "▼" : "▶"}
            </Text>
        </TouchableOpacity>
          {showNotCompleted &&
          notCompletedLessons.map((lesson, index) => (
            <TouchableOpacity
              key={lesson.lessonId}
              onPress={() =>
                router.push({
                  pathname: "/lesson",
                  params: { lessonId: String(lesson.lessonId), topic: "vocab" },
                })
              }
            >
              <Text style={styles.lessonItem}>
                Unit {lesson.lessonId}: {lesson.title}
              </Text>
            </TouchableOpacity>
          ))}
      </View>


<View style={[styles.titleSection, { backgroundColor: "orange" }]}>
                    <Image
                        style={styles.titleIcon}
                    />
                    <View style={styles.titleContainer}>
                        <Text style={styles.titleText}>Your Studied Words</Text>
                    </View>
                    </View>
      <View style={{ marginTop: 20 }}>
  <TouchableOpacity
    style={styles.wordFilterButton}
    onPress={() => router.push("/dictionary?filter=mastered")}
  >
    <Text style={styles.wordFilterText}>Mastered Words</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.wordFilterButton}
    onPress={() => router.push("/dictionary?filter=in_training")}
  >
    <Text style={styles.wordFilterText}>In Training Words</Text>
  </TouchableOpacity>
</View>



      </ScrollView>

    
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

 challengeText: {
    fontSize: 16,
    fontWeight: "800",
    color: "rgba(0, 0, 0, 1)",
    textAlign: "center",
    flexWrap: "wrap",           // ensure wrapping
    lineHeight: 18,
    marginTop: 8
  },

challengeGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  paddingHorizontal: 20,
  marginTop: 10,
},

challengeBox: {
  backgroundColor: "white",
  borderRadius: 10,
  width: "48%",               // keeps boxes in 2 columns
  marginBottom: 15,
  alignItems: "center",
  paddingVertical: 15,        // ensure consistent height
  height: 80,             // enforce same box height
  justifyContent: "center",
  paddingHorizontal: 10,      // ensures text doesn't overflow
},

  image8: {
    aspectRatio: 1,
    width: 44,
    marginTop: 3,
  },

  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
  },
  lessonBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    marginHorizontal:20
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#eee",
    marginHorizontal: 5,
  },
  activeTab: {
    backgroundColor: "#ADD8E6",
  },
  tabText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  lessonList: {
    marginTop: 10,
  },
  lessonItem: {
    fontSize: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  
   sectionLabel: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
    color: "#333",
  },

  sectionRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: 10,
},

triangle: {
  fontSize: 16,
  color: "#555",
  marginLeft: 10,
},

wordFilterButton: {
  padding: 12,
  backgroundColor: "#eee",
  borderRadius: 10,
  marginBottom: 10,
  alignItems: "center",
},

wordFilterText: {
  fontSize: 16,
  color: "#333",
}



});
