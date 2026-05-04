import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LecturerReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    topic: "",
    learningOutcomes: "",
    recommendations: "",
    venue: "",
    week: "",
  });
  const [updating, setUpdating] = useState(false);

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
      console.log("get user error:", error);
      return null;
    }
  };

  const fetchReports = async () => {
    try {
      const lecturerId = await getLecturerId();
      
      if (!lecturerId) {
        console.log("no lecturer id found");
        setLoading(false);
        return;
      }

      const res = await fetch(`${BASE_URL}/api/reports/lecturer/${lecturerId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "failed to load reports");
      }

      const sortedReports = Array.isArray(data) ? data.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : 0;
        const dateB = b.createdAt ? new Date(b.createdAt) : 0;
        return dateB - dateA;
      }) : [];

      setReports(sortedReports);
    } catch (error) {
      console.log("fetch reports error:", error.message);
      Alert.alert("error", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const openEditModal = (report) => {
    setSelectedReport(report);
    setEditForm({
      topic: report.topic || "",
      learningOutcomes: report.learningOutcomes || "",
      recommendations: report.recommendations || "",
      venue: report.venue || "",
      week: report.week?.toString() || "",
    });
    setEditModalVisible(true);
  };

  const handleEditChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const updateReport = async () => {
    if (!selectedReport) return;

    if (!editForm.topic) {
      Alert.alert("error", "topic is required");
      return;
    }

    if (!editForm.week) {
      Alert.alert("error", "week is required");
      return;
    }

    setUpdating(true);

    try {
      const res = await fetch(`${BASE_URL}/api/reports/${selectedReport.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: editForm.topic,
          learningOutcomes: editForm.learningOutcomes,
          recommendations: editForm.recommendations,
          venue: editForm.venue,
          week: editForm.week,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "failed to update report");
      }

      Alert.alert("success", "report updated successfully!");
      setEditModalVisible(false);
      setSelectedReport(null);
      fetchReports();
      
    } catch (error) {
      console.log("update report error:", error.message);
      Alert.alert("error", error.message);
    } finally {
      setUpdating(false);
    }
  };

  const deleteReport = async (report) => {
    Alert.alert(
      "confirm delete",
      `are you sure you want to delete the report for ${report.moduleName} (week ${report.week})?`,
      [
        { text: "cancel", style: "cancel" },
        {
          text: "delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(`${BASE_URL}/api/reports/${report.id}`, {
                method: "DELETE",
              });

              const data = await res.json();

              if (!res.ok) {
                throw new Error(data.message || "failed to delete report");
              }

              Alert.alert("success", "report deleted successfully!");
              fetchReports(); 
            } catch (error) {
              console.log("delete report error:", error.message);
              Alert.alert("error", error.message);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "unknown date";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    } catch {
      return dateString;
    }
  };

  const getAttendanceColor = (rate) => {
    const percentage = parseFloat(rate);
    if (percentage >= 75) return "#22c55e";
    if (percentage >= 50) return "#facc15";
    return "#ef4444";
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>loading reports...</Text>
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
      <Text style={styles.title}>my submitted reports</Text>
      <Text style={styles.subtitle}>total: {reports.length} reports</Text>

      {reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📄</Text>
          <Text style={styles.empty}>no reports found</Text>
          <Text style={styles.emptySubtext}>submit your first report from the report form</Text>
        </View>
      ) : (
        reports.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.module}>
                {item.moduleName} ({item.moduleCode})
              </Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.editBtn} 
                  onPress={() => openEditModal(item)}
                >
                  <Text style={styles.editBtnText}>edit</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.deleteBtn} 
                  onPress={() => deleteReport(item)}
                >
                  <Text style={styles.deleteBtnText}>delete</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.courseText}>course: {item.courseName}</Text>
            <Text style={styles.infoText}>week: {item.week}</Text>
            <Text style={styles.infoText}>topic: {item.topic}</Text>
            {item.venue && <Text style={styles.infoText}>venue: {item.venue}</Text>}
            {item.learningOutcomes && (
              <Text style={styles.outcomesText} numberOfLines={2}>
                outcomes: {item.learningOutcomes}
              </Text>
            )}

            <View style={styles.attendanceContainer}>
              <Text style={styles.attendanceLabel}>attendance:</Text>
              <View style={styles.attendanceStats}>
                <Text style={styles.presentCount}>
                  ✅ present: {item.attendancePresent || 0}
                </Text>
                <Text style={styles.totalCount}>
                  📚 total: {item.totalStudents || 0}
                </Text>
              </View>
              <View style={styles.rateContainer}>
                <Text style={[styles.attendanceRate, { color: getAttendanceColor(item.attendanceRate) }]}>
                  {item.attendanceRate || 0}% attendance rate
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${item.attendanceRate || 0}%`,
                        backgroundColor: getAttendanceColor(item.attendanceRate)
                      }
                    ]} 
                  />
                </View>
              </View>
            </View>

            <Text style={styles.date}>
              submitted: {formatDate(item.createdAt)}
            </Text>
          </View>
        ))
      )}

      {/* edit report modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>edit report</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.modalLabel}>module</Text>
              <Text style={styles.modalModuleName}>
                {selectedReport?.moduleName} ({selectedReport?.moduleCode})
              </Text>

              <Text style={styles.modalLabel}>week *</Text>
              <TextInput
                style={styles.modalInput}
                value={editForm.week}
                onChangeText={(text) => handleEditChange("week", text)}
                placeholder="e.g., week 1"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.modalLabel}>topic *</Text>
              <TextInput
                style={styles.modalInput}
                value={editForm.topic}
                onChangeText={(text) => handleEditChange("topic", text)}
                placeholder="enter topic"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.modalLabel}>venue</Text>
              <TextInput
                style={styles.modalInput}
                value={editForm.venue}
                onChangeText={(text) => handleEditChange("venue", text)}
                placeholder="enter venue"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.modalLabel}>learning outcomes</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                value={editForm.learningOutcomes}
                onChangeText={(text) => handleEditChange("learningOutcomes", text)}
                placeholder="enter learning outcomes"
                placeholderTextColor="#94a3b8"
                multiline
              />

              <Text style={styles.modalLabel}>recommendations</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                value={editForm.recommendations}
                onChangeText={(text) => handleEditChange("recommendations", text)}
                placeholder="enter recommendations"
                placeholderTextColor="#94a3b8"
                multiline
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={updateReport}
                  disabled={updating}
                >
                  {updating ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>save changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
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
    marginBottom: 5,
    textTransform: "lowercase",
  },

  subtitle: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 15,
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
    alignItems: "flex-start",
    marginBottom: 10,
  },

  module: {
    fontWeight: "800",
    fontSize: 16,
    flex: 1,
    color: "#e2e8f0",
    textTransform: "lowercase",
  },

  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },

  editBtn: {
    backgroundColor: "#facc15",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  editBtnText: {
    color: "#0f172a",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "lowercase",
  },

  deleteBtn: {
    backgroundColor: "#dc2626",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  deleteBtnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "lowercase",
  },

  courseText: {
    fontSize: 13,
    color: "#94a3b8",
    marginBottom: 4,
    textTransform: "lowercase",
  },

  infoText: {
    fontSize: 13,
    color: "#cbd5e1",
    marginBottom: 4,
    textTransform: "lowercase",
  },

  outcomesText: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 6,
    fontStyle: "italic",
    textTransform: "lowercase",
  },

  attendanceContainer: {
    backgroundColor: "#0f172a",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },

  attendanceLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#facc15",
    marginBottom: 6,
    textTransform: "lowercase",
  },

  attendanceStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  presentCount: {
    fontSize: 12,
    color: "#22c55e",
    textTransform: "lowercase",
  },

  totalCount: {
    fontSize: 12,
    color: "#94a3b8",
    textTransform: "lowercase",
  },

  rateContainer: {
    marginTop: 4,
  },

  attendanceRate: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
    textTransform: "lowercase",
  },

  progressBar: {
    height: 6,
    backgroundColor: "#334155",
    borderRadius: 3,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 3,
  },

  date: {
    marginTop: 10,
    fontSize: 10,
    color: "#94a3b8",
    textAlign: "right",
    textTransform: "lowercase",
  },

  emptyContainer: {
    alignItems: "center",
    marginTop: 50,
  },

  emptyIcon: {
    fontSize: 50,
    marginBottom: 10,
  },

  empty: {
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
    width: "90%",
    maxHeight: "85%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
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

  modalForm: {
    padding: 16,
  },

  modalLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: 5,
    marginTop: 10,
    textTransform: "lowercase",
  },

  modalModuleName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e2e8f0",
    backgroundColor: "#0f172a",
    padding: 12,
    borderRadius: 10,
    marginBottom: 5,
    textTransform: "lowercase",
  },

  modalInput: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
    padding: 12,
    borderRadius: 10,
    color: "#e2e8f0",
    fontSize: 14,
  },

  modalTextArea: {
    height: 80,
    textAlignVertical: "top",
  },

  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
  },

  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  cancelButton: {
    backgroundColor: "#334155",
  },

  cancelButtonText: {
    color: "#e2e8f0",
    fontWeight: "600",
    textTransform: "lowercase",
  },

  saveButton: {
    backgroundColor: "#22c55e",
  },

  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    textTransform: "lowercase",
  },
});