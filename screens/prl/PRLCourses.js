import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function PRLCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [showModules, setShowModules] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [feedbackMap, setFeedbackMap] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedFeedback, setSubmittedFeedback] = useState({});

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

      const activeCourses = Array.isArray(data) ? data.filter(c => c.isActive !== false) : [];
      setCourses(activeCourses);
      console.log(`loaded ${activeCourses.length} courses`);
    } catch (error) {
      console.log("fetch courses error:", error.message);
      Alert.alert("error", error.message);
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

      setModules(Array.isArray(data) ? data : []);
      console.log(`loaded ${data.length} modules for course`);
    } catch (error) {
      console.log("fetch modules error:", error.message);
      Alert.alert("error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/reports`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "failed to load reports");
      }

      let reportsData = Array.isArray(data) ? data : [];
      if (userData?.faculty) {
        reportsData = reportsData.filter(r => r.lecturerFaculty === userData.faculty);
      }

      reportsData.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : 0;
        const dateB = b.createdAt ? new Date(b.createdAt) : 0;
        return dateB - dateA;
      });

      setReports(reportsData);
      setFilteredReports(reportsData);
      
      // track which reports already have feedback
      const hasFeedback = {};
      reportsData.forEach(r => {
        if (r.prlFeedback) {
          hasFeedback[r.id] = true;
        }
      });
      setSubmittedFeedback(hasFeedback);
      
      console.log(`loaded ${reportsData.length} reports`);
    } catch (error) {
      console.log("fetch reports error:", error.message);
      Alert.alert("error", error.message);
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
    if (showReports) {
      await fetchReports();
    } else {
      await fetchCourses();
      if (selectedCourse) {
        await fetchModulesForCourse(selectedCourse.id);
      }
    }
    setRefreshing(false);
  };

  const handleCoursePress = async (course) => {
    setSelectedCourse(course);
    setShowModules(true);
    setShowReports(false);
    await fetchModulesForCourse(course.id);
  };

  const handleViewReports = async () => {
    setShowReports(true);
    setShowModules(false);
    setSelectedCourse(null);
    await fetchReports();
  };

  const handleBackToCourses = () => {
    setShowModules(false);
    setShowReports(false);
    setSelectedCourse(null);
    setFilterText("");
  };

  const handleFeedbackChange = (id, text) => {
    // only allow change if feedback hasn't been submitted yet
    if (!submittedFeedback[id]) {
      setFeedbackMap({
        ...feedbackMap,
        [id]: text,
      });
    }
  };

  const submitFeedback = async (reportId) => {
    // prevent multiple submissions
    if (submittedFeedback[reportId]) {
      Alert.alert("info", "feedback already submitted for this report");
      return;
    }

    const feedback = feedbackMap[reportId];

    if (!feedback || feedback.trim() === "") {
      Alert.alert("error", "please write feedback first");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${BASE_URL}/api/reports/${reportId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prlFeedback: feedback,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "failed to submit feedback");
      }

      // update local state
      const updatedReports = reports.map(r =>
        r.id === reportId ? { ...r, prlFeedback: feedback } : r
      );
      const updatedFiltered = filteredReports.map(r =>
        r.id === reportId ? { ...r, prlFeedback: feedback } : r
      );

      setReports(updatedReports);
      setFilteredReports(updatedFiltered);
      
      // mark as submitted
      setSubmittedFeedback({
        ...submittedFeedback,
        [reportId]: true,
      });

      // clear feedback input for this report
      setFeedbackMap({
        ...feedbackMap,
        [reportId]: "",
      });

      Alert.alert("success", "feedback submitted successfully");
    } catch (error) {
      console.log("submit feedback error:", error.message);
      Alert.alert("error", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // filter reports based on search text
  useEffect(() => {
    if (!filterText) {
      setFilteredReports(reports);
      return;
    }

    const lower = filterText.toLowerCase();
    const filtered = reports.filter(
      (r) =>
        r.courseName?.toLowerCase().includes(lower) ||
        r.moduleName?.toLowerCase().includes(lower) ||
        r.lecturerName?.toLowerCase().includes(lower) ||
        r.moduleCode?.toLowerCase().includes(lower)
    );
    setFilteredReports(filtered);
  }, [filterText, reports]);

  const getStatusColor = (isActive) => {
    return isActive !== false ? "#22c55e" : "#ef4444";
  };

  const getStatusText = (isActive) => {
    return isActive !== false ? "active" : "inactive";
  };

  const getAssignedStatus = (module) => {
    return module.lecturerId && module.lecturerId !== "" ? "assigned" : "unassigned";
  };

  const getAssignedColor = (module) => {
    return module.lecturerId && module.lecturerId !== "" ? "#22c55e" : "#facc15";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "unknown";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  if (loading && !refreshing && !showReports) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>loading...</Text>
      </View>
    );
  }

  // REPORTS VIEW
  if (showReports) {
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
          <Text style={styles.title}>reports & feedback</Text>
        </View>

        {userData && (
          <View style={styles.profileCard}>
            <Text style={styles.profileName}>{userData.name}</Text>
            <Text style={styles.profileText}>role: {userData.role}</Text>
            <Text style={styles.profileText}>faculty: {userData.faculty || "not set"}</Text>
          </View>
        )}

        <TextInput
          placeholder="search by course, module or lecturer..."
          placeholderTextColor="#94a3b8"
          style={styles.search}
          value={filterText}
          onChangeText={setFilterText}
        />

        <Text style={styles.subtitle}>total reports: {filteredReports.length}</Text>

        {filteredReports.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}></Text>
            <Text style={styles.emptyText}>no reports found</Text>
            <Text style={styles.emptySubtext}>reports will appear here once lecturers submit them</Text>
          </View>
        ) : (
          filteredReports.map((item) => {
            const hasFeedback = submittedFeedback[item.id] || item.prlFeedback;
            const isSubmitting = submitting && feedbackMap[item.id];
            
            return (
              <View key={item.id} style={styles.reportCard}>
                <Text style={styles.reportTitle}>
                  {item.moduleName} ({item.moduleCode})
                </Text>
                <Text style={styles.reportSubtitle}>course: {item.courseName}</Text>
                <Text style={styles.reportInfo}>lecturer: {item.lecturerName}</Text>
                <Text style={styles.reportInfo}>week: {item.week} | date: {item.date}</Text>
                <Text style={styles.reportInfo}>venue: {item.venue} | time: {item.scheduledTime}</Text>

                <Text style={styles.sectionTitle}>topic</Text>
                <Text style={styles.reportText}>{item.topic}</Text>

                <Text style={styles.sectionTitle}>learning outcomes</Text>
                <Text style={styles.reportText}>{item.learningOutcomes || "not provided"}</Text>

                <Text style={styles.sectionTitle}>recommendations</Text>
                <Text style={styles.reportText}>{item.recommendations || "not provided"}</Text>

                <View style={styles.attendanceBox}>
                  <Text style={styles.attendanceText}>
                    attendance: {item.attendancePresent || 0} / {item.totalStudents || 0} students
                  </Text>
                  <Text style={styles.attendanceRate}>
                    rate: {item.attendanceRate || 0}%
                  </Text>
                </View>

                <View style={styles.feedbackBox}>
                  <Text style={styles.sectionTitle}>prl feedback</Text>
                  {item.prlFeedback ? (
                    <Text style={styles.existingFeedback}>{item.prlFeedback}</Text>
                  ) : (
                    <Text style={styles.noFeedback}>no feedback yet</Text>
                  )}
                </View>
                {!hasFeedback ? (
                  <>
                    <TextInput
                      placeholder="write your feedback here..."
                      placeholderTextColor="#94a3b8"
                      style={styles.feedbackInput}
                      value={feedbackMap[item.id] || ""}
                      onChangeText={(text) => handleFeedbackChange(item.id, text)}
                      multiline
                      editable={!hasFeedback}
                    />

                    <TouchableOpacity
                      style={[styles.feedbackBtn, isSubmitting && styles.disabledBtn]}
                      onPress={() => submitFeedback(item.id)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.feedbackBtnText}>submit feedback</Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.feedbackSubmittedBox}>
                    <Text style={styles.feedbackSubmittedText}> feedback submitted</Text>
                  </View>
                )}

                <Text style={styles.dateInfo}>
                  submitted: {formatDate(item.createdAt)}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>
    );
  }

  // COURSES VIEW (with modules)
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
          <Text style={styles.title}>modules</Text>
        </View>

        <View style={styles.courseInfoCard}>
          <Text style={styles.courseTitle}>{selectedCourse.courseName}</Text>
          <Text style={styles.courseSubtitle}>code: {selectedCourse.courseCode}</Text>
          <Text style={styles.courseSubtitle}>faculty: {selectedCourse.faculty}</Text>
          <Text style={styles.courseSubtitle}>class: {selectedCourse.classYear}</Text>
        </View>

        <Text style={styles.subtitle}>modules ({modules.length})</Text>

        {modules.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📖</Text>
            <Text style={styles.emptyText}>no modules found</Text>
            <Text style={styles.emptySubtext}>add modules to this course</Text>
          </View>
        ) : (
          modules.map((item) => (
            <View key={item.id} style={styles.moduleCard}>
              <View style={styles.moduleHeader}>
                <Text style={styles.moduleName}>{item.moduleName}</Text>
                <View style={[styles.moduleBadge, { backgroundColor: getAssignedColor(item) }]}>
                  <Text style={styles.moduleBadgeText}>{getAssignedStatus(item)}</Text>
                </View>
              </View>
              <Text style={styles.moduleCode}>code: {item.moduleCode}</Text>
              <Text style={styles.lecturerInfo}>
                lecturer: {item.lecturerName || "not assigned yet"}
              </Text>
              {item.studentIds && item.studentIds.length > 0 && (
                <Text style={styles.studentInfo}>students enrolled: {item.studentIds.length}</Text>
              )}
              {item.averageRating > 0 && (
                <Text style={styles.ratingInfo}>⭐ rating: {item.averageRating} ({item.totalRatings} reviews)</Text>
              )}
            </View>
          ))
        )}

        <TouchableOpacity style={styles.viewReportsBtn} onPress={handleViewReports}>
          <Text style={styles.viewReportsBtnText}>view all reports →</Text>
        </TouchableOpacity>
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
          <Text style={styles.emptySubtext}>create a course from the pl dashboard</Text>
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
                  <Text style={styles.statNumber}>{item.modules?.length || 0}</Text>
                  <Text style={styles.statLabel}>modules</Text>
                </View>
              </View>

              <Text style={styles.tapText}>tap to view modules →</Text>

              <Text style={styles.dateInfo}>
                created: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "unknown"}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      <TouchableOpacity style={styles.viewReportsBtn} onPress={handleViewReports}>
        <Text style={styles.viewReportsBtnText}>view all reports →</Text>
      </TouchableOpacity>
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

  search: {
    backgroundColor: "#1e293b",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    color: "#e2e8f0",
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
    flex: 1,
    textTransform: "lowercase",
  },

  moduleCode: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 4,
    textTransform: "lowercase",
  },

  moduleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  moduleBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "lowercase",
  },

  lecturerInfo: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
    textTransform: "lowercase",
  },

  studentInfo: {
    fontSize: 11,
    color: "#facc15",
    marginTop: 4,
  },

  ratingInfo: {
    fontSize: 11,
    color: "#22c55e",
    marginTop: 4,
  },

  viewReportsBtn: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 20,
  },

  viewReportsBtnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    textTransform: "lowercase",
  },

  reportCard: {
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },

  reportTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#facc15",
    marginBottom: 4,
    textTransform: "lowercase",
  },

  reportSubtitle: {
    fontSize: 13,
    color: "#e2e8f0",
    marginBottom: 2,
    textTransform: "lowercase",
  },

  reportInfo: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 2,
    textTransform: "lowercase",
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#e2e8f0",
    marginTop: 10,
    marginBottom: 4,
    textTransform: "lowercase",
  },

  reportText: {
    fontSize: 13,
    color: "#cbd5e1",
  },

  attendanceBox: {
    backgroundColor: "#0f172a",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  attendanceText: {
    fontSize: 12,
    color: "#22c55e",
  },

  attendanceRate: {
    fontSize: 12,
    color: "#facc15",
    fontWeight: "700",
  },

  feedbackBox: {
    backgroundColor: "#0f172a",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },

  existingFeedback: {
    color: "#38bdf8",
    fontSize: 13,
    fontStyle: "italic",
  },

  noFeedback: {
    color: "#94a3b8",
    fontSize: 12,
    fontStyle: "italic",
  },

  feedbackInput: {
    backgroundColor: "#0f172a",
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
    color: "#e2e8f0",
    minHeight: 60,
    textAlignVertical: "top",
  },

  feedbackBtn: {
    backgroundColor: "#22c55e",
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
  },

  disabledBtn: {
    backgroundColor: "#166534",
  },

  feedbackBtnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    textTransform: "lowercase",
  },

  feedbackSubmittedBox: {
    backgroundColor: "#064e3b",
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
    alignItems: "center",
  },

  feedbackSubmittedText: {
    color: "#22c55e",
    fontWeight: "700",
    textTransform: "lowercase",
  },

  emptyContainer: {
    alignItems: "center",
    marginTop: 50,
    marginBottom: 20,
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