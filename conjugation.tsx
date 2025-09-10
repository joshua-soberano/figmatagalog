import * as React from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";

export default function VerbConjugationGuide() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📝 Tagalog Verb Conjugation Guide</Text>

      <Text style={styles.sectionTitle}>🔹 Verb Types</Text>
      <View style={styles.table}>
        <Row label="UM Verbs" description="Focus on the actor (e.g., tumakbo - to run)" />
        <Row label="MAG Verbs" description="Intentional actions, actor-focus (e.g., magluto - to cook)" />
        <Row label="MA Verbs" description="Unintentional or involuntary actions (e.g., matulog - to sleep)" />
        <Row label="IN Verbs" description="Object-focus (e.g., kainin - to eat something)" />
        <Row label="I Verbs" description="Focus on object or location (e.g., itapon - to throw)" />
        <Row label="AN Verbs" description="Focus on the location or direction (e.g., puntahan - to go to)" />
      </View>

      <Text style={styles.sectionTitle}>🔸 Verb Focus</Text>
      <View style={styles.table}>
        <Row label="Actor Focus" description="The doer of the action is emphasized (e.g., Si Maria ay nagluto)." />
        <Row label="Object Focus" description="The object of the action is emphasized (e.g., Ang ulam ay niluto ni Maria)." />
        <Row label="Locative Focus" description="The location or direction is emphasized (e.g., Ang kusina ay nilutuan ni Maria)." />
        <Row label="Benefactive Focus" description="Focus on who benefits from the action (e.g., Ipinagluto ni Maria si Juan)." />
      </View>

      <Text style={styles.sectionTitle}>🔹 Verb Aspects</Text>
      <View style={styles.table}>
        <Row label="Infinitive" description="Base form (e.g., magluto - to cook)" />
        <Row label="Completed (Perfective)" description="Action already done (e.g., nagluto - cooked)" />
        <Row label="Ongoing (Imperfective)" description="Action in progress (e.g., nagluluto - cooking)" />
        <Row label="Contemplated (Future)" description="Action yet to happen (e.g., magluluto - will cook)" />
      </View>
    </ScrollView>
  );
}

function Row({ label, description }: { label: string; description: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#FFF8F0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: "#333",
  },
  table: {
    marginBottom: 20,
    paddingLeft: 10,
  },
  row: {
    marginBottom: 10,
  },
  label: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 2,
  },
  description: {
    fontSize: 15,
    color: "#555",
  },
});
