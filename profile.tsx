import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useProfile } from "./ProfileContext";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import type { VocabWord } from "@/assets/utils/likelihood";
import { loadVocabWords } from "./vocabStorage"; // adjust the path as needed
import {  Keyboard, Image, TextInput, TouchableOpacity, Alert } from "react-native";



export default function ProfileScreen() {
  const router = useRouter();
  const { resetProfile, profile, loading } = useProfile();
  const [vocabWords, setVocabWords] = useState<VocabWord[]>([]);

  useEffect(() => {
    async function fetchWords() {
      const words = await loadVocabWords();
      setVocabWords(words);
    }
  fetchWords();
}, []);


  if (loading || !profile) {
    return <Text style={styles.loading}>Loading profile...</Text>;
  }

    // 1) Confirmation dialog
  const confirmReset = () => {
    Alert.alert(
      "Reset Profile",
      "Are you sure you want to reset your profile? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Yes, reset", style: "destructive", onPress: () => handleReset() },
      ]
    );
  };

  // 2) Actual reset logic
  const handleReset = async () => {
    try {
      await resetProfile();
      router.push("/");  // navigate after reset
    } catch (e) {
      console.error("Reset failed:", e);
    }
  };


  return (
    <View style = {{flex:1, backgroundColor: "#E9D9B7"}}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Your Profile</Text>

      {profile.username && <Text style={styles.subtitle}>Username: {profile.username}</Text>}

      <Text style={styles.stat}>Login Streak: {profile.streak} Days 🔥</Text>
      <Text style={styles.stat}>Total Questions Answered: {profile.questionStats.totalAnswered}</Text>
      <Text style={styles.stat}>Total Correct: {profile.questionStats.totalCorrect}</Text>

      <Text style={styles.sectionTitle}>By Topic:</Text>
      {Object.entries(profile.questionStats.byTopic).map(([topic, stats]) => (
        <Text key={topic} style={styles.stat}>
          {topic}: {stats.correct}/{stats.total} correct
        </Text>
      ))}

      <Text style={styles.sectionTitle}>Quiz History (last 50):</Text>
      {profile.quizzes.map((quiz, index) => (
        <Text key={index} style={styles.quizItem}>
          {new Date(quiz.date).toLocaleDateString()}: {quiz.topic} - {quiz.correct}/{quiz.total}
        </Text>
      ))}

        <TouchableOpacity onPress={confirmReset} style={styles.homeButton}>
          <Text style={styles.homeButtonText}>← Reset Account</Text>
        </TouchableOpacity>


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
  },
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
  sectionTitle: {
    fontSize: 20,
    marginTop: 20,
    fontWeight: "600",
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
