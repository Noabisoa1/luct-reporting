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
  <Text style={styles.title}>Principal Lecturer Dashboard</Text>
  <Logout navigation={navigation} />
</View>
      {items.map((item, i) => (
        <TouchableOpacity
          key={i}
          style={styles.card}
          onPress={() => navigation.navigate(item.screen)}
        >
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSub}>Tap to open</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#000000", flexGrow: 1 },

  headerRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20, color: '#fad608',
},

  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20, color: '#fad608',
  },

  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 4,
  },

  cardTitle: { fontSize: 18, fontWeight: "bold" },
  cardSub: { color: "#777", marginTop: 5 },
});