import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function PRLClasses() {
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showModules, setShowModules] = useState(false);

  const BASE_URL = "https://luct-reporting-2-932p.onrender.com";

  const getUserId = async () => {
    try {
      const userJson = await AsyncStorage.getItem("user");
      if (userJson) {
        const user = JSON.parse(userJson);
        return user.uid || user.id;
      }
      return null;
    } catch (error) {
      console.log("get user error:", error);
      return null;
    }
  };

  const fetchUserData = async () => {
    try {
      const userId = await getUserId();
      if (!userId) return null;

      const res = await fetch(`${BASE_URL}/api/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUserData(data);
        return data;
      }
      return null;
    } catch (error) {
      console.log("fetch user error:", error);
      return null;
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/courses`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "failed to load courses");
      }

      // filter courses by faculty if PRL has faculty
      let coursesData = Array.isArray(data) ? data : [];
      if (userData?.faculty) {
        coursesData = coursesData.filter(c => c.faculty === userData.faculty);
      }

      setCourses(coursesData);
      console.log(`loaded ${coursesData.length} courses`);
    } catch (error) {
      console.log("fetch courses error:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchModulesForCourse = async (courseId) => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/courses/modules/course/${courseId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "failed to load modules");
      }

      const modulesList = Array.isArray(data) ? data : [];
      
      // filter modules that have lecturers assigned
      const assignedModules = modulesList.filter(m => m.lecturerId && m.lecturerId !== "");
      
      setModules(assignedModules);
      console.log(`loaded ${assignedModules.length} modules with lecturers for course`);
    } catch (error) {
      console.log("fetch modules error:", error.message);
      setModules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchUserData();
      await fetchCourses();
    };
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    if (showModules && selectedCourse) {
      await fetchModulesForCourse(selectedCourse.id);
    } else {
      await fetchCourses();
    }
    setRefreshing(false);
  };

  const handleCoursePress = async (course) => {
    setSelectedCourse(course);
    setShowModules(true);
    await fetchModulesForCourse(course.id);
  };

  const handleBackToCourses = () => {
    setShowModules(false);
    setSelectedCourse(null);
    setModules([]);
  };

  const getStatusColor = (isActive) => {
    return isActive !== false ? "#22c55e" : "#ef4444";
  };

  const getStatusText = (isActive) => {
    return isActive !== false ? "active" : "inactive";
  };

  if (loading && !refreshing && !showModules) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>loading classes...</Text>
      </View>
    );
  }

  // MODULES VIEW (classes per course)
  if (showModules && selectedCourse) {
    return (
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#22c55e"]} />
        }
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBackToCourses} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← back to courses</Text>
          </TouchableOpacity>
          <Text style={styles.title}>classes</Text>
        </View>

        <View style={styles.courseInfoCard}>
          <Text style={styles.courseTitle}>{selectedCourse.courseName}</Text>
          <Text style={styles.courseSubtitle}>code: {selectedCourse.courseCode}</Text>
          <Text style={styles.courseSubtitle}>faculty: {selectedCourse.faculty}</Text>
          <Text style={styles.courseSubtitle}>class: {selectedCourse.classYear}</Text>
        </View>

        <Text style={styles.subtitle}>modules with lecturers ({modules.length})</Text>

        {modules.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📖</Text>
            <Text style={styles.emptyText}>no modules with assigned lecturers</Text>
            <Text style={styles.emptySubtext}>assign lecturers to modules first</Text>
          </View>
        ) : (
          modules.map((item) => (
            <View key={item.id} style={styles.moduleCard}>
              <Text style={styles.moduleName}>{item.moduleName}</Text>
              <Text style={styles.moduleCode}>code: {item.moduleCode}</Text>
              <Text style={styles.lecturerInfo}>
                👨‍🏫 lecturer: {item.lecturerName || "not assigned"}
              </Text>
              <Text style={styles.lecturerFaculty}>
                🏫 faculty: {item.lecturerFaculty || "not specified"}
              </Text>
              <Text style={styles.studentCount}>
                📚 students enrolled: {item.studentIds?.length || 0}
              </Text>
              {item.averageRating > 0 && (
                <Text style={styles.ratingInfo}>
                  ⭐ rating: {item.averageRating} ({item.totalRatings} reviews)
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    );
  }

  // MAIN COURSES VIEW
  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#22c55e"]} />
      }
    >
      <Text style={styles.title}>all courses</Text>
      
      {userData && (
        <View style={styles.profileCard}>
          <Text style={styles.profileName}>{userData.name}</Text>
          <Text style={styles.profileText}>role: {userData.role}</Text>
          <Text style={styles.profileText}>faculty: {userData.faculty || "not set"}</Text>
        </View>
      )}

      <Text style={styles.subtitle}>total courses: {courses.length}</Text>

      {courses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyText}>no courses found</Text>
          <Text style={styles.emptySubtext}>courses will appear here once created</Text>
        </View>
      ) : (
        courses.map((item) => (
          <TouchableOpacity key={item.id} onPress={() => handleCoursePress(item)}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.courseName}>{item.courseName}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.isActive) }]}>
                  <Text style={styles.statusText}>{getStatusText(item.isActive)}</Text>
                </View>
              </View>

              <Text style={styles.courseCode}>code: {item.courseCode}</Text>
              <Text style={styles.courseInfo}>faculty: {item.faculty}</Text>
              <Text style={styles.courseInfo}>class: {item.classYear}</Text>
              
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{item.studentIds?.length || 0}</Text>
                  <Text style={styles.statLabel}>students</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>0</Text>
                  <Text style={styles.statLabel}>modules</Text>
                </View>
              </View>

              <Text style={styles.tapText}>tap to view classes →</Text>

              <Text style={styles.dateInfo}>
                created: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "unknown"}
              </Text>
            </View>
          </TouchableOpacity>
        ))
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
    textTransform: "lowercase",
  },

  subtitle: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 15,
    textTransform: "lowercase",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  backBtn: {
    backgroundColor: "#334155",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 12,
  },

  backBtnText: {
    color: "#e2e8f0",
    fontWeight: "600",
    textTransform: "lowercase",
  },

  profileCard: {
    backgroundColor: "#1e293b",
    padding: 15,
    borderRadius: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#334155",
  },

  profileName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#f8fafc",
    marginBottom: 4,
    textTransform: "lowercase",
  },

  profileText: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 2,
    textTransform: "lowercase",
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
    marginBottom: 10,
  },

  courseName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#e2e8f0",
    flex: 1,
    textTransform: "lowercase",
  },

  courseCode: {
    fontSize: 13,
    color: "#94a3b8",
    marginBottom: 4,
    textTransform: "lowercase",
  },

  courseInfo: {
    fontSize: 13,
    color: "#cbd5e1",
    marginBottom: 4,
    textTransform: "lowercase",
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  statusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "lowercase",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },

  statItem: {
    alignItems: "center",
    flex: 1,
  },

  statNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#22c55e",
  },

  statLabel: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 4,
    textTransform: "lowercase",
  },

  tapText: {
    fontSize: 11,
    color: "#facc15",
    textAlign: "right",
    marginTop: 8,
    textTransform: "lowercase",
  },

  dateInfo: {
    marginTop: 8,
    fontSize: 10,
    color: "#94a3b8",
    textAlign: "right",
    textTransform: "lowercase",
  },

  courseInfoCard: {
    backgroundColor: "#1e293b",
    padding: 15,
    borderRadius: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#334155",
  },

  courseTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#facc15",
    marginBottom: 6,
    textTransform: "lowercase",
  },

  courseSubtitle: {
    fontSize: 13,
    color: "#94a3b8",
    marginBottom: 2,
    textTransform: "lowercase",
  },

  moduleCard: {
    backgroundColor: "#1e293b",
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },

  moduleName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e2e8f0",
    marginBottom: 4,
    textTransform: "lowercase",
  },

  moduleCode: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 6,
    textTransform: "lowercase",
  },

  lecturerInfo: {
    fontSize: 13,
    color: "#cbd5e1",
    marginBottom: 4,
    textTransform: "lowercase",
  },

  lecturerFaculty: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 4,
    textTransform: "lowercase",
  },

  studentCount: {
    fontSize: 12,
    color: "#facc15",
    marginTop: 4,
  },

  ratingInfo: {
    fontSize: 11,
    color: "#22c55e",
    marginTop: 4,
  },

  emptyContainer: {
    alignItems: "center",
    marginTop: 50,
  },

  emptyIcon: {
    fontSize: 50,
    marginBottom: 10,
  },

  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#94a3b8",
    fontSize: 16,
    textTransform: "lowercase",
  },

  emptySubtext: {
    textAlign: "center",
    marginTop: 8,
    color: "#64748b",
    fontSize: 12,
    textTransform: "lowercase",
  },
});