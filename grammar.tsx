import React from "react";
import { ScrollView, Text, View, StyleSheet } from "react-native";

const pronouns = {
  ang: {
    "1st": {
      singular: { form: "ako", translation: "I" },
      plural: {
        inclusive: { form: "tayo", translation: "we (including you)" },
        exclusive: { form: "kami", translation: "we (excluding you)" },
      },
    },
    "2nd": {
      singular: { form: "ikaw / ka", translation: "you (singular)" },
      plural: { form: "kayo", translation: "you (plural)" },
    },
    "3rd": {
      singular: { form: "siya", translation: "he/she/they (singular)" },
      plural: { form: "sila", translation: "they (plural)" },
    },
  },
  ng: {
    "1st": {
      singular: { form: "ko", translation: "my / me" },
      plural: {
        inclusive: { form: "natin", translation: "our (including you)" },
        exclusive: { form: "namin", translation: "our (excluding you)" },
      },
    },
    "2nd": {
      singular: { form: "mo", translation: "your (singular)" },
      plural: { form: "ninyo / nyo", translation: "your (plural)" },
    },
    "3rd": {
      singular: { form: "niya", translation: "his / her / their (singular)" },
      plural: { form: "nila", translation: "their (plural)" },
    },
  },
  sa: {
    "1st": {
      singular: { form: "akin", translation: "to / for me" },
      plural: {
        inclusive: { form: "atin", translation: "to / for us (incl.)" },
        exclusive: { form: "amin", translation: "to / for us (excl.)" },
      },
    },
    "2nd": {
      singular: { form: "iyo / sa 'yo", translation: "to / for you (singular)" },
      plural: { form: "inyo", translation: "to / for you (plural)" },
    },
    "3rd": {
      singular: { form: "kanya", translation: "to / for him / her / them (singular)" },
      plural: { form: "kanila", translation: "to / for them (plural)" },
    },
  },
};

const renderSection = (marker: string, data: any) => (
  <View key={marker} style={styles.section}>
    <Text style={styles.header}>{marker.toUpperCase()} Pronouns</Text>
    {Object.entries(data).map(([person, forms]: any) => (
      <View key={person} style={styles.personBlock}>
        <Text style={styles.subHeader}>{person} Person</Text>
        {Object.entries(forms).map(([num, entry]: any) => (
          <View key={num} style={styles.row}>
            <Text style={styles.label}>{`${num.charAt(0).toUpperCase() + num.slice(1)}:`}</Text>
            <Text style={styles.value}>{entry.form || entry}</Text>
            <Text style={styles.translation}>{entry.translation || ""}</Text>
          </View>
        ))}
      </View>
    ))}
  </View>
);

export default function PronounChart() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Tagalog Pronoun Chart by Marker</Text>
      {Object.entries(pronouns).map(([marker, data]) => renderSection(marker, data))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  section: {
    marginBottom: 28,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2a3",
    marginBottom: 8,
  },
  subHeader: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 6,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderColor: "#ddd",
  },
  label: {
    width: "30%",
    fontWeight: "500",
  },
  value: {
    width: "30%",
  },
  translation: {
    width: "40%",
    fontStyle: "italic",
    color: "#666",
  },
  personBlock: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
});