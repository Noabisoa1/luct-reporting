import { signOut } from "firebase/auth";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { auth } from "../../config/firebase";

export default function LecturerDashboard({ navigation }) {

  const menu = [
    { title: "Reports", screen: "LecturerReports" },
    { title: "Monitoring", screen: "LecturerMonitoring" },
    { title: "Attendance", screen: "LecturerAttendance" },
    { title: "Ratings", screen: "LecturerRating" },
    { title: "Classes", screen: "LecturerClasses" },
    { title: "Create Report", screen: "LecturerReportForm" },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    navigation.replace("Login");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      <Text style={styles.header}>Lecturer Dashboard</Text>

      <View style={styles.grid}>
        {menu.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#0f172a",
  },

  header: {
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 25,
    color: "#facc15",
    letterSpacing: 1,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48%",
    backgroundColor: "#1e293b",
    paddingVertical: 25,
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
    color: "#e2e8f0",
    textAlign: "center",
  },

  logoutBtn: {
    marginTop: 30,
    backgroundColor: "#ef4444",
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },

  logoutText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
  },
});