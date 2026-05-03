import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function StudentDashboard({ navigation }) {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);

  const BASE_URL = "http://10.11.13.251:5000";

  const getStudentId = async () => {
    try {
      const userJson = await AsyncStorage.getItem("user");
      if (userJson) {
        const user = JSON.parse(userJson);
        return user.uid || user.id;
      }
      return null;
    } catch (error) {
      console.log("Get user error:", error);
      return null;
    }
  };

  const fetchStudent = async () => {
    try {
      const uid = await getStudentId();
      
      if (!uid) {
        console.log("No user logged in");
        setLoading(false);
        return;
      }

      const response = await fetch(`${BASE_URL}/api/users/${uid}`);

      const data = await response.json();

      if (response.ok) {
        setStudentData(data);
      } else {
        console.log(data.message);
        // Try to get from AsyncStorage as fallback
        const userJson = await AsyncStorage.getItem("user");
        if (userJson) {
          const user = JSON.parse(userJson);
          setStudentData(user);
        }
      }
    } catch (error) {
      console.log("Fetch error:", error.message);
      // Fallback to AsyncStorage
      const userJson = await AsyncStorage.getItem("user");
      if (userJson) {
        const user = JSON.parse(userJson);
        setStudentData(user);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("token");
      navigation.replace("Login");
    } catch (error) {
      console.log("Logout error:", error.message);
    }
  };

  const menu = [
    { title: "Ratings", screen: "StudentRating" },
    { title: "Attendance", screen: "StudentAttendance" },
    { title: "Register Modules", screen: "StudentRegisterModules" },
  ];

  const handleNavigate = (screen) => {
    // Pass the student data to the next screen
    navigation.navigate(screen, { user: studentData });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!studentData) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load user data</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.replace("Login")}>
          <Text style={styles.retryText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.welcome}>Welcome</Text>
          <Text style={styles.title}>{studentData.name}</Text>
          <Text style={styles.subtitle}>Email: {studentData.email}</Text>
          <Text style={styles.subtitle}>Faculty: {studentData.faculty || "Not set"}</Text>
          <Text style={styles.subtitle}>Semester: {studentData.semester || "Not set"}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {menu.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => handleNavigate(item.screen)}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSub}>Tap to open</Text>
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

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
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

  subtitle: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
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

  loadingText: {
    color: "#94a3b8",
    marginTop: 10,
  },

  errorText: {
    color: "#ef4444",
    fontSize: 16,
    marginBottom: 15,
  },

  retryBtn: {
    backgroundColor: "#facc15",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },

  retryText: {
    color: "#0f172a",
    fontWeight: "700",
  },

  logoutBtn: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },

  logoutText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});