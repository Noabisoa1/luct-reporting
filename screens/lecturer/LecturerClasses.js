import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

export default function LecturerClasses() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);

  const BASE_URL = "https://luct-reporting-2-932p.onrender.com";

  const getLecturerId = async () => {
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

  const fetchUserData = async () => {
    try {
      const lecturerId = await getLecturerId();
      if (!lecturerId) return null;

      const res = await fetch(`${BASE_URL}/api/users/${lecturerId}`);
      if (res.ok) {
        const data = await res.json();
        return data;
      }
      return null;
    } catch (error) {
      console.log("Fetch user error:", error);
      return null;
    }
  };

  const fetchModules = async () => {
    try {
      const lecturerId = await getLecturerId();
      
      if (!lecturerId) {
        console.log("No lecturer ID found");
        Alert.alert("Error", "User not found. Please login again.");
        setLoading(false);
        return;
      }

      const res = await fetch(
        `${BASE_URL}/api/courses/modules/lecturer/${lecturerId}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load modules");
      }

      setModules(Array.isArray(data) ? data : []);
      console.log(`Loaded ${data.length} modules for lecturer`);
    } catch (error) {
      console.log("Fetch modules error:", error.message);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    const user = await fetchUserData();
    if (user) setUserData(user);
    await fetchModules();
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadAllData();
  };

  const getStudentCount = (studentIds) => {
    return studentIds?.length || 0;
  };

  const getModuleStatus = (module) => {
    if (module.lecturerId && module.lecturerId !== "") {
      return { text: "Assigned", color: "#16a34a" };
    }
    return { text: "Unassigned", color: "#ef4444" };
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Loading your classes...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#22c55e"]} />
      }
    >
      <Text style={styles.title}>My Classes</Text>

      {userData && (
        <View style={styles.profileCard}>
          <Text style={styles.profileName}>{userData.name}</Text>
          <Text style={styles.profileText}>Email: {userData.email}</Text>
          <Text style={styles.profileText}>Faculty: {userData.faculty || "Not assigned"}</Text>
          <Text style={styles.profileText}>Role: {userData.role}</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>
        Assigned Modules ({modules.length})
      </Text>

      {modules.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyText}>No modules assigned yet</Text>
          <Text style={styles.emptySubtext}>
            Contact your PL to assign modules to you
          </Text>
        </View>
      ) : (
        modules.map((item) => {
          const status = getModuleStatus(item);
          const studentCount = getStudentCount(item.studentIds);
          
          return (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.moduleName}>{item.moduleName}</Text>
                <View style={[styles.badge, { backgroundColor: status.color }]}>
                  <Text style={styles.badgeText}>{status.text}</Text>
                </View>
              </View>

              <Text style={styles.moduleCode}>Code: {item.moduleCode}</Text>
              <Text style={styles.courseInfo}>
                Course: {item.courseName} {item.classYear || ""}
              </Text>
              <Text style={styles.facultyInfo}>Faculty: {item.faculty}</Text>

              <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{studentCount}</Text>
                  <Text style={styles.statLabel}>Students Enrolled</Text>
                </View>
                {item.averageRating > 0 && (
                  <View style={styles.statBox}>
                    <Text style={styles.statNumber}>⭐ {item.averageRating}</Text>
                    <Text style={styles.statLabel}>Rating ({item.totalRatings})</Text>
                  </View>
                )}
              </View>

              {studentCount > 0 && (
                <View style={styles.studentsPreview}>
                  <Text style={styles.previewTitle}>
                    Student List ({studentCount}):
                  </Text>
                  <Text style={styles.previewText} numberOfLines={2}>
                    {item.studentIds?.join(", ") || "No students"}
                  </Text>
                </View>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#facc15",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e2e8f0",
    marginBottom: 12,
    marginTop: 8,
  },

  profileCard: {
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },

  profileName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#f8fafc",
    marginBottom: 4,
  },

  profileText: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 2,
  },

  card: {
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  moduleName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#e2e8f0",
    flex: 1,
    marginRight: 10,
  },

  moduleCode: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 4,
  },

  courseInfo: {
    fontSize: 13,
    color: "#cbd5e1",
    marginBottom: 2,
  },

  facultyInfo: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 10,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },

  statBox: {
    alignItems: "center",
    flex: 1,
  },

  statNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: "#22c55e",
  },

  statLabel: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 4,
  },

  studentsPreview: {
    backgroundColor: "#0f172a",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },

  previewTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#facc15",
    marginBottom: 4,
  },

  previewText: {
    fontSize: 10,
    color: "#94a3b8",
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },

  emptyIcon: {
    fontSize: 50,
    marginBottom: 10,
  },

  emptyText: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 16,
    fontWeight: "500",
  },

  emptySubtext: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 12,
    marginTop: 8,
  },
});