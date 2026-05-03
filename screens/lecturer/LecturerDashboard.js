import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function LecturerDashboard({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const BASE_URL = "http://10.11.13.251:5000";

  const getUserData = async () => {
    try {
      const userJson = await AsyncStorage.getItem("user");
      if (userJson) {
        const user = JSON.parse(userJson);
        return user;
      }
      return null;
    } catch (error) {
      console.log("Get user error:", error);
      return null;
    }
  };

  const fetchUserDetails = async () => {
    try {
      const user = await getUserData();
      if (!user) {
        Alert.alert("Error", "User not found. Please login again.");
        navigation.replace("Login");
        return;
      }

      const userId = user.uid || user.id;
      
      const response = await fetch(`${BASE_URL}/api/users/${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      } else {
        setUserData(user);
      }
    } catch (error) {
      console.log("Fetch user error:", error.message);
      // Fallback to stored user data
      const user = await getUserData();
      setUserData(user);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("token");
  
      navigation.replace("Login");
    } catch (error) {
      console.log("Logout error:", error.message);
      Alert.alert("Error", "Failed to logout");
    }
  };

  const handleNavigate = (screen) => {
    navigation.navigate(screen, { user: userData });
  };

  const menu = [
    { title: "Reports", screen: "LecturerReports" },
    { title: "Attendance", screen: "LecturerAttendance" },
    { title: "Ratings", screen: "LecturerRatings" },
    { title: "Classes", screen: "LecturerClasses" },
    { title: "Create Report", screen: "LecturerReportForm" },
  ];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Lecturer Dashboard</Text>

      {userData && (
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>Welcome,</Text>
          <Text style={styles.userName}>{userData.name}</Text>
          <Text style={styles.userInfo}>Faculty: {userData.faculty || "Not assigned"}</Text>
          <Text style={styles.userInfo}>Email: {userData.email}</Text>
        </View>
      )}

      <View style={styles.grid}>
        {menu.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => handleNavigate(item.screen)}
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

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a",
  },

  loadingText: {
    color: "#94a3b8",
    marginTop: 10,
  },

  header: {
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
    color: "#facc15",
    letterSpacing: 1,
  },

  welcomeCard: {
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },

  welcomeText: {
    fontSize: 14,
    color: "#94a3b8",
  },

  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#f8fafc",
    marginTop: 4,
  },

  userInfo: {
    fontSize: 13,
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