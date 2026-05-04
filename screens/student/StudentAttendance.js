import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function StudentAttendance() {
  const [modules, setModules] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [studentData, setStudentData] = useState(null);

  const BASE_URL = "https://luct-reporting-2-932p.onrender.com";

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

  const fetchStudentData = async () => {
    try {
      const studentId = await getStudentId();
      if (!studentId) return null;

      const res = await fetch(`${BASE_URL}/api/users/${studentId}`);
      if (res.ok) {
        const data = await res.json();
        setStudentData(data);
        return data;
      }
      return null;
    } catch (error) {
      console.log("Fetch student error:", error);
      return null;
    }
  };

  const fetchModules = async () => {
    try {
      const studentId = await getStudentId();
      if (!studentId) return;

      // Get student's registered modules
      const userRes = await fetch(`${BASE_URL}/api/users/${studentId}`);
      if (!userRes.ok) throw new Error("Failed to load student data");
      const userData = await userRes.json();
      
      const registered = userData.registeredModules || [];
      
      if (registered.length === 0) {
        setModules([]);
        return;
      }

      // Fetch module details for each registered module
      const modulesList = [];
      
      for (const reg of registered) {
        try {
          const moduleRes = await fetch(`${BASE_URL}/api/courses/modules/${reg.moduleId}`);
          if (moduleRes.ok) {
            const moduleData = await moduleRes.json();
            modulesList.push({
              id: moduleData.id,
              ...moduleData,
              registeredAt: reg.registeredAt,
            });
          }
        } catch (err) {
          console.log(`Error fetching module ${reg.moduleId}:`, err.message);
        }
      }
      
      setModules(modulesList);
    } catch (error) {
      console.log("Fetch modules error:", error.message);
      Alert.alert("Error", "Failed to load modules");
    }
  };

  const fetchAttendance = async () => {
    try {
      const studentId = await getStudentId();
      if (!studentId) return;

      const res = await fetch(`${BASE_URL}/api/attendance/student/${studentId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load attendance");
      }

      const records = data.records || [];
      const summary = data.summary || [];

      // Format attendance for display
      const formattedAttendance = records.map((record) => ({
        id: record.id,
        moduleId: record.moduleId,
        moduleName: record.moduleName,
        status: record.status,
        date: record.date,
      }));

      setAttendance(formattedAttendance);
      
      // Also store summary for module attendance stats
      setModules(prevModules => 
        prevModules.map(module => {
          const moduleSummary = summary.find(s => s.moduleId === module.id);
          if (moduleSummary) {
            return {
              ...module,
              attendancePercentage: moduleSummary.attendancePercentage,
              presentCount: moduleSummary.presentCount,
              totalClasses: moduleSummary.totalClasses,
            };
          }
          return module;
        })
      );
      
    } catch (error) {
      console.log("Fetch attendance error:", error.message);
      setAttendance([]);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      await fetchStudentData();
      await fetchModules();
      await fetchAttendance();
    } catch (error) {
      console.log("Load data error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 75) return "#22c55e";
    if (percentage >= 50) return "#facc15";
    return "#ef4444";
  };

  const getStatusColor = (status) => {
    if (status === "present") return "#22c55e";
    if (status === "absent") return "#ef4444";
    return "#94a3b8";
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Loading attendance...</Text>
      </View>
    );
  }

  // Group attendance by module
  const attendanceByModule = {};
  attendance.forEach((record) => {
    if (!attendanceByModule[record.moduleId]) {
      attendanceByModule[record.moduleId] = [];
    }
    attendanceByModule[record.moduleId].push(record);
  });

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#22c55e"]} />
      }
    >
      <Text style={styles.title}>My Attendance</Text>

      {studentData && (
        <View style={styles.profileCard}>
          <Text style={styles.profileName}>{studentData.name}</Text>
          <Text style={styles.profileText}>Faculty: {studentData.faculty || "Not set"}</Text>
          <Text style={styles.profileText}>Semester: {studentData.semester || "Not set"}</Text>
        </View>
      )}

      <Text style={styles.subtitle}>My Modules ({modules.length})</Text>

      {modules.length === 0 ? (
        <Text style={styles.emptyText}>No modules registered</Text>
      ) : (
        modules.map((module) => (
          <View key={module.id} style={styles.card}>
            <Text style={styles.moduleName}>{module.moduleName}</Text>
            <Text style={styles.moduleCode}>Code: {module.moduleCode}</Text>
            <Text style={styles.courseInfo}>Course: {module.courseName}</Text>
            <Text style={styles.lecturerInfo}>
              Lecturer: {module.lecturerName || "Not assigned"}
            </Text>
            
            {module.attendancePercentage && (
              <View style={styles.attendanceStats}>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Attendance Rate:</Text>
                  <Text style={[styles.statValue, { color: getAttendanceColor(module.attendancePercentage) }]}>
                    {module.attendancePercentage}%
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Present:</Text>
                  <Text style={styles.statValue}>{module.presentCount || 0} / {module.totalClasses || 0} classes</Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${module.attendancePercentage || 0}%`,
                        backgroundColor: getAttendanceColor(module.attendancePercentage)
                      }
                    ]} 
                  />
                </View>
              </View>
            )}
          </View>
        ))
      )}

      <Text style={styles.subtitle}>Attendance Records</Text>

      {attendance.length === 0 ? (
        <Text style={styles.emptyText}>No attendance records yet</Text>
      ) : (
        Object.keys(attendanceByModule).map((moduleId) => {
          const module = modules.find(m => m.id === moduleId);
          const records = attendanceByModule[moduleId];
          
          return (
            <View key={moduleId} style={styles.moduleAttendanceCard}>
              <Text style={styles.moduleAttendanceTitle}>
                {module?.moduleName || moduleId}
              </Text>
              {records.map((record, index) => (
                <View key={record.id} style={styles.recordRow}>
                  <Text style={styles.recordDate}>{record.date}</Text>
                  <Text style={[styles.recordStatus, { color: getStatusColor(record.status) }]}>
                    {record.status.toUpperCase()}
                  </Text>
                </View>
              ))}
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

  subtitle: {
    marginTop: 15,
    marginBottom: 10,
    fontWeight: "700",
    fontSize: 16,
    color: "#e2e8f0",
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
  },

  profileText: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 2,
  },

  card: {
    backgroundColor: "#1e293b",
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },

  moduleName: {
    fontWeight: "700",
    fontSize: 16,
    color: "#e2e8f0",
  },

  moduleCode: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
  },

  courseInfo: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },

  lecturerInfo: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },

  attendanceStats: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },

  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },

  statLabel: {
    fontSize: 12,
    color: "#94a3b8",
  },

  statValue: {
    fontSize: 12,
    fontWeight: "700",
  },

  progressBar: {
    height: 6,
    backgroundColor: "#334155",
    borderRadius: 3,
    marginTop: 8,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 3,
  },

  moduleAttendanceCard: {
    backgroundColor: "#0f172a",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },

  moduleAttendanceTitle: {
    fontWeight: "700",
    fontSize: 14,
    color: "#facc15",
    marginBottom: 8,
  },

  recordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },

  recordDate: {
    fontSize: 12,
    color: "#94a3b8",
  },

  recordStatus: {
    fontSize: 12,
    fontWeight: "700",
  },

  emptyText: {
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 20,
  },
});