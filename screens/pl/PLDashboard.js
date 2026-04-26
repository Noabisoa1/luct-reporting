import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Logout from "../Logout";

export default function PLDashboard({ navigation }) {

  const menu = [
    { title: "Courses", screen: "PLCourses" },
    { title: "Reports (PRL)", screen: "PLReports" },
    { title: "Monitoring", screen: "PLMonitoring" },
    { title: "Classes", screen: "PLClasses" },
    { title: "Lectures", screen: "PLLectures" },
    { title: "Ratings", screen: "PLRating" },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>

      <View style={styles.headerRow}>
        <View>
          <Text style={styles.smallTitle}>Program Leader</Text>
          <Text style={styles.title}>Dashboard</Text>
        </View>
        <Logout navigation={navigation} />
      </View>

      <View style={styles.grid}>
        {menu.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>Open</Text>
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
    marginBottom: 25,
  },

  smallTitle: {
    fontSize: 14,
    color: "#94a3b8",
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#facc15",
    marginTop: 2,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48%",
    backgroundColor: "#1e293b",
    paddingVertical: 24,
    borderRadius: 18,
    marginBottom: 18,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#e2e8f0",
    textAlign: "center",
  },

  cardSubtitle: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 6,
  },
});