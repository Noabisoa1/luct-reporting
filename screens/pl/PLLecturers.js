import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";

export default function PLAssignLecturers() {
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [lecturers, setLecturers] = useState([]);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedLecturer, setSelectedLecturer] = useState(null);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const BASE_URL = "http://10.11.13.251:5000";

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

  const fetchLecturers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/users?role=lecturer`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to load lecturers");

      setLecturers(Array.isArray(data) ? data : []);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const loadModules = async (courseId) => {
    try {
      setLoading(true);
      setModules([]);

      const res = await fetch(`${BASE_URL}/api/courses/modules/course/${courseId}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to load modules");

      const safeModules = Array.isArray(data) ? data : [];

      setModules(safeModules);
      setSelectedModule(null);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = async () => {
    setRefreshing(true);
    await fetchCourses();
    await fetchLecturers();
    if (selectedCourse) {
      await loadModules(selectedCourse.id);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    fetchCourses();
    fetchLecturers();
  }, []);

  const handleAssign = async () => {
    try {
      if (!selectedModule || !selectedLecturer) {
        Alert.alert("Error", "Select module and lecturer");
        return;
      }

      if (selectedModule.lecturerId) {
        Alert.alert(
          "Already Assigned",
          `Already assigned to ${selectedModule.lecturerName}`
        );
        return;
      }

      setAssigning(true);

      const res = await fetch(`${BASE_URL}/api/courses/modules/assign-lecturer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: selectedModule.id,
          lecturerId: selectedLecturer.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Assignment failed");

      Alert.alert("Success", `Assigned ${selectedLecturer.name} to ${selectedModule.moduleName}`);

      setSelectedModule(null);
      setSelectedLecturer(null);

      if (selectedCourse) {
        await loadModules(selectedCourse.id);
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveLecturer = async (moduleId, moduleName, lecturerName) => {
    Alert.alert(
      "Remove Assignment",
      `Remove ${lecturerName} from ${moduleName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setAssigning(true);
              
              const res = await fetch(`${BASE_URL}/api/courses/modules/${moduleId}/remove-lecturer`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
              });

              const data = await res.json();

              if (!res.ok) throw new Error(data.message || "Removal failed");

              Alert.alert("Success", "Lecturer removed successfully");

              if (selectedCourse) {
                await loadModules(selectedCourse.id);
              }
            } catch (error) {
              Alert.alert("Error", error.message);
            } finally {
              setAssigning(false);
            }
          },
        },
      ]
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refreshAll} colors={["#22c55e"]} />
      }
    >
      <Text style={styles.title}>Assign Lecturers</Text>

      {/* COURSES */}
      <Text style={styles.subtitle}>Select Course</Text>
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
              <Text style={styles.meta}>{c.faculty}</Text>
            </TouchableOpacity>
          ))}
          {courses.length === 0 && (
            <Text style={styles.emptyText}>No courses available</Text>
          )}
        </View>
      </ScrollView>

      {/* MODULES */}
      <Text style={styles.subtitle}>Modules</Text>

      {modules.length === 0 && selectedCourse && (
        <Text style={styles.emptyText}>No modules found for this course</Text>
      )}

      {!selectedCourse && (
        <Text style={styles.emptyText}>Select a course to view modules</Text>
      )}

      {modules.map((m) => {
        const isAssigned = !!m.lecturerId;

        return (
          <TouchableOpacity
            key={m.id}
            style={[
              styles.moduleCard,
              selectedModule?.id === m.id && styles.selected,
              isAssigned && styles.assignedCard,
            ]}
            onPress={() => {
              if (isAssigned) {
                Alert.alert(
                  "Already Assigned",
                  `Module is assigned to ${m.lecturerName}`
                );
                return;
              }
              setSelectedModule(m);
            }}
            onLongPress={() => {
              if (isAssigned) {
                handleRemoveLecturer(m.id, m.moduleName, m.lecturerName);
              }
            }}
          >
            <View style={styles.moduleHeader}>
              <Text style={styles.cardTitle}>{m.moduleName}</Text>
              {isAssigned && (
                <TouchableOpacity 
                  onPress={() => handleRemoveLecturer(m.id, m.moduleName, m.lecturerName)}
                >
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.meta}>{m.moduleCode}</Text>
            <Text style={[styles.statusText, isAssigned && styles.assignedText]}>
              {isAssigned
                ? `Assigned to: ${m.lecturerName}`
                : "Status: Not Assigned"}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* LECTURERS */}
      <Text style={styles.subtitle}>Select Lecturer</Text>

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
              <Text style={styles.meta}>{l.faculty || "No faculty"}</Text>
            </TouchableOpacity>
          ))}
          {lecturers.length === 0 && (
            <Text style={styles.emptyText}>No lecturers available</Text>
          )}
        </View>
      </ScrollView>

      {/* SELECTED INFO */}
      {selectedModule && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Selected Module: {selectedModule.moduleName}</Text>
        </View>
      )}

      {selectedLecturer && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Selected Lecturer: {selectedLecturer.name}</Text>
        </View>
      )}

      {/* BUTTON */}
      <TouchableOpacity 
        style={[styles.button, (!selectedModule || !selectedLecturer || assigning) && styles.buttonDisabled]} 
        onPress={handleAssign}
        disabled={!selectedModule || !selectedLecturer || assigning}
      >
        {assigning ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Assign Lecturer</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#0f172a",
    flexGrow: 1,
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

  moduleCard: {
    padding: 14,
    backgroundColor: "#1e293b",
    marginBottom: 10,
    borderRadius: 16,
  },

  moduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    color: "#ef4444",
  },

  assignedText: {
    color: "#22c55e",
  },

  removeText: {
    color: "#ef4444",
    fontWeight: "600",
    fontSize: 12,
  },

  button: {
    backgroundColor: "#22c55e",
    padding: 16,
    marginTop: 20,
    borderRadius: 14,
  },

  buttonDisabled: {
    backgroundColor: "#166534",
  },

  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },

  emptyText: {
    color: "#94a3b8",
    marginBottom: 10,
  },

  infoBox: {
    backgroundColor: "#1e293b",
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
  },

  infoText: {
    color: "#facc15",
    fontWeight: "600",
  },
});