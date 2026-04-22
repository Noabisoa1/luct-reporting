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
    padding: 20,
    backgroundColor: "#000000",
    flexGrow: 1,
  },

  header: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20, 
    color: 'orange',
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 4,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },

  logoutBtn: {
    marginTop: 20,
    backgroundColor: "#e74c3c",
    padding: 15,
    borderRadius: 12,
  },

  logoutText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
});