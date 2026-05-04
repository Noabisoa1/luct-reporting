import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function PRLRating() {
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [selectedLecturer, setSelectedLecturer] = useState(null);
  const [lecturerRatings, setLecturerRatings] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState(null);

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

  const fetchRatings = async () => {
    try {
      setError(null);
      console.log("fetching ratings from:", `${BASE_URL}/api/ratings`);
      
      const res = await fetch(`${BASE_URL}/api/ratings`);
      
      console.log("response status:", res.status);
      
      if (!res.ok) {
        throw new Error(`http ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log("ratings data received:", data?.length || 0, "records");
      
      if (!Array.isArray(data)) {
        console.log("data is not an array, using empty array");
        setLecturers([]);
        setLoading(false);
        return;
      }

      // filter by faculty if PRL has faculty
      let allRatings = data;
      if (userData?.faculty) {
        allRatings = allRatings.filter(r => r.lecturerFaculty === userData.faculty);
        console.log(`filtered to ${allRatings.length} ratings for faculty ${userData.faculty}`);
      }

      if (allRatings.length === 0) {
        console.log("no ratings found");
        setLecturers([]);
        setLoading(false);
        return;
      }

      // group by lecturer
      const lecturerMap = {};

      allRatings.forEach((rating) => {
        const lecturerId = rating.lecturerId || rating.id || "unknown";
        const lecturerName = rating.lecturerName || "unknown lecturer";
        const avgRating = rating.averageRating || 0;

        if (!lecturerMap[lecturerId]) {
          lecturerMap[lecturerId] = {
            id: lecturerId,
            name: lecturerName,
            faculty: rating.lecturerFaculty || "",
            totalRatings: 0,
            sumRatings: 0,
            average: 0,
            ratings: [],
          };
        }

        lecturerMap[lecturerId].totalRatings += 1;
        lecturerMap[lecturerId].sumRatings += avgRating;
        lecturerMap[lecturerId].ratings.push({
          studentId: rating.studentId || "",
          studentName: rating.studentName || "",
          studentEmail: rating.studentEmail || "",
          moduleName: rating.moduleName || "",
          moduleCode: rating.moduleCode || "",
          rating: avgRating,
          comment: rating.comment || "",
          date: rating.createdAt,
        });
      });

      // calculate averages
      const lecturersList = Object.values(lecturerMap).map(lec => ({
        ...lec,
        average: lec.totalRatings > 0 ? (lec.sumRatings / lec.totalRatings).toFixed(2) : "0.00",
      }));

      // sort by average rating (highest first)
      lecturersList.sort((a, b) => parseFloat(b.average) - parseFloat(a.average));

      setLecturers(lecturersList);
      console.log(`loaded ${lecturersList.length} lecturers with ratings`);
    } catch (error) {
      console.log("fetch ratings error:", error.message);
      setError(error.message);
      Alert.alert("error", "failed to load ratings: " + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const user = await fetchUserData();
      await fetchRatings();
    };
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRatings();
  };

  const handleLecturerPress = (lecturer) => {
    setSelectedLecturer(lecturer);
    setLecturerRatings(lecturer.ratings);
    setShowDetails(true);
  };

  const handleBack = () => {
    setShowDetails(false);
    setSelectedLecturer(null);
    setLecturerRatings([]);
  };

  const getRatingColor = (rating) => {
    const num = parseFloat(rating);
    if (num >= 4) return "#22c55e";
    if (num >= 3) return "#facc15";
    return "#ef4444";
  };

  const getRatingInsight = (rating) => {
    const num = parseFloat(rating);
    if (num >= 4.5) return "excellent";
    if (num >= 4) return "very good";
    if (num >= 3.5) return "good";
    if (num >= 3) return "satisfactory";
    if (num >= 2) return "needs improvement";
    return "poor";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "unknown";
    try {
      if (dateString.toDate) {
        return dateString.toDate().toLocaleDateString();
      }
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return "unknown";
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>loading ratings...</Text>
      </View>
    );
  }

  if (error && lecturers.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}> {error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchRatings}>
          <Text style={styles.retryText}>retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // DETAILS VIEW
  if (showDetails && selectedLecturer) {
    return (
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#22c55e"]} />
        }
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>lecturer details</Text>
        </View>

        <View style={styles.lecturerDetailCard}>
          <Text style={styles.lecturerName}>{selectedLecturer.name}</Text>
          <Text style={styles.lecturerFaculty}>faculty: {selectedLecturer.faculty || "not specified"}</Text>
          
          <View style={styles.ratingSummary}>
            <Text style={styles.summaryLabel}>overall rating</Text>
            <Text style={[styles.summaryRating, { color: getRatingColor(selectedLecturer.average) }]}>
              {selectedLecturer.average} / 5
            </Text>
            <Text style={styles.summaryInsight}>
              {getRatingInsight(selectedLecturer.average)} performance
            </Text>
            <Text style={styles.summaryCount}>
              based on {selectedLecturer.totalRatings} student rating{selectedLecturer.totalRatings !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        <Text style={styles.subtitle}>student feedback ({lecturerRatings.length})</Text>

        {lecturerRatings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}></Text>
            <Text style={styles.emptyText}>no feedback yet</Text>
          </View>
        ) : (
          lecturerRatings.map((rating, index) => (
            <View key={index} style={styles.feedbackCard}>
              <View style={styles.feedbackHeader}>
                <Text style={styles.moduleName}>{rating.moduleName} ({rating.moduleCode})</Text>
                <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(rating.rating) }]}>
                  <Text style={styles.ratingBadgeText}>{rating.rating}</Text>
                </View>
              </View>
              <Text style={styles.feedbackDate}>submitted: {formatDate(rating.date)}</Text>
              {rating.comment && rating.comment.trim() !== "" && (
                <Text style={styles.commentText}>{rating.comment}</Text>
              )}
              {(!rating.comment || rating.comment.trim() === "") && (
                <Text style={styles.noComment}>no comment provided</Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    );
  }

  // MAIN VIEW - LECTURERS LIST
  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#22c55e"]} />
      }
    >
      <Text style={styles.title}>lecturer ratings</Text>
      
      {userData && (
        <View style={styles.profileCard}>
          <Text style={styles.profileName}>{userData.name}</Text>
          <Text style={styles.profileText}>role: {userData.role}</Text>
          <Text style={styles.profileText}>faculty: {userData.faculty || "not set"}</Text>
        </View>
      )}

      <Text style={styles.subtitle}>total lecturers: {lecturers.length}</Text>

      {lecturers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}></Text>
          <Text style={styles.emptyText}>no ratings found</Text>
          <Text style={styles.emptySubtext}>ratings will appear here once students rate lecturers</Text>
        </View>
      ) : (
        lecturers.map((lecturer) => (
          <TouchableOpacity key={lecturer.id} onPress={() => handleLecturerPress(lecturer)}>
            <View style={styles.lecturerCard}>
              <View style={styles.lecturerHeader}>
                <Text style={styles.lecturerName}>{lecturer.name}</Text>
                <View style={[styles.ratingCircle, { backgroundColor: getRatingColor(lecturer.average) }]}>
                  <Text style={styles.ratingCircleText}>{lecturer.average}</Text>
                </View>
              </View>
              
              <Text style={styles.lecturerFaculty}>faculty: {lecturer.faculty || "not specified"}</Text>
              
              <View style={styles.ratingStats}>
                <Text style={styles.ratingCount}>{lecturer.totalRatings} rating{lecturer.totalRatings !== 1 ? "s" : ""}</Text>
                <Text style={styles.ratingInsight}>{getRatingInsight(lecturer.average)}</Text>
              </View>

              <View style={styles.progressBarPreview}>
                <View 
                  style={[
                    styles.progressFillPreview, 
                    { 
                      width: `${(parseFloat(lecturer.average) / 5) * 100}%`, 
                      backgroundColor: getRatingColor(lecturer.average) 
                    }
                  ]} 
                />
              </View>

              <Text style={styles.tapText}>tap to view details →</Text>
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

  errorText: {
    color: "#ef4444",
    fontSize: 16,
    marginBottom: 15,
  },

  retryBtn: {
    backgroundColor: "#facc15",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 15,
  },

  retryText: {
    color: "#0f172a",
    fontWeight: "700",
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

  lecturerCard: {
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },

  lecturerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  lecturerName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#e2e8f0",
    flex: 1,
    textTransform: "lowercase",
  },

  lecturerFaculty: {
    fontSize: 13,
    color: "#94a3b8",
    marginBottom: 8,
    textTransform: "lowercase",
  },

  ratingCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },

  ratingCircleText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },

  ratingStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  ratingCount: {
    fontSize: 12,
    color: "#94a3b8",
  },

  ratingInsight: {
    fontSize: 12,
    color: "#22c55e",
    fontWeight: "600",
    textTransform: "lowercase",
  },

  progressBarPreview: {
    height: 6,
    backgroundColor: "#334155",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 10,
  },

  progressFillPreview: {
    height: "100%",
    borderRadius: 3,
  },

  tapText: {
    fontSize: 11,
    color: "#facc15",
    textAlign: "right",
    marginTop: 4,
    textTransform: "lowercase",
  },

  lecturerDetailCard: {
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#334155",
  },

  ratingSummary: {
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },

  summaryLabel: {
    fontSize: 12,
    color: "#94a3b8",
    textTransform: "lowercase",
  },

  summaryRating: {
    fontSize: 36,
    fontWeight: "800",
    marginVertical: 5,
  },

  summaryInsight: {
    fontSize: 14,
    color: "#22c55e",
    fontWeight: "600",
    textTransform: "lowercase",
  },

  summaryCount: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 5,
  },

  feedbackCard: {
    backgroundColor: "#0f172a",
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },

  feedbackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  moduleName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#e2e8f0",
    flex: 1,
    textTransform: "lowercase",
  },

  ratingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  ratingBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  feedbackDate: {
    fontSize: 10,
    color: "#94a3b8",
    marginBottom: 8,
  },

  commentText: {
    fontSize: 13,
    color: "#cbd5e1",
    fontStyle: "italic",
    marginTop: 5,
  },

  noComment: {
    fontSize: 12,
    color: "#64748b",
    fontStyle: "italic",
    marginTop: 5,
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