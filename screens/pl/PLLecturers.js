import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
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
  const [unassignModalVisible, setUnassignModalVisible] = useState(false);
  const [moduleToUnassign, setModuleToUnassign] = useState(null);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [unassigning, setUnassigning] = useState(false);

  const BASE_URL = "https://luct-reporting-2-932p.onrender.com";

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/courses`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "failed to load courses");
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("fetch courses error:", err.message);
      Alert.alert("error", err.message);
    }
  };

  const fetchLecturers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/users?role=lecturer`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "failed to load lecturers");
      setLecturers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("fetch lecturers error:", err.message);
      Alert.alert("error", err.message);
    }
  };

  const loadModules = async (courseId) => {
    try {
      setLoading(true);
      setModules([]);

      const res = await fetch(`${BASE_URL}/api/courses/modules/course/${courseId}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "failed to load modules");

      const safeModules = Array.isArray(data) ? data : [];
      setModules(safeModules);
      setSelectedModule(null);
    } catch (err) {
      console.log("load modules error:", err.message);
      Alert.alert("error", err.message);
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
        Alert.alert("error", "select module and lecturer");
        return;
      }

      if (selectedModule.lecturerId) {
        Alert.alert(
          "already assigned",
          `already assigned to ${selectedModule.lecturerName}`
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

      if (!res.ok) throw new Error(data.message || "assignment failed");

      Alert.alert("success", `assigned ${selectedLecturer.name} to ${selectedModule.moduleName}`);

      setSelectedModule(null);
      setSelectedLecturer(null);

      if (selectedCourse) {
        await loadModules(selectedCourse.id);
      }
    } catch (error) {
      console.log("assign error:", error.message);
      Alert.alert("error", error.message);
    } finally {
      setAssigning(false);
    }
  };

  const openUnassignModal = (module) => {
    if (!module.lecturerId) {
      Alert.alert("info", "no lecturer assigned to this module");
      return;
    }
    setModuleToUnassign(module);
    setUnassignModalVisible(true);
  };

  const handleUnassign = async () => {
    if (!moduleToUnassign) return;

    setUnassigning(true);

    try {
      const res = await fetch(`${BASE_URL}/api/courses/modules/${moduleToUnassign.id}/lecturer`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "failed to unassign lecturer");

      Alert.alert("success", `unassigned ${moduleToUnassign.lecturerName} from ${moduleToUnassign.moduleName}`);

      setUnassignModalVisible(false);
      setModuleToUnassign(null);

      if (selectedCourse) {
        await loadModules(selectedCourse.id);
      }
    } catch (error) {
      console.log("unassign error:", error.message);
      Alert.alert("error", error.message);
    } finally {
      setUnassigning(false);
    }
  };

  const getAssignedStatusColor = (lecturerId) => {
    return lecturerId ? "#22c55e" : "#facc15";
  };

  const getAssignedStatusText = (lecturerId, lecturerName) => {
    return lecturerId ? `assigned to: ${lecturerName}` : "not assigned";
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
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refreshAll} colors={["#22c55e"]} />
      }
    >
      <Text style={styles.title}>assign lecturers</Text>

      {/* courses */}
      <Text style={styles.subtitle}>select course</Text>
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
            <Text style={styles.emptyText}>no courses available</Text>
          )}
        </View>
      </ScrollView>

      {/* modules */}
      <Text style={styles.subtitle}>modules</Text>

      {modules.length === 0 && selectedCourse && (
        <Text style={styles.emptyText}>no modules found for this course</Text>
      )}

      {!selectedCourse && (
        <Text style={styles.emptyText}>select a course to view modules</Text>
      )}

      {modules.map((m) => {
        const isAssigned = !!m.lecturerId;

        return (
          <View key={m.id} style={styles.moduleCard}>
            <View style={styles.moduleHeader}>
              <Text style={styles.moduleName}>{m.moduleName}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getAssignedStatusColor(m.lecturerId) }]}>
                <Text style={styles.statusText}>
                  {isAssigned ? "assigned" : "unassigned"}
                </Text>
              </View>
            </View>
            <Text style={styles.moduleCode}>code: {m.moduleCode}</Text>
            <Text style={styles.moduleInfo}>
              {getAssignedStatusText(m.lecturerId, m.lecturerName)}
            </Text>
            
            <View style={styles.moduleActions}>
              {!isAssigned ? (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.assignBtn, selectedModule?.id === m.id && styles.selectedModule]}
                  onPress={() => setSelectedModule(m)}
                >
                  <Text style={styles.actionBtnText}>
                    {selectedModule?.id === m.id ? "selected" : "select to assign"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.unassignBtn]}
                  onPress={() => openUnassignModal(m)}
                >
                  <Text style={styles.actionBtnText}>unassign</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}

      {/* lecturers */}
      <Text style={styles.subtitle}>select lecturer</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {lecturers.map((l) => (
            <TouchableOpacity
              key={l.id}
              style={[
                styles.lecturerCard,
                selectedLecturer?.id === l.id && styles.selectedLecturer,
              ]}
              onPress={() => setSelectedLecturer(l)}
            >
              <Text style={styles.lecturerName}>{l.name}</Text>
              <Text style={styles.lecturerFaculty}>{l.faculty || "no faculty"}</Text>
              {selectedLecturer?.id === l.id && (
                <Text style={styles.selectedCheck}>✓ selected</Text>
              )}
            </TouchableOpacity>
          ))}
          {lecturers.length === 0 && (
            <Text style={styles.emptyText}>no lecturers available</Text>
          )}
        </View>
      </ScrollView>

      {/* selected info */}
      {selectedModule && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>selected module: {selectedModule.moduleName}</Text>
        </View>
      )}

      {selectedLecturer && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>selected lecturer: {selectedLecturer.name}</Text>
        </View>
      )}

      {/* assign button */}
      <TouchableOpacity 
        style={[styles.assignButton, (!selectedModule || !selectedLecturer || assigning) && styles.disabledBtn]} 
        onPress={handleAssign}
        disabled={!selectedModule || !selectedLecturer || assigning}
      >
        {assigning ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.assignButtonText}>assign lecturer</Text>
        )}
      </TouchableOpacity>

      {/* unassign confirmation modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={unassignModalVisible}
        onRequestClose={() => setUnassignModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>unassign lecturer</Text>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalText}>
                are you sure you want to unassign
              </Text>
              <Text style={styles.modalLecturerName}>
                {moduleToUnassign?.lecturerName}
              </Text>
              <Text style={styles.modalText}>
                from
              </Text>
              <Text style={styles.modalModuleName}>
                {moduleToUnassign?.moduleName}
              </Text>
              <Text style={styles.modalWarning}>
                this action cannot be undone
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setUnassignModalVisible(false)}
                disabled={unassigning}
              >
                <Text style={styles.cancelBtnText}>cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.confirmBtn, unassigning && styles.disabledBtn]}
                onPress={handleUnassign}
                disabled={unassigning}
              >
                {unassigning ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>unassign</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    textTransform: "lowercase",
  },

  subtitle: {
    marginTop: 15,
    marginBottom: 10,
    fontWeight: "700",
    color: "#e2e8f0",
    textTransform: "lowercase",
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

  cardTitle: {
    fontWeight: "700",
    color: "#e2e8f0",
    fontSize: 14,
    textTransform: "lowercase",
  },

  meta: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
  },

  moduleCard: {
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },

  moduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  moduleName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e2e8f0",
    textTransform: "lowercase",
  },

  moduleCode: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 4,
    textTransform: "lowercase",
  },

  moduleInfo: {
    fontSize: 12,
    color: "#cbd5e1",
    marginBottom: 10,
    textTransform: "lowercase",
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },

  statusText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "lowercase",
  },

  moduleActions: {
    marginTop: 8,
  },

  actionBtn: {
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },

  assignBtn: {
    backgroundColor: "#334155",
  },

  unassignBtn: {
    backgroundColor: "#dc2626",
  },

  selectedModule: {
    backgroundColor: "#16a34a",
  },

  actionBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
    textTransform: "lowercase",
  },

  lecturerCard: {
    padding: 14,
    backgroundColor: "#1e293b",
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 16,
    minWidth: 140,
    alignItems: "center",
  },

  selectedLecturer: {
    borderWidth: 2,
    borderColor: "#22c55e",
  },

  lecturerName: {
    fontWeight: "700",
    color: "#e2e8f0",
    fontSize: 14,
    textTransform: "lowercase",
  },

  lecturerFaculty: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
  },

  selectedCheck: {
    fontSize: 10,
    color: "#22c55e",
    marginTop: 6,
    fontWeight: "600",
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
    textTransform: "lowercase",
  },

  assignButton: {
    backgroundColor: "#22c55e",
    padding: 16,
    marginTop: 20,
    borderRadius: 14,
    marginBottom: 30,
  },

  disabledBtn: {
    backgroundColor: "#166534",
    opacity: 0.6,
  },

  assignButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    textTransform: "lowercase",
  },

  emptyText: {
    color: "#94a3b8",
    marginBottom: 10,
    textTransform: "lowercase",
  },

  // modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContent: {
    backgroundColor: "#1e293b",
    borderRadius: 20,
    width: "85%",
    overflow: "hidden",
  },

  modalHeader: {
    padding: 16,
    backgroundColor: "#dc2626",
    alignItems: "center",
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    textTransform: "lowercase",
  },

  modalBody: {
    padding: 20,
    alignItems: "center",
  },

  modalText: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 5,
    textTransform: "lowercase",
  },

  modalLecturerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#facc15",
    textAlign: "center",
    marginBottom: 5,
    textTransform: "lowercase",
  },

  modalModuleName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#22c55e",
    textAlign: "center",
    marginBottom: 10,
    textTransform: "lowercase",
  },

  modalWarning: {
    fontSize: 12,
    color: "#ef4444",
    textAlign: "center",
    fontStyle: "italic",
    textTransform: "lowercase",
  },

  modalButtons: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },

  modalBtn: {
    flex: 1,
    padding: 14,
    alignItems: "center",
  },

  cancelBtn: {
    backgroundColor: "#334155",
    borderRightWidth: 1,
    borderRightColor: "#334155",
  },

  cancelBtnText: {
    color: "#e2e8f0",
    fontWeight: "600",
    textTransform: "lowercase",
  },

  confirmBtn: {
    backgroundColor: "#dc2626",
  },

  confirmBtnText: {
    color: "#fff",
    fontWeight: "700",
    textTransform: "lowercase",
  },
});