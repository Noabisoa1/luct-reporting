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
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const QUESTIONS = [
  "Was the lecturer prepared for class?",
  "Did the lecturer explain concepts clearly?",
  "Was the lecture engaging?",
  "Did the lecturer encourage participation?",
  "Was the pace of teaching appropriate?",
  "Did the lecturer provide useful examples?",
  "Was the lecturer punctual?",
  "Were learning materials helpful?",
  "Did the lecturer answer questions effectively?",
  "Overall satisfaction with this module?"
];

export default function StudentRating() {
  const [modules, setModules] = useState([]);
  const [student, setStudent] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState(null);

  const [ratings, setRatings] = useState({});
  const [comment, setComment] = useState("");

  const BASE_URL = "https://luct-reporting-2-932p.onrender.com";

  useEffect(() => {
    loadData();
  }, []);

  const getUserId = async () => {
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

  const loadData = async () => {
    try {
      setLoading(true);
      const uid = await getUserId();
      if (!uid) {
        Alert.alert("Error", "User not found. Please login again.");
        setLoading(false);
        return;
      }
      await Promise.all([loadStudentAndModules(uid), loadAlreadyRated(uid)]);
    } catch (error) {
      console.log("Load data error:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const loadStudentAndModules = async (uid) => {
    try {
      const userRes = await fetch(`${BASE_URL}/api/users/${uid}`);
      if (!userRes.ok) throw new Error("Failed to load student data");
      const userData = await userRes.json();
      setStudent(userData);

      const registered = userData.registeredModules || [];
      
      if (registered.length === 0) {
        setModules([]);
        return;
      }

      const modulesList = [];
      
      for (const reg of registered) {
        try {
          const moduleRes = await fetch(`${BASE_URL}/api/courses/modules/${reg.moduleId}`);
          if (moduleRes.ok) {
            const moduleData = await moduleRes.json();
            if (moduleData.lecturerId && moduleData.lecturerId !== "") {
              modulesList.push({
                id: moduleData.id,
                ...moduleData,
                registeredAt: reg.registeredAt,
              });
            }
          } else {
            console.log(`Module ${reg.moduleId} not found - status: ${moduleRes.status}`);
          }
        } catch (err) {
          console.log(`Error fetching module ${reg.moduleId}:`, err.message);
        }
      }
      
      setModules(modulesList);
    } catch (err) {
      console.log("Load modules error:", err.message);
      Alert.alert("Error", "Failed to load modules");
    }
  };

  const loadAlreadyRated = async (uid) => {
    try {
      const res = await fetch(`${BASE_URL}/api/ratings/student/${uid}`);
      if (res.ok) {
        const ratings = await res.json();
        const ratedModuleIds = ratings.map(r => r.moduleId);
        setAlreadyRated(ratedModuleIds);
      } else {
        setAlreadyRated([]);
      }
    } catch (err) {
      console.log("Load rated error:", err.message);
      setAlreadyRated([]);
    }
  };

  const hasRatedModule = (moduleId) => {
    return alreadyRated.includes(moduleId);
  };

  const handleRatingChange = (index, value) => {
    setRatings((prev) => ({
      ...prev,
      [index]: value,
    }));
  };

  const calculateAverageRating = () => {
    const values = Object.values(ratings);
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return (sum / values.length).toFixed(1);
  };

  const submitRating = async () => {
    if (!selectedModule) {
      Alert.alert("Error", "Select a module first");
      return;
    }

    if (hasRatedModule(selectedModule.id)) {
      Alert.alert("Error", "You have already rated this module");
      return;
    }

    if (Object.keys(ratings).length < QUESTIONS.length) {
      Alert.alert("Error", "Please rate all questions");
      return;
    }

    if (!student) {
      Alert.alert("Error", "Student data not found");
      return;
    }

    setSubmitting(true);

    try {
      const uid = await getUserId();
      const averageRating = Object.values(ratings).reduce((a, b) => a + b, 0) / QUESTIONS.length;

      const response = await fetch(`${BASE_URL}/api/ratings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: uid,
          studentName: student.name,
          studentEmail: student.email,
          studentFaculty: student.faculty,
          studentSemester: student.semester,
          moduleId: selectedModule.id,
          moduleName: selectedModule.moduleName,
          moduleCode: selectedModule.moduleCode,
          courseId: selectedModule.courseId,
          courseName: selectedModule.courseName,
          lecturerId: selectedModule.lecturerId,
          lecturerName: selectedModule.lecturerName,
          ratings: ratings,
          averageRating: parseFloat(averageRating.toFixed(2)),
          comment: comment.trim() || "",
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      // Prepare feedback data
      const feedback = {
        moduleName: selectedModule.moduleName,
        lecturerName: selectedModule.lecturerName,
        averageRating: averageRating.toFixed(1),
        totalQuestions: QUESTIONS.length,
        comment: comment.trim() || "No comment provided",
        ratingBreakdown: Object.values(ratings),
      };
      
      setFeedbackData(feedback);
      setShowFeedback(true);

      setSelectedModule(null);
      setRatings({});
      setComment("");
      
      const uid2 = await getUserId();
      await loadAlreadyRated(uid2);
      
    } catch (err) {
      console.log("Submit rating error:", err.message);
      Alert.alert("Error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStarRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push("★");
    }
    if (hasHalfStar) {
      stars.push("½");
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push("☆");
    }
    return stars.join("");
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Loading modules...</Text>
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Student data not found</Text>
      </View>
    );
  }

  const availableModules = modules.filter(m => !hasRatedModule(m.id));
  const ratedModulesList = modules.filter(m => hasRatedModule(m.id));

  return (
    <>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#22c55e"]} />
        }
      >
        <Text style={styles.header}>Student Rating</Text>
        <Text style={styles.subtitle}>Rate your lecturers</Text>

        {modules.length === 0 && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>No modules available</Text>
            <Text style={styles.warningSubtext}>
              You need to register for modules first in Register Modules
            </Text>
          </View>
        )}

        {/* Available Modules to Rate */}
        <Text style={styles.sectionTitle}>
          Available to Rate ({availableModules.length})
        </Text>

        <FlatList
          data={availableModules}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {modules.length === 0 
                ? "No modules found. Please register for modules first."
                : "All modules have been rated"}
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.card,
                selectedModule?.id === item.id && styles.selected,
              ]}
              onPress={() => {
                setSelectedModule(item);
                setRatings({});
                setComment("");
              }}
            >
              <Text style={styles.titleText}>{item.moduleName}</Text>
              <Text style={styles.text}>Code: {item.moduleCode}</Text>
              <Text style={styles.text}>Lecturer: {item.lecturerName}</Text>
              <Text style={styles.text}>Course: {item.courseName}</Text>
            </TouchableOpacity>
          )}
        />

        {/* Already Rated Modules */}
        {ratedModulesList.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              Already Rated ({ratedModulesList.length})
            </Text>

            {ratedModulesList.map((item) => (
              <View key={item.id} style={styles.ratedCard}>
                <Text style={styles.titleText}>{item.moduleName}</Text>
                <Text style={styles.text}>Lecturer: {item.lecturerName}</Text>
                <Text style={styles.text}>Course: {item.courseName}</Text>
                <View style={styles.ratedBadge}>
                  <Text style={styles.ratedBadgeText}>✓ Rated</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Rating Form */}
        {selectedModule && (
          <View style={styles.formContainer}>
            <View style={styles.headerCard}>
              <Text style={styles.headerText}>
                Rate {selectedModule.lecturerName}
              </Text>
              <Text style={styles.smallText}>
                Module: {selectedModule.moduleName} ({selectedModule.moduleCode})
              </Text>
              <Text style={styles.smallText}>
                Course: {selectedModule.courseName}
              </Text>
            </View>

            {QUESTIONS.map((q, index) => (
              <View key={index} style={styles.questionCard}>
                <Text style={styles.question}>
                  {index + 1}. {q}
                </Text>

                <View style={styles.row}>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.ratingBtn,
                        ratings[index] === num && styles.selectedRating,
                      ]}
                      onPress={() => handleRatingChange(index, num)}
                    >
                      <Text style={styles.ratingText}>{num}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            <View style={styles.commentBox}>
              <TextInput
                placeholder="General Comment (optional)"
                placeholderTextColor="#94a3b8"
                style={styles.commentInput}
                value={comment}
                onChangeText={setComment}
                multiline
              />
            </View>

            <TouchableOpacity 
              style={[styles.button, submitting && styles.disabledBtn]} 
              onPress={submitRating}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnText}>Submit Rating</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Feedback Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showFeedback}
        onRequestClose={() => setShowFeedback(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thank You for Your Feedback!</Text>
              <TouchableOpacity onPress={() => setShowFeedback(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {feedbackData && (
              <>
                <View style={styles.feedbackIcon}>
                  <Text style={styles.feedbackIconText}>⭐</Text>
                </View>

                <Text style={styles.moduleNameFeedback}>{feedbackData.moduleName}</Text>
                <Text style={styles.lecturerNameFeedback}>Lecturer: {feedbackData.lecturerName}</Text>

                <View style={styles.ratingSummary}>
                  <Text style={styles.averageRatingLabel}>Your Rating</Text>
                  <Text style={styles.averageRatingValue}>{feedbackData.averageRating} / 5.0</Text>
                  <Text style={styles.starRating}>{getStarRating(parseFloat(feedbackData.averageRating))}</Text>
                </View>

                <View style={styles.breakdownContainer}>
                  <Text style={styles.breakdownTitle}>Rating Breakdown:</Text>
                  {feedbackData.ratingBreakdown.map((rating, idx) => (
                    <View key={idx} style={styles.breakdownRow}>
                      <Text style={styles.breakdownQuestion}>Q{idx + 1}</Text>
                      <View style={styles.breakdownBar}>
                        <View style={[styles.breakdownFill, { width: `${(rating / 5) * 100}%` }]} />
                      </View>
                      <Text style={styles.breakdownValue}>{rating}/5</Text>
                    </View>
                  ))}
                </View>

                {feedbackData.comment !== "No comment provided" && (
                  <View style={styles.commentFeedback}>
                    <Text style={styles.commentFeedbackLabel}>Your Comment:</Text>
                    <Text style={styles.commentFeedbackText}>{feedbackData.comment}</Text>
                  </View>
                )}

                <TouchableOpacity 
                  style={styles.doneButton}
                  onPress={() => setShowFeedback(false)}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
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

  errorText: {
    color: "#ef4444",
    fontSize: 16,
  },

  header: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 5,
    color: "#facc15",
  },

  subtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e2e8f0",
    marginBottom: 10,
    marginTop: 10,
  },

  card: {
    backgroundColor: "#1e293b",
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },

  selected: {
    backgroundColor: "#16a34a",
    borderColor: "#16a34a",
  },

  ratedCard: {
    backgroundColor: "#064e3b",
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#22c55e",
    opacity: 0.8,
  },

  titleText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: 3,
  },

  text: {
    fontSize: 12,
    color: "#cbd5e1",
    marginTop: 2,
  },

  ratedBadge: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 8,
  },

  ratedBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },

  formContainer: {
    marginTop: 20,
    marginBottom: 30,
  },

  headerCard: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 14,
    marginBottom: 15,
  },

  headerText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },

  smallText: {
    color: "#e0e7ff",
    fontSize: 12,
    marginTop: 3,
  },

  questionCard: {
    backgroundColor: "#1e293b",
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },

  question: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f1f5f9",
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  ratingBtn: {
    width: 42,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
  },

  selectedRating: {
    backgroundColor: "#16a34a",
    borderColor: "#16a34a",
  },

  ratingText: {
    color: "#fff",
    fontWeight: "700",
  },

  commentBox: {
    backgroundColor: "#1e293b",
    padding: 10,
    borderRadius: 14,
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },

  commentInput: {
    minHeight: 80,
    color: "#fff",
    textAlignVertical: "top",
  },

  button: {
    backgroundColor: "#16a34a",
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
  },

  disabledBtn: {
    backgroundColor: "#475569",
  },

  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
  },

  emptyText: {
    color: "#94a3b8",
    textAlign: "center",
    padding: 20,
  },

  warningBox: {
    backgroundColor: "#facc15",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },

  warningText: {
    color: "#0f172a",
    fontWeight: "700",
    textAlign: "center",
  },

  warningSubtext: {
    color: "#0f172a",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
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
    maxHeight: "85%",
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
  },

  modalClose: {
    fontSize: 24,
    color: "#94a3b8",
    fontWeight: "600",
  },

  feedbackIcon: {
    alignItems: "center",
    marginBottom: 10,
  },

  feedbackIconText: {
    fontSize: 50,
  },

  moduleNameFeedback: {
    fontSize: 18,
    fontWeight: "700",
    color: "#e2e8f0",
    textAlign: "center",
    marginBottom: 5,
  },

  lecturerNameFeedback: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 15,
  },

  ratingSummary: {
    backgroundColor: "#0f172a",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
  },

  averageRatingLabel: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 5,
  },

  averageRatingValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#facc15",
  },

  starRating: {
    fontSize: 20,
    color: "#facc15",
    marginTop: 5,
  },

  breakdownContainer: {
    marginBottom: 15,
  },

  breakdownTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e2e8f0",
    marginBottom: 10,
  },

  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  breakdownQuestion: {
    width: 35,
    fontSize: 12,
    color: "#94a3b8",
  },

  breakdownBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#334155",
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: "hidden",
  },

  breakdownFill: {
    height: "100%",
    backgroundColor: "#22c55e",
    borderRadius: 4,
  },

  breakdownValue: {
    width: 30,
    fontSize: 12,
    color: "#e2e8f0",
    textAlign: "right",
  },

  commentFeedback: {
    backgroundColor: "#0f172a",
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
  },

  commentFeedbackLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: 5,
  },

  commentFeedbackText: {
    fontSize: 14,
    color: "#e2e8f0",
    fontStyle: "italic",
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
  },
});