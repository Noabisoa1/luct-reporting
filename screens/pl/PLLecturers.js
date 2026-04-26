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

export default function PLAssignLecturers() {
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [lecturers, setLecturers] = useState([]);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedLecturer, setSelectedLecturer] = useState(null);

  const [loading, setLoading] = useState(false);

  const BASE_URL = "http://192.168.156.177:5000";

  /* ================= FETCH COURSES ================= */
  const fetchCourses = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/courses`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to load courses");

      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  /* ================= FETCH LECTURERS ================= */
  const fetchLecturers = async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/api/users?role=lecturer`
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to load lecturers");

      setLecturers(Array.isArray(data) ? data : []);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  /* ================= LOAD MODULES ================= */
  const loadModules = async (courseId) => {
    try {
      setLoading(true);
      setModules([]);

      const res = await fetch(
        `${BASE_URL}/api/courses/modules/course/${courseId}`
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to load modules");

      const safeModules = Array.isArray(data) ? data : [];

      console.log("COURSE MODULES:", safeModules);

      setModules(safeModules);
      setSelectedModule(null);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchLecturers();
  }, []);

  /* ================= ASSIGN ================= */
  const handleAssign = async () => {
    try {
      if (!selectedModule || !selectedLecturer) {
        Alert.alert("Error", "Select module and lecturer");
        return;
      }

      if (selectedModule.lecturerId) {
        Alert.alert(
          "Already Assigned",
          `Assigned to ${selectedModule.lecturerName}`
        );
        return;
      }

      const res = await fetch(
        `${BASE_URL}/api/courses/modules/assign-lecturer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moduleId: selectedModule.id,
            lecturerId: selectedLecturer.id,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Assignment failed");

      Alert.alert("Success", "Lecturer assigned successfully");

      setSelectedModule(null);
      setSelectedLecturer(null);

      if (selectedCourse) {
        loadModules(selectedCourse.id);
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  /* ================= UI ================= */
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Assign Lecturers</Text>

      {/* COURSES */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {courses.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[
                styles.card,
                selectedCourse?.id === c.id && styles.selected,
              ]}
              onPress={() => {
                setSelectedCourse(c);
                loadModules(c.id);
              }}
            >
              <Text style={styles.cardTitle}>
                {c.courseName} {c.classYear}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* MODULES */}
      <Text style={styles.subtitle}>Modules</Text>

      {modules.length === 0 && (
        <Text style={{ color: "#94a3b8", marginBottom: 10 }}>
          No modules found for this course
        </Text>
      )}

      {modules.map((m) => {
        const isAssigned = !!m.lecturerId;

        return (
          <TouchableOpacity
            key={m.id}
            style={[
              styles.card,
              selectedModule?.id === m.id && styles.selected,
              isAssigned && styles.assignedCard,
            ]}
            onPress={() => {
              if (isAssigned) {
                Alert.alert(
                  "Assigned",
                  `Already assigned to ${m.lecturerName}`
                );
                return;
              }
              setSelectedModule(m);
            }}
          >
            <Text style={styles.cardTitle}>{m.moduleName}</Text>
            <Text style={styles.meta}>{m.moduleCode}</Text>

            <Text style={styles.statusText}>
              {isAssigned
                ? `Assigned to: ${m.lecturerName}`
                : "Status: Not Assigned"}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* LECTURERS */}
      <Text style={styles.subtitle}>Lecturers</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {lecturers.map((l) => (
            <TouchableOpacity
              key={l.id}
              style={[
                styles.card,
                selectedLecturer?.id === l.id && styles.selected,
              ]}
              onPress={() => setSelectedLecturer(l)}
            >
              <Text style={styles.cardTitle}>{l.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* BUTTON */}
      <TouchableOpacity style={styles.button} onPress={handleAssign}>
        <Text style={styles.btnText}>Assign Lecturer</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
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
    marginBottom: 12,
  },

  subtitle: {
    marginTop: 15,
    marginBottom: 10,
    fontWeight: "700",
    color: "#e2e8f0",
  },

  row: {
    flexDirection: "row",
    gap: 10,
  },

  card: {
    padding: 14,
    backgroundColor: "#1e293b",
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 16,
    minWidth: 140,
  },

  selected: {
    borderWidth: 2,
    borderColor: "#22c55e",
  },

  assignedCard: {
    backgroundColor: "#374151",
    opacity: 0.9,
  },

  cardTitle: {
    fontWeight: "700",
    color: "#e2e8f0",
    fontSize: 14,
  },

  meta: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
  },

  statusText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
  },

  button: {
    backgroundColor: "#22c55e",
    padding: 16,
    marginTop: 20,
    borderRadius: 14,
  },

  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
});