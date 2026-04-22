import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Logout from "../Logout";

export default function PRLDashboard({ navigation }) {
  const items = [
    { title: "Courses", screen: "PRLCourses" },
    { title: "Reports", screen: "PRLReports" },
    { title: "Monitoring", screen: "PRLMonitoring" },
    { title: "Ratings", screen: "PRLRating" },
    { title: "Classes", screen: "PRLClasses" },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Principal Lecturer</Text>
        <Logout navigation={navigation} />
      </View>

      <Text style={styles.subtitle}>Dashboard</Text>

      <View style={styles.grid}>
        {items.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSub}>Open</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#0f172a",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#facc15",
  },

  subtitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#e2e8f0",
    marginVertical: 20,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48%",
    backgroundColor: "#1e293b",
    paddingVertical: 22,
    borderRadius: 18,
    marginBottom: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#f1f5f9",
  },

  cardSub: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 6,
  },
});