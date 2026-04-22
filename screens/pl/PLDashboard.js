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
        <Text style={styles.title}>Program Leader Dashboard</Text>
        <Logout navigation={navigation} />
      </View>

      {menu.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.card}
          onPress={() => navigation.navigate(item.screen)}
        >
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSubtitle}>Tap to open</Text>
        </TouchableOpacity>
      ))}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#000000" },
  title: {
    fontSize: 26,
    color: '#ffd900',
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
  },
  cardTitle: { fontSize: 18, fontWeight: "bold" },
  cardSubtitle: { color: "#3700ff", marginTop: 5 },

  headerRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20,
},
});