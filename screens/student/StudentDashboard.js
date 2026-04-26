import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../config/firebase";
import Logout from "../Logout";

export default function StudentDashboard({ navigation }) {
  const [studentData, setStudentData] = useState(null);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const uid = auth.currentUser.uid;

        const response = await fetch(
          `http://192.168.156.177:5000/api/users/${uid}`
        );

        const data = await response.json();

        if (response.ok) {
          setStudentData(data);
        } else {
          console.log(data.message);
        }
      } catch (error) {
        console.log("Fetch error:", error.message);
      }
    };

    fetchStudent();
  }, []);

  if (!studentData)
    return <Text style={styles.loading}>Loading...</Text>;

  const menu = [
    { title: "Monitoring", screen: "StudentMonitoring" },
    { title: "Ratings", screen: "StudentRating" },
    { title: "Attendance", screen: "StudentAttendance" },
    { title: "Register Modules", screen: "StudentRegisterModules" },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.welcome}>Welcome</Text>
          <Text style={styles.title}>{studentData.name}</Text>
        </View>
        <Logout navigation={navigation} />
      </View>

      <View style={styles.grid}>
        {menu.map((item, i) => (
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
    marginBottom: 25,
  },

  welcome: {
    fontSize: 14,
    color: "#94a3b8",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#f8fafc",
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
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  cardTitle: {
    textAlign: "center",
    fontWeight: "600",
    fontSize: 15,
    color: "#e2e8f0",
  },

  cardSub: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 6,
  },

  loading: {
    flex: 1,
    textAlign: "center",
    marginTop: 100,
    fontSize: 16,
    color: "#94a3b8",
    backgroundColor: "#0f172a",
  },
});