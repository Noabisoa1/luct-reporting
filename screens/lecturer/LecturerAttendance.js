import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function LecturerAttendance({ route }) {
  /* ================= SAFE USER ================= */
  const user = route?.params?.user ?? null;

  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);

  const BASE_URL = "http://192.168.156.177:5000";

  /* ================= ALL HOOKS FIRST (RULE FIX) ================= */
  useEffect(() => {
    if (!user) return;

    const fetchModules = async () => {
      try {
        setLoading(true);

        const lecturerId = user.uid;

        const res = await fetch(
          `${BASE_URL}/api/courses/modules/lecturer/${lecturerId}`
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to load modules");
        }

        setModules(data);
      } catch (error) {
        console.log(error);
        Alert.alert("Error", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, [user]);

  /* ================= GUARD AFTER HOOKS ================= */
  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#fff" }}>
          User not found. Please login again.
        </Text>
      </View>
    );
  }

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  /* ================= LOAD STUDENTS ================= */
  const loadStudents = async (module) => {
    try {
      setSelectedModule(module);
      setStudents([]);
      setAttendance({});

      const res = await fetch(
        `${BASE_URL}/api/courses/modules/${module.id}/students`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load students");
      }

      setStudents(data);

      const initial = {};
      data.forEach((s) => {
        initial[s.id] = "present";
      });

      setAttendance(initial);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  /* ================= MARK ATTENDANCE ================= */
  const markAttendance = (studentId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  /* ================= SUBMIT ================= */
  const submitAttendance = async () => {
    try {
      if (!selectedModule) {
        Alert.alert("Error", "No module selected");
        return;
      }

      const res = await fetch(`${BASE_URL}/api/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: selectedModule.id,
          moduleName: selectedModule.moduleName,
          lecturerId: user.uid,
          attendance,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to submit attendance");
      }

      Alert.alert("Success", "Attendance saved");

      setSelectedModule(null);
      setStudents([]);
      setAttendance({});
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  /* ================= UI ================= */
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lecturer Attendance</Text>

      <Text style={styles.subtitle}>Your Modules</Text>

      <FlatList
        data={modules}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No modules assigned</Text>
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
          </TouchableOpacity>
        )}
      />

      {selectedModule && (
        <>
          <Text style={styles.subtitle}>
            Students ({students.length})
          </Text>

          <FlatList
            data={students}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No students found</Text>
            }
            renderItem={({ item }) => {
              const status = attendance[item.id];

              return (
                <View style={styles.studentRow}>
                  <Text style={styles.studentName}>{item.name}</Text>

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
              );
            }}
          />

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={submitAttendance}
          >
            <Text style={styles.submitText}>Submit Attendance</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

/* ================= STYLES ================= */
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
  },

  subtitle: {
    marginTop: 15,
    fontWeight: "700",
    fontSize: 14,
    color: "#94a3b8",
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
  },

  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    padding: 12,
    marginBottom: 8,
    borderRadius: 14,
  },

  studentName: {
    flex: 1,
    color: "#e2e8f0",
  },

  btn: {
    width: 40,
    height: 40,
    marginLeft: 10,
    borderRadius: 10,
    backgroundColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
  },

  icon: {
    color: "#fff",
    fontWeight: "900",
  },

  present: {
    backgroundColor: "#16a34a",
  },

  absent: {
    backgroundColor: "#dc2626",
  },

  submitBtn: {
    marginTop: 15,
    backgroundColor: "#22c55e",
    padding: 15,
    borderRadius: 14,
  },

  submitText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
  },

  emptyText: {
    color: "#94a3b8",
    marginTop: 10,
  },
});