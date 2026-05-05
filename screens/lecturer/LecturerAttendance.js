import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function LecturerAttendance({ route, navigation }) {
  // Try to get user from route params, then from AsyncStorage
  const [user, setUser] = useState(route?.params?.user ?? null);
  
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  const BASE_URL = "https://luct-reporting-2-932p.onrender.com";

  // Fetch user from AsyncStorage if not passed via params
  const loadUserFromStorage = async () => {
    try {
      const userJson = await AsyncStorage.getItem("user");
      if (userJson) {
        const storedUser = JSON.parse(userJson);
        setUser(storedUser);
        return storedUser;
      }
      return null;
    } catch (error) {
      console.log("Error loading user from storage:", error);
      return null;
    }
  };

  const fetchModules = async (lecturerId) => {
    try {
      console.log("Fetching modules for lecturer:", lecturerId);
      
      if (!lecturerId) {
        console.error("No lecturer ID found");
        Alert.alert("Error", "User ID not found. Please login again.");
        setLoading(false);
        return;
      }

      const res = await fetch(
        `${BASE_URL}/api/courses/modules/lecturer/${lecturerId}`
      );

      const data = await res.json();
      console.log("Modules response:", data);

      if (!res.ok) {
        throw new Error(data.message || "Failed to load modules");
      }

      setModules(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("Fetch modules error:", error.message);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      
      let currentUser = user;
      
      // If no user from params, try to load from storage
      if (!currentUser) {
        currentUser = await loadUserFromStorage();
      }
      
      if (!currentUser) {
        console.log("No user found in params or storage");
        Alert.alert("Error", "User not found. Please login again.");
        setLoading(false);
        return;
      }
      
      // Get lecturer ID
      const lecturerId = currentUser.uid || currentUser.id;
      
      if (!lecturerId) {
        Alert.alert("Error", "Invalid user data. Please login again.");
        setLoading(false);
        return;
      }
      
      await fetchModules(lecturerId);
    };
    
    init();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    const lecturerId = user?.uid || user?.id;
    if (lecturerId) {
      await fetchModules(lecturerId);
    } else {
      setRefreshing(false);
    }
  };

  const loadStudents = async (module) => {
    try {
      setLoading(true);
      setSelectedModule(module);
      setStudents([]);
      setAttendance({});

      console.log("Loading students for module:", module.id);

      const res = await fetch(
        `${BASE_URL}/api/courses/modules/${module.id}/students`
      );

      const data = await res.json();
      console.log("Students response:", data);

      if (!res.ok) {
        throw new Error(data.message || "Failed to load students");
      }

      const registeredStudents = Array.isArray(data) ? data : [];
      setStudents(registeredStudents);

      const initial = {};
      registeredStudents.forEach((s) => {
        initial[s.id] = "present";
      });

      setAttendance(initial);
    } catch (error) {
      console.log("Load students error:", error.message);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = (studentId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach((s) => {
      updated[s.id] = status;
    });
    setAttendance(updated);
  };

  const submitAttendance = async () => {
    try {
      if (!selectedModule) {
        Alert.alert("Error", "No module selected");
        return;
      }

      if (students.length === 0) {
        Alert.alert("Error", "No students registered for this module");
        return;
      }

      setSubmitting(true);

      const lecturerId = user?.uid || user?.id;

      const res = await fetch(`${BASE_URL}/api/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: selectedModule.id,
          moduleName: selectedModule.moduleName,
          lecturerId: lecturerId,
          attendance,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to submit attendance");
      }

      const stats = {
        present: Object.values(attendance).filter(v => v === "present").length,
        absent: Object.values(attendance).filter(v => v === "absent").length,
        total: students.length,
        moduleName: selectedModule.moduleName,
        date: new Date().toLocaleDateString(),
      };
      
      setSubmittedData(stats);
      setShowSuccessModal(true);

      setTimeout(() => {
        setSelectedModule(null);
        setStudents([]);
        setAttendance({});
      }, 500);
      
    } catch (error) {
      console.log("Submit attendance error:", error.message);
      Alert.alert("Error", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getAttendanceStats = () => {
    const present = Object.values(attendance).filter(v => v === "present").length;
    const absent = Object.values(attendance).filter(v => v === "absent").length;
    return { present, absent, total: students.length };
  };

  const stats = getAttendanceStats();

  // Debug logs
  console.log("User state:", user?.uid, user?.name);
  console.log("Modules count:", modules.length);

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={{ color: "#fff", marginTop: 10 }}>loading modules...</Text>
      </View>
    );
  }

  // MAIN VIEW - MODULES LIST
  if (!selectedModule) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>lecturer attendance</Text>

        <Text style={styles.subtitle}>your modules ({modules.length})</Text>

        <FlatList
          data={modules}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#22c55e"]} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              no modules assigned to you. please contact your pl.
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.card,
                selectedModule?.id === item.id && styles.selected,
              ]}
              onPress={() => loadStudents(item)}
            >
              <Text style={styles.moduleName}>{item.moduleName}</Text>
              <Text style={styles.moduleCode}>{item.moduleCode}</Text>
              <Text style={styles.courseInfo}>
                {item.courseName} {item.classYear}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  // ATTENDANCE VIEW - WITH BIG SCROLLVIEW
  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#22c55e"]} />
      }
    >
      {/* Back Button */}
      <TouchableOpacity onPress={() => setSelectedModule(null)} style={styles.backBtn}>
        <Text style={styles.backBtnText}>← back to modules</Text>
      </TouchableOpacity>

      <Text style={styles.title}>mark attendance</Text>

      {/* Module Info Card */}
      <View style={styles.moduleInfoCard}>
        <Text style={styles.selectedModuleName}>{selectedModule.moduleName}</Text>
        <Text style={styles.selectedModuleCode}>code: {selectedModule.moduleCode}</Text>
        <Text style={styles.selectedCourseInfo}>
          {selectedModule.courseName} {selectedModule.classYear}
        </Text>
      </View>

      {/* Attendance Stats */}
      <Text style={styles.subtitle}>
        students ({stats.total}) | present: {stats.present} | absent: {stats.absent}
      </Text>

      {/* Bulk Actions */}
      <View style={styles.bulkActions}>
        <TouchableOpacity 
          style={[styles.bulkBtn, styles.bulkPresent]} 
          onPress={() => markAll("present")}
        >
          <Text style={styles.bulkText}>all present</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.bulkBtn, styles.bulkAbsent]} 
          onPress={() => markAll("absent")}
        >
          <Text style={styles.bulkText}>all absent</Text>
        </TouchableOpacity>
      </View>

      {/* Students List */}
      {students.length === 0 ? (
        <Text style={styles.emptyText}>no students registered for this module</Text>
      ) : (
        students.map((item) => {
          const status = attendance[item.id];
          return (
            <View key={item.id} style={styles.studentRow}>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{item.name}</Text>
                <Text style={styles.studentEmail}>{item.email}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[
                    styles.btn,
                    status === "present" && styles.present,
                  ]}
                  onPress={() => markAttendance(item.id, "present")}
                >
                  <Text style={styles.icon}>P</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.btn,
                    status === "absent" && styles.absent,
                  ]}
                  onPress={() => markAttendance(item.id, "absent")}
                >
                  <Text style={styles.icon}>A</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitBtn, submitting && styles.disabledBtn]}
        onPress={submitAttendance}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>submit attendance</Text>
        )}
      </TouchableOpacity>

      <View style={styles.footer} />

      {/* Success Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showSuccessModal}
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>attendance submitted!</Text>
              <TouchableOpacity onPress={() => setShowSuccessModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {submittedData && (
              <>
                <View style={styles.successIcon}>
                  <Text style={styles.successIconText}>✓</Text>
                </View>

                <Text style={styles.moduleNameFeedback}>{submittedData.moduleName}</Text>
                <Text style={styles.dateText}>date: {submittedData.date}</Text>

                <View style={styles.statsContainer}>
                  <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{submittedData.total}</Text>
                    <Text style={styles.statLabel}>total students</Text>
                  </View>
                  <View style={[styles.statBox, styles.presentBox]}>
                    <Text style={[styles.statNumber, styles.presentText]}>{submittedData.present}</Text>
                    <Text style={styles.statLabel}>present</Text>
                  </View>
                  <View style={[styles.statBox, styles.absentBox]}>
                    <Text style={[styles.statNumber, styles.absentText]}>{submittedData.absent}</Text>
                    <Text style={styles.statLabel}>absent</Text>
                  </View>
                </View>

                <View style={styles.attendanceRate}>
                  <Text style={styles.rateLabel}>attendance rate</Text>
                  <Text style={styles.rateValue}>
                    {((submittedData.present / submittedData.total) * 100).toFixed(1)}%
                  </Text>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${(submittedData.present / submittedData.total) * 100}%` }
                      ]} 
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.doneButton}
                  onPress={() => setShowSuccessModal(false)}
                >
                  <Text style={styles.doneButtonText}>done</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#facc15",
    marginBottom: 10,
    textTransform: "lowercase",
  },

  subtitle: {
    marginTop: 15,
    fontWeight: "700",
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 8,
    textTransform: "lowercase",
  },

  backBtn: {
    backgroundColor: "#334155",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 15,
    alignSelf: "flex-start",
  },

  backBtnText: {
    color: "#e2e8f0",
    fontWeight: "600",
    textTransform: "lowercase",
  },

  card: {
    padding: 14,
    backgroundColor: "#1e293b",
    marginBottom: 10,
    borderRadius: 14,
  },

  selected: {
    backgroundColor: "#16a34a",
  },

  moduleName: {
    color: "#e2e8f0",
    fontWeight: "700",
    textTransform: "lowercase",
  },

  moduleCode: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 4,
    textTransform: "lowercase",
  },

  courseInfo: {
    color: "#facc15",
    fontSize: 11,
    marginTop: 6,
    textTransform: "lowercase",
  },

  moduleInfoCard: {
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 14,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#334155",
  },

  selectedModuleName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#facc15",
    marginBottom: 4,
    textTransform: "lowercase",
  },

  selectedModuleCode: {
    fontSize: 13,
    color: "#94a3b8",
    marginBottom: 4,
    textTransform: "lowercase",
  },

  selectedCourseInfo: {
    fontSize: 12,
    color: "#cbd5e1",
    textTransform: "lowercase",
  },

  studentRow: {
    backgroundColor: "#1e293b",
    padding: 12,
    marginBottom: 8,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  studentInfo: {
    flex: 1,
  },

  studentName: {
    color: "#e2e8f0",
    fontWeight: "600",
    textTransform: "lowercase",
  },

  studentEmail: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 2,
    textTransform: "lowercase",
  },

  actions: {
    flexDirection: "row",
    gap: 10,
  },

  btn: {
    width: 50,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
  },

  icon: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },

  present: {
    backgroundColor: "#16a34a",
  },

  absent: {
    backgroundColor: "#dc2626",
  },

  bulkActions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 15,
  },

  bulkBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },

  bulkPresent: {
    backgroundColor: "#16a34a",
  },

  bulkAbsent: {
    backgroundColor: "#dc2626",
  },

  bulkText: {
    color: "#fff",
    fontWeight: "600",
    textTransform: "lowercase",
  },

  submitBtn: {
    marginTop: 15,
    backgroundColor: "#22c55e",
    padding: 15,
    borderRadius: 14,
  },

  disabledBtn: {
    backgroundColor: "#166534",
  },

  submitText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
    textTransform: "lowercase",
  },

  emptyText: {
    color: "#94a3b8",
    marginTop: 20,
    textAlign: "center",
    textTransform: "lowercase",
  },

  footer: {
    height: 30,
  },

  retryBtn: {
    marginTop: 15,
    backgroundColor: "#facc15",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },

  retryText: {
    color: "#0f172a",
    fontWeight: "700",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContent: {
    backgroundColor: "#1e293b",
    borderRadius: 20,
    padding: 20,
    width: "90%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#facc15",
    textTransform: "lowercase",
  },

  modalClose: {
    fontSize: 24,
    color: "#94a3b8",
    fontWeight: "600",
  },

  successIcon: {
    alignItems: "center",
    marginBottom: 10,
  },

  successIconText: {
    fontSize: 60,
    color: "#22c55e",
  },

  moduleNameFeedback: {
    fontSize: 18,
    fontWeight: "700",
    color: "#e2e8f0",
    textAlign: "center",
    marginBottom: 5,
    textTransform: "lowercase",
  },

  dateText: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 20,
    textTransform: "lowercase",
  },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  statBox: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
  },

  presentBox: {
    backgroundColor: "#064e3b",
  },

  absentBox: {
    backgroundColor: "#7f1d1d",
  },

  statNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#e2e8f0",
  },

  presentText: {
    color: "#22c55e",
  },

  absentText: {
    color: "#ef4444",
  },

  statLabel: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 4,
    textTransform: "lowercase",
  },

  attendanceRate: {
    backgroundColor: "#0f172a",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },

  rateLabel: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 5,
    textAlign: "center",
    textTransform: "lowercase",
  },

  rateValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#22c55e",
    textAlign: "center",
    marginBottom: 10,
  },

  progressBar: {
    height: 8,
    backgroundColor: "#334155",
    borderRadius: 4,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#22c55e",
    borderRadius: 4,
  },

  doneButton: {
    backgroundColor: "#22c55e",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  doneButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    textTransform: "lowercase",
  },
});