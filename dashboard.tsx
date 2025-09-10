import * as React from "react";
import { View, StyleSheet, Image, TouchableOpacity, Text, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useProfile } from "./ProfileContext";
import lessonNames from "../assets/utils/lessonnames.json";
import { useVocab } from "./vocabStorage"; // or adjust path if needed
import { useEffect } from "react";



export default function DashboardScreen() {
  const router = useRouter()
  const { resetProfile, recordDailyQuest, profile, loading } = useProfile();
  const { vocab } = useVocab();

  if (loading || !profile) {
  return <Text style={styles.loading}>Loading dashboard...</Text>;
}

  const todayString = new Date().toISOString().split("T")[0];
  const quizzesToday = profile?.quizzes.filter(q =>
  q.date.startsWith(todayString)
  ) || [];

  const newInTrainingToday = vocab.filter(word => {
  if (!word.firstSeenDate) return false;
  const seenDate = new Date(word.firstSeenDate).toISOString().split("T")[0];
  return seenDate === todayString;
}).length;

  const newlyMasteredToday = vocab.filter(word => {
  if (!word.mastered || !word.masteredDate) return false;
  const masteredDate = new Date(word.masteredDate).toISOString().split("T")[0];
  return masteredDate === todayString;
}).length;


  const topicColors: Record<string, string> = {
  vocab: "#DCB0FE",       // Purple
  verbs: "orange",        // Orange
  sentences: "olive",     // Olive
  grammar: "pink",        // Pink
  };

  if (loading || !profile) {
    return <Text style={styles.loading}>Loading dashboard...</Text>;
  }

  const todayStats = profile.dailyQuestionStats?.[todayString] ?? {
    totalAnswered: 0,
    totalCorrect: 0,
  };



  const incompleteLessons = lessonNames
  .filter(lesson => !profile?.completedLessons?.[lesson.lessonId])
  .sort((a, b) => a.lessonId - b.lessonId)
  .slice(0, 3);

  const masteredWords = vocab.filter(word => word.mastered).length;




  const inTrainingWords = vocab.filter(word =>
    !word.mastered && word.firstSeenDate
  ).length;

  const unseenWords = vocab.filter(word => !word.firstSeenDate).length;


  const todayStr = new Date().toISOString().split("T")[0];
  const completedToday: Record<string, boolean> = {
    vocab: profile.dailyChallengesCompleted?.["vocab"] === todayStr,
    verbs: profile.dailyChallengesCompleted?.["verbs"] === todayStr,
    sentences: profile.dailyChallengesCompleted?.["sentences"] === todayStr,
    grammar: profile.dailyChallengesCompleted?.["grammar"] === todayStr,
  };

  const allChallengesDone = ["vocab", "verbs", "sentences", "grammar"]
    .every(topic => profile.dailyChallengesCompleted?.[topic] === todayString);

  const completedALesson = Object.values(profile.completedLessons || {}).some(v => v);
  const masteredTenWords = newlyMasteredToday >= 10;

  const done = profile.dailyQuestsCompleted;

  const allDone      = done.all === todayStr;
  const didLesson    = done.lesson === todayStr;
  const mastered10   = done.masterTen === todayStr; 
  
 
 
  useEffect(() => {
      if (masteredTenWords && profile.dailyQuestsCompleted?.masterTen !== todayString) {
        recordDailyQuest("masterTen");
      }
    }, [masteredTenWords, todayString]);

  useEffect(() => {
    const hasCompletedToday = Object.entries(profile.completedLessons || {}).some(
      ([_, completed]) => completed
    );

    if (hasCompletedToday && profile.dailyQuestsCompleted?.lesson !== todayStr) {
      recordDailyQuest("lesson");
    }
  }, [profile.completedLessons, todayStr]);


  useEffect(() => {
    if (allChallengesDone && profile.dailyQuestsCompleted?.all !== todayStr) {
      recordDailyQuest("all");
    }
  }, [allChallengesDone, todayStr]);

  
  return (
    <View style = {styles.screen}>
      <View style={styles.headerRow}>
          <View style={styles.streakContainer}>
            <Image
              source={{
                uri: "https://cdn.builder.io/api/v1/image/assets/TEMP/4020021c1f33b795d4f0b24240c96ce7262bd846?placeholderIfAbsent=true&apiKey=1d7b2223161b43eca772885930310230",
              }}
              style={styles.streakIcon}
            />
            <Text style={styles.streakText}> {profile.streak} Day Streak!</Text>
          </View>
          <Image
            source={{uri: "https://cdn.builder.io/api/v1/image/assets/TEMP/af5676338e10bd7e496a262d91053bcc5b39e124?placeholderIfAbsent=true&apiKey=1d7b2223161b43eca772885930310230",}}
            style={styles.profileIcon}
            />
        </View>
      <View style = {styles.dashboardContent}>
      <View style={styles.container}>
        <View style={styles.view1}>
          <View style={styles.view4}>
            <View style={styles.view5}>
              <Text style={styles.dashboardTitle}>Joshua's Dashboard</Text>
            </View>
            <View style={styles.view6}>
              <View style={styles.view7}>
                <Text style={styles.view8}>Daily Quests</Text>
                <View style={styles.view9}>
                  <Text style={styles.checkboxText}>
                    {allDone ? "✅" : "⬜️"}
                  </Text>
                  <Text style={styles.questText}>
                    Complete All Daily Challenges
                  </Text>
                </View>
                <View style={styles.view9}>
                  <Text style={styles.checkboxText}>
                    {didLesson ? "✅" : "⬜️"}
                  </Text>

                  <Text style={styles.questText}>Complete One Lesson Today</Text>
                </View>
                <View style={styles.view9}>
                  <Text style={styles.checkboxText}>
                    {mastered10 ? "✅" : "⬜️"}
                  </Text>
                  <Text style={styles.questText}>Master Ten More Words Today</Text>
                </View>
              </View>
              <View style={styles.view13}>
                <View style={styles.view14}>
                  <Text style={styles.view15}>Today's Progress</Text>
                  <Text style={styles.view16}>
                    {newInTrainingToday} New Words Learned!{"\n"}{newlyMasteredToday} Words Mastered!{"\n"}{(todayStats.totalCorrect*100/todayStats.totalAnswered).toFixed(0)}% Accuracy
                  </Text>
                  <View style={styles.view17}>
                    <Text style={styles.correctText}>{todayStats.totalCorrect} Correct</Text>
                    <Text style={styles.missedText}>{todayStats.totalAnswered-todayStats.totalCorrect} Missed</Text>

                    <TouchableOpacity onPress={() => {
                      router.push("/review");
                      }} style={styles.homeButton}>
                      <Text style={styles.homeButtonText}>← Review Answers</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.view18}>
                  <Text style={styles.vocabLabel}>Vocab Words in Training:</Text>
                  <Text style={styles.view19}>{inTrainingWords}</Text>
                  <Text style={styles.vocabLabel}>Vocab Words Mastered:</Text>
                  <Text style={styles.view19}>{masteredWords}</Text>
                </View>
              </View>
            </View>
          </View>


  <View style={styles.view21}>
      <ScrollView horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingRight: 20 }}>
              
            {incompleteLessons.map((lesson) => (
              <TouchableOpacity key={lesson.lessonId} onPress={() => router.push({
                pathname: "/lesson", params: { lessonId: String(lesson.lessonId), topic: "vocab" }})} style={styles.lessonBox}>
            <View style={styles.lessonContent}>
              <Text style={styles.view24}>Lesson</Text>
              <Text style={styles.view25}>Unit {lesson.lessonId}: {lesson.title}</Text>
            </View>
            </TouchableOpacity>
            ))}
            <TouchableOpacity key="all-lessons" onPress={() => router.push("/study")} style={[styles.lessonBox, { backgroundColor: "gray", justifyContent: "center", alignItems: "center" }]}>
              <Text style={[styles.view24, { color: "white" }]}>All Lessons</Text>
            </TouchableOpacity>
          </ScrollView>
          </View>


              <View style={{ width: "100%", alignItems: "center", marginTop: 5 }}>
                <Text style={styles.view28}>Daily Challenges</Text>
              </View>
              <View style={styles.challengeGrid}>
  {allChallengesDone ? (
    <TouchableOpacity
      onPress={() => router.push("/study")}
      style={[styles.challengeBox, styles.fullWidthBox]}
    >
      <Text style={{ fontSize: 18, color: "white", textAlign: "center" }}>
        ✅ All Challenges Complete!{"\n"}Click to Study More!
      </Text>
    </TouchableOpacity>
  ) : (
    <>
      <TouchableOpacity
  onPress={() => {
    if (!completedALesson) return;
    if (completedToday["vocab"]) {
      router.push("/study");
    } else {
      const randomMode = Math.random() < 0.5 ? "multiple" : "fill";
      router.push(`/quiz?mode=${randomMode}&topic=vocab`);
    }
  }}
  style={[
    styles.challengeBox,
    {
      backgroundColor: completedALesson
        ? (completedToday["vocab"] ? "green" : topicColors["vocab"])
        : "#ccc",
      opacity: completedALesson ? 1 : 0.6,
    },
  ]}
>

          {completedToday["vocab"] ? (
            <Text style={{ fontSize: 14, color: "white", textAlign: "center" }}>
              ✅ Done!{"\n"}Click to Study More!
            </Text>
          ) : (
            <>
              <Text style={styles.challengeText}>Vocabulary{"\n"}Practice</Text>
              <Image
                source={require("../assets/images/mdi_checkbox-outline.png")}
                style={styles.image8}
              />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
  onPress={() => {
    if (!completedALesson) return;
    if (completedToday["verbs"]) {
      router.push("/study");
    } else {
      const randomMode = Math.random() < 0.5 ? "multiple" : "fill";
      router.push(`/quiz?mode=${randomMode}&topic=verbs`);
    }
  }}
  style={[
    styles.challengeBox,
    {
      backgroundColor: completedALesson
        ? (completedToday["verbs"] ? "green" : topicColors["verbs"])
        : "#ccc",
      opacity: completedALesson ? 1 : 0.6,
    },
  ]}
>

          {completedToday["verbs"] ? (
            <Text style={{ fontSize: 14, color: "white", textAlign: "center" }}>
              ✅ Done!{"\n"}Click to Study More!
            </Text>
          ) : (
            <>
              <Text style={styles.challengeText}>Verb{"\n"}Conjugations</Text>
              <Image
                source={require("../assets/images/mdi_checkbox-outline.png")}
                style={styles.image8}
              />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
  onPress={() => {
    if (!completedALesson) return;
    if (completedToday["sentences"]) {
      router.push("/study");
    } else {
      const randomMode = Math.random() < 0.5 ? "multiple" : "fill";
      router.push(`/quiz?mode=${randomMode}&topic=sentences`);
    }
  }}
  style={[
    styles.challengeBox,
    {
      backgroundColor: completedALesson
        ? (completedToday["sentences"] ? "green" : topicColors["sentences"])
        : "#ccc",
      opacity: completedALesson ? 1 : 0.6,
    },
  ]}
>

          {completedToday["sentences"] ? (
            <Text style={{ fontSize: 14, color: "white", textAlign: "center" }}>
              ✅ Done!{"\n"}Click to Study More!
            </Text>
          ) : (
            <>
              <Text style={styles.challengeText}>Sentence{"\n"}Practice</Text>
              <Image
                source={require("../assets/images/mdi_checkbox-outline.png")}
                style={styles.image8}
              />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
  onPress={() => {
    if (!completedALesson) return;
    if (completedToday["grammar"]) {
      router.push("/study");
    } else {
      const randomMode = Math.random() < 0.5 ? "multiple" : "fill";
      router.push(`/quiz?mode=${randomMode}&topic=grammar`);
    }
  }}
  style={[
    styles.challengeBox,
    {
      backgroundColor: completedALesson
        ? (completedToday["grammar"] ? "green" : topicColors["grammar"])
        : "#ccc",
      opacity: completedALesson ? 1 : 0.6,
    },
  ]}
>

          {completedToday["grammar"] ? (
            <Text style={{ fontSize: 14, color: "white", textAlign: "center" }}>
              ✅ Done!{"\n"}Click to Study More!
            </Text>
          ) : (
            <>
              <Text style={styles.challengeText}>Grammar{"\n"}Practice</Text>
              <Image
                source={require("../assets/images/mdi_checkbox-outline.png")}
                style={styles.image8}
              />
            </>
          )}
        </TouchableOpacity>
    </>
  )}
</View>

      </View>
      </View>
      </View>

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
  screen: {
    flex: 1, 
    backgroundColor: "#E9D9B7"
  },
  loading: {
  marginTop: 100,
  textAlign: "center",
  fontSize: 18,
},


  dashboardContent: {
  flex: 1,
},

  backButton: {
  padding: 10,
  backgroundColor: "#eee",
  borderRadius: 8,
  },

  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  profileIcon: {
    width: 45,
    height: 45,
    resizeMode: "contain",
    marginRight: 100,
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

  scrollContent: {
    padding: 10,
    paddingBottom: 40,
  },
  
  container: {
    flex: 1,
    backgroundColor: "#E9D9B7",
  },

  streakContainer: {
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#E9D9B7",
  },

  streakIcon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  view1: {
    marginLeft: "auto",
    marginRight: "auto",
    maxWidth: 480,
    width: "100%",
    paddingTop: -10,
  },
  streakText: {
    fontSize: 12,
    color: "rgba(0, 0, 0, 1)",
    fontWeight: "400",
    textAlign: "center",
  },
  image1: {
    aspectRatio: 1,
    width: 35,
  },
  image2: {
    aspectRatio: 1,
    width: 42,
  },
  view4: {
    borderColor: "black",
    backgroundColor: "gold",
    borderWidth: 1,
    marginTop: 18,
    width: "100%",
    paddingLeft: 9,
    paddingRight: 9,
    paddingBottom: 9,
    fontFamily: "Inter, -apple-system, Roboto, Helvetica, sans-serif",
  },
  view5: {
    borderRadius: 10,
    borderColor: "black",
    borderWidth: 1,
    alignSelf: "center",
    marginTop: -7,
    width: 253,
    maxWidth: "100%",
    paddingLeft: 26,
    paddingRight: 26,
    paddingTop: 5,
    paddingBottom: 5,
    backgroundColor: "red",
  },
  dashboardTitle: {
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
    color: "black",
  },
  view6: {
    flexDirection: "row",
    marginTop: 8,
    gap: 10,
    justifyContent: "space-between",
  },
  view7: {
    borderRadius: 10,
    borderColor: "black",
    borderWidth: 1,
    flex: 1,
    paddingLeft: 11,
    paddingRight: 11,
    paddingTop: 5,
    paddingBottom: 5,
    backgroundColor: "white"
  },
  view8: {
    fontSize: 14,
    fontWeight: "800",
    textDecorationLine: "underline",
    textAlign: "center",
    color:"black",
  },
  view9: {
    flexDirection: "row",
    marginTop: 8,
    alignItems: "center",
  },
  questText: {
    fontSize: 8,
    fontWeight: "400",
    color: "rgba(0, 0, 0, 1)",
    flex: 1,
  },
  image3: {
    aspectRatio: 1,
    width: 25,
  },
  view13: {
    
  },
  view14: {
    borderRadius: 10,
    borderColor: "rgba(0, 0, 0, 1)",
    borderWidth: 1,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 5,
    paddingBottom: 5,
    alignItems: "center",
    backgroundColor: "white"
  },
  view15: {
    fontSize: 13,
    fontWeight: "800",
    textDecorationLine: "underline",
    color: "rgba(0, 0, 0, 1)",
    textAlign: "center",
  },
  view16: {
    marginTop: 4,
    fontSize: 11,
    color: "rgba(0, 0, 0, 1)",
    textAlign: "center",
  },
  view17: {
    marginTop: 10,
    alignItems: "center",
  },
  correctText: {
    fontWeight: "900",
    color: "rgba(35,120,41,1)",
    fontSize: 11,
  },
  missedText: {
    fontWeight: "900",
    color: "rgba(195,10,10,1)",
    fontSize: 11,
  },
  view18: {
    borderRadius: 10,
    borderColor: "rgba(0, 0, 0, 1)",
    borderWidth: 1,
    marginTop: 9,
    paddingLeft: 19,
    paddingRight: 19,
    paddingTop: 5,
    paddingBottom: 5,
    backgroundColor: "white"
  },
  vocabLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(0, 0, 0, 1)",
  },
  view19: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 6,
    fontWeight: "800",
    color: "rgba(0, 0, 0, 1)",
  },
  view21: {
    marginTop: 10,
    paddingLeft: 10,
    paddingRight: 0,
    backgroundColor: "transparent",
  },

  lessonBox: {
  borderRadius: 10,
  flexDirection: "row",
  width: 300, // or use Dimensions.get("window").width for full screen
  paddingLeft: 11,
  paddingRight: 3,
  paddingTop: 4,
  paddingBottom: 10,
  gap: 20,
  justifyContent: "space-between",
  backgroundColor: "lightblue",
  borderColor: "black",
  marginRight: 10, // spacing between cards
},

  view24: {
    fontSize: 20,
    fontWeight: "800",
    color: "rgba(0, 0, 0, 1)",
    textAlign: "center",
  },
  view25: {
    fontSize: 12,
    fontWeight: "400",
    marginTop: 15,
    color: "rgba(0, 0, 0, 1)",
    textAlign: "center",
  },
  view28: {
    fontSize: 18,
    fontWeight: "800",
    textDecorationLine: "underline",
    textAlign: "center",
    marginTop: 5,
    color: "rgba(0, 0, 0, 1)",
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

  image8: {
    aspectRatio: 1,
    width: 44,
    marginTop: 3,
  },
  view31: {
    borderRadius: 10,
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 5,
    paddingBottom: 5,
    alignItems: "center",
  },
  image9: {
    aspectRatio: 1,
    width: 41,
    marginTop: 5,
  },
  image10: {
    aspectRatio: 1,
    width: 49,
  },
  view34: {
    borderRadius: 10,
    paddingLeft: 30,
    paddingRight: 30,
    paddingTop: 4,
    paddingBottom: 4,
    alignItems: "center",
  },
  image11: {
    aspectRatio: 1,
    width: 46,
  },
  view35: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    backgroundColor: "#D9D9D9",
    flexDirection: "row",
    marginTop: 7,
    paddingLeft: 31,
    paddingRight: 31,
    paddingTop: 4,
    paddingBottom: 4,
    alignItems: "center",
    gap: 20,
    justifyContent: "space-between",
  },
  image12: {
    aspectRatio: 1,
    width: 54,
  },
  image13: {
    aspectRatio: 1,
    width: 40,
  },
  image14: {
    aspectRatio: 1,
    width: 55,
  },
  image15: {
    aspectRatio: 1,
    width: 48,
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

lessonContent: {
  flex: 1,
  justifyContent: "center",
  alignItems: "flex-start",
  paddingVertical: 4,
},

alreadyKnowContainer: {
  position: "absolute",
  top: 5,
  right: 5,
  flexDirection: "row",
  alignItems: "center",
  gap: 5,
},

alreadyKnowText: {
  fontSize: 10,
  color: "black",
  fontWeight: "400",
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

  navItem: {
  padding: 15,
  width: 75,
  height: 70,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "white",
  
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

  checkboxText: {
  fontSize: 20,
  marginRight: 10,
},

fullWidthBox: {
  flex: 1,
  backgroundColor: "green",
  padding: 20,
  margin: 5,
  borderRadius: 10,
  justifyContent: "center",
  alignItems: "center",
  width: "100%", // spans the entire row
  height: 150,
}



  
});

