import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function PLRatings() {
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [selectedLecturer, setSelectedLecturer] = useState(null);
  const [lecturerDetails, setLecturerDetails] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

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
      console.log("fetching all ratings...");
      
      const res = await fetch(`${BASE_URL}/api/ratings`);
      
      if (!res.ok) {
        throw new Error(`http ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log("ratings data received:", data?.length || 0);
      
      if (!Array.isArray(data)) {
        setLecturers([]);
        return;
      }

      // filter by faculty if PL has faculty
      let allRatings = data;
      if (userData?.faculty) {
        allRatings = allRatings.filter(r => r.lecturerFaculty === userData.faculty);
        console.log(`filtered to ${allRatings.length} ratings for faculty ${userData.faculty}`);
      }

      if (allRatings.length === 0) {
        setLecturers([]);
        return;
      }

      // group by lecturer
      const lecturerMap = {};

      allRatings.forEach((rating) => {
        const lecturerId = rating.lecturerId || "unknown";
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
            moduleRatings: [],
          };
        }

        lecturerMap[lecturerId].totalRatings += 1;
        lecturerMap[lecturerId].sumRatings += avgRating;
        lecturerMap[lecturerId].moduleRatings.push({
          moduleId: rating.moduleId,
          moduleName: rating.moduleName,
          moduleCode: rating.moduleCode,
          rating: avgRating,
          studentCount: 1,
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
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchUserData();
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
    setLecturerDetails(lecturer);
    setShowDetails(true);
  };

  const handleBack = () => {
    setShowDetails(false);
    setSelectedLecturer(null);
    setLecturerDetails(null);
  };

  const getRatingColor = (rating) => {
    const num = parseFloat(rating);
    if (num >= 4) return "#22c55e";
    if (num >= 3) return "#facc15";
    return "#ef4444";
  };

  const getPerformanceText = (score) => {
    const num = parseFloat(score);
    if (num >= 4.5) return "outstanding";
    if (num >= 4) return "excellent";
    if (num >= 3.5) return "very good";
    if (num >= 3) return "good";
    if (num >= 2) return "average";
    return "needs improvement";
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>loading ratings...</Text>
      </View>
    );
  }

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

        <View style={styles.detailCard}>
          <Text style={styles.lecturerName}>{selectedLecturer.name}</Text>
          <Text style={styles.lecturerFaculty}>faculty: {selectedLecturer.faculty || "not specified"}</Text>
          
          <View style={styles.ratingSummary}>
            <Text style={styles.summaryLabel}>overall rating</Text>
            <Text style={[styles.summaryRating, { color: getRatingColor(selectedLecturer.average) }]}>
              {selectedLecturer.average} / 5
            </Text>
            <Text style={styles.summaryInsight}>
              {getPerformanceText(selectedLecturer.average)} performance
            </Text>
            <Text style={styles.summaryCount}>
              based on {selectedLecturer.totalRatings} rating{selectedLecturer.totalRatings !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        <Text style={styles.subtitle}>module ratings ({selectedLecturer.moduleRatings?.length || 0})</Text>

        {selectedLecturer.moduleRatings?.map((module, idx) => (
          <View key={idx} style={styles.moduleCard}>
            <Text style={styles.moduleName}>{module.moduleName}</Text>
            <Text style={styles.moduleCode}>code: {module.moduleCode}</Text>
            <View style={styles.moduleRatingRow}>
              <Text style={styles.moduleRatingLabel}>average rating:</Text>
              <Text style={[styles.moduleRatingValue, { color: getRatingColor(module.rating) }]}>
                {module.rating} / 5
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    );
  }

  // LECTURERS LIST
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
          <Text style={styles.emptyIcon}>⭐</Text>
          <Text style={styles.emptyText}>no ratings found</Text>
          <Text style={styles.emptySubtext}>ratings will appear here once students rate lecturers</Text>
        </View>
      ) : (
        lecturers.map((lecturer, index) => {
          const widthPercent = (parseFloat(lecturer.average) / 5) * 100;
          
          return (
            <TouchableOpacity key={lecturer.id} onPress={() => handleLecturerPress(lecturer)}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.rank}>{index + 1}</Text>
                  <View style={[styles.ratingCircle, { backgroundColor: getRatingColor(lecturer.average) }]}>
                    <Text style={styles.ratingCircleText}>{lecturer.average}</Text>
                  </View>
                </View>

                <Text style={styles.lecturerName}>{lecturer.name}</Text>
                <Text style={styles.lecturerFaculty}>faculty: {lecturer.faculty || "not specified"}</Text>
                
                <Text style={styles.ratingCount}> {lecturer.totalRatings} rating{lecturer.totalRatings !== 1 ? "s" : ""}</Text>

                <View style={styles.barBackground}>
                  <View style={[styles.barFill, { width: `${widthPercent}%`, backgroundColor: getRatingColor(lecturer.average) }]} />
                </View>

                <View style={styles.statsRow}>
                  <Text style={styles.score}>{lecturer.average} / 5</Text>
                  <Text style={[styles.performance, { color: getRatingColor(lecturer.average) }]}>
                    {getPerformanceText(lecturer.average)}
                  </Text>
                </View>

                <Text style={styles.tapText}>tap to view details →</Text>
              </View>
            </TouchableOpacity>
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

  rank: {
    fontSize: 14,
    fontWeight: "700",
    color: "#facc15",
  },

  ratingCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: "center",
    alignItems: "center",
  },

  ratingCircleText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },

  lecturerName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#e2e8f0",
    marginBottom: 4,
    textTransform: "lowercase",
  },

  lecturerFaculty: {
    fontSize: 13,
    color: "#94a3b8",
    marginBottom: 8,
    textTransform: "lowercase",
  },

  ratingCount: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 10,
  },

  barBackground: {
    height: 8,
    backgroundColor: "#334155",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },

  barFill: {
    height: "100%",
    borderRadius: 4,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  score: {
    fontWeight: "700",
    color: "#38bdf8",
    fontSize: 14,
  },

  performance: {
    fontWeight: "700",
    fontSize: 12,
    textTransform: "lowercase",
  },

  tapText: {
    fontSize: 11,
    color: "#facc15",
    textAlign: "right",
    marginTop: 4,
    textTransform: "lowercase",
  },

  detailCard: {
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

  moduleCard: {
    backgroundColor: "#0f172a",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },

  moduleName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#e2e8f0",
    marginBottom: 4,
    textTransform: "lowercase",
  },

  moduleCode: {
    fontSize: 11,
    color: "#94a3b8",
    marginBottom: 8,
    textTransform: "lowercase",
  },

  moduleRatingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  moduleRatingLabel: {
    fontSize: 12,
    color: "#94a3b8",
  },

  moduleRatingValue: {
    fontSize: 14,
    fontWeight: "700",
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