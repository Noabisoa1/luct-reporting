import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const QUESTIONS = [
  "Prepared for class",
  "Explained clearly",
  "Engaging lecture",
  "Encouraged participation",
  "Good pace",
  "Useful examples",
  "Punctual",
  "Helpful materials",
  "Answered questions",
  "Overall satisfaction",
];

export default function LecturerRatings({ route, navigation }) {
  const [ratings, setRatings] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);

  const BASE_URL = "http://10.11.13.251:5000";

  const getLecturerId = async () => {
    try {
      // First try to get from route params
      if (route?.params?.user) {
        const user = route.params.user;
        return user.uid || user.id;
      }
      
      // Then try from AsyncStorage
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

  const fetchUserData = async () => {
    try {
      const lecturerId = await getLecturerId();
      if (!lecturerId) return null;

      const res = await fetch(`${BASE_URL}/api/users/${lecturerId}`);
      if (res.ok) {
        const data = await res.json();
        setUserData(data);
        return data;
      }
      return null;
    } catch (error) {
      console.log("Fetch user error:", error);
      return null;
    }
  };

  const fetchRatings = async () => {
    try {
      const lecturerId = await getLecturerId();
      
      if (!lecturerId) {
        console.log("No lecturer ID found");
        Alert.alert("Error", "User not found. Please login again.");
        setLoading(false);
        return;
      }

      const res = await fetch(`${BASE_URL}/api/ratings/lecturer/${lecturerId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load ratings");
      }

      const allRatings = data.ratings || [];
      setRatings(allRatings);

      // Get unique modules from ratings
      const uniqueModules = [];
      const moduleMap = new Map();
      
      allRatings.forEach((rating) => {
        if (!moduleMap.has(rating.moduleId)) {
          moduleMap.set(rating.moduleId, {
            moduleId: rating.moduleId,
            moduleName: rating.moduleName,
            moduleCode: rating.moduleCode,
            courseId: rating.courseId,
            courseName: rating.courseName,
          });
        }
      });
      
      moduleMap.forEach((value) => {
        uniqueModules.push(value);
      });
      
      setModules(uniqueModules);
      console.log(`Loaded ${allRatings.length} ratings for ${uniqueModules.length} modules`);
    } catch (error) {
      console.log("Fetch ratings error:", error.message);
      Alert.alert("Error", error.message);
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

  const calculateModuleAverages = () => {
    if (!selectedModule) return null;
    
    const moduleRatings = ratings.filter(
      (r) => r.moduleId === selectedModule.moduleId
    );

    if (moduleRatings.length === 0) return null;

    const totals = Array(QUESTIONS.length).fill(0);
    
    moduleRatings.forEach((rating) => {
      const ratingValues = rating.ratings || {};
      Object.keys(ratingValues).forEach((key) => {
        const index = parseInt(key);
        if (!isNaN(index) && index < QUESTIONS.length) {
          totals[index] += ratingValues[key];
        }
      });
    });

    const averages = totals.map((total) =>
      moduleRatings.length ? (total / moduleRatings.length).toFixed(2) : "0.00"
    );

    const overall =
      averages.reduce((sum, val) => sum + parseFloat(val), 0) / QUESTIONS.length;

    // Get anonymous ratings (remove student names)
    const anonymousRatings = moduleRatings.map((rating) => ({
      averageRating: rating.averageRating,
      comment: rating.comment,
      createdAt: rating.createdAt,
      // No student name/email - anonymous
    }));

    return {
      averages,
      overall: overall.toFixed(2),
      count: moduleRatings.length,
      anonymousRatings,
    };
  };

  const getRatingColor = (score) => {
    const num = parseFloat(score);
    if (num >= 4) return "#22c55e";
    if (num >= 3) return "#facc15";
    return "#ef4444";
  };

  const getRatingInsight = (overall) => {
    const num = parseFloat(overall);
    if (num >= 4.5) return "Excellent teaching performance! Students love your classes.";
    if (num >= 4) return "Very good performance. Keep up the great work!";
    if (num >= 3.5) return "Good performance with room for improvement.";
    if (num >= 3) return "Satisfactory. Consider student feedback for improvement.";
    if (num >= 2) return "Needs improvement. Review student feedback carefully.";
    return "Requires significant improvement. Please seek mentorship.";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Loading ratings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Ratings</Text>
      
      {userData && (
        <View style={styles.profileCard}>
          <Text style={styles.profileName}>{userData.name}</Text>
          <Text style={styles.profileText}>Total Ratings Received: {ratings.length}</Text>
          <Text style={styles.profileText}>Modules with Ratings: {modules.length}</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Select Module</Text>

      <FlatList
        data={modules}
        keyExtractor={(item) => item.moduleId}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#22c55e"]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>⭐</Text>
            <Text style={styles.emptyText}>No ratings yet</Text>
            <Text style={styles.emptySubtext}>
              Students will rate your modules after attending your classes
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const moduleRatings = ratings.filter(r => r.moduleId === item.moduleId);
          const avgScore = moduleRatings.length > 0
            ? (moduleRatings.reduce((sum, r) => sum + (r.averageRating || 0), 0) / moduleRatings.length).toFixed(1)
            : 0;
          
          return (
            <TouchableOpacity
              style={[
                styles.card,
                selectedModule?.moduleId === item.moduleId && styles.selected,
              ]}
              onPress={() => setSelectedModule(item)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.moduleName}>{item.moduleName}</Text>
                <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(avgScore) }]}>
                  <Text style={styles.ratingBadgeText}>⭐ {avgScore}</Text>
                </View>
              </View>
              <Text style={styles.moduleCode}>Code: {item.moduleCode}</Text>
              <Text style={styles.courseName}>Course: {item.courseName}</Text>
              <Text style={styles.ratingCount}>
                {moduleRatings.length} student{moduleRatings.length !== 1 ? "s" : ""} rated
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {selectedModule && (
        <ScrollView style={styles.results} showsVerticalScrollIndicator={false}>
          {(() => {
            const data = calculateModuleAverages();
            if (!data) return null;

            return (
              <View style={styles.summaryBox}>
                <View style={styles.summaryHeader}>
                  <Text style={styles.summaryTitle}>
                    {selectedModule.moduleName}
                  </Text>
                  <Text style={styles.summarySubtitle}>
                    {selectedModule.courseName}
                  </Text>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{data.count}</Text>
                    <Text style={styles.statLabel}>Students Rated</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: getRatingColor(data.overall) }]}>
                      {data.overall}
                    </Text>
                    <Text style={styles.statLabel}>Overall Score</Text>
                  </View>
                </View>

                <View style={styles.progressSection}>
                  <Text style={styles.progressTitle}>Rating Breakdown</Text>
                  {data.averages.map((score, i) => (
                    <View key={i} style={styles.progressRow}>
                      <Text style={styles.progressQuestion}>Q{i + 1}</Text>
                      <View style={styles.progressBarContainer}>
                        <View 
                          style={[
                            styles.progressBar, 
                            { 
                              width: `${(parseFloat(score) / 5) * 100}%`,
                              backgroundColor: getRatingColor(score)
                            }
                          ]} 
                        />
                      </View>
                      <Text style={styles.progressScore}>{score}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.insightBox}>
                  <Text style={styles.insightText}>
                    {getRatingInsight(data.overall)}
                  </Text>
                </View>

                {/* Anonymous Student Comments */}
                {data.anonymousRatings.some(r => r.comment && r.comment.trim()) && (
                  <View style={styles.commentsSection}>
                    <Text style={styles.commentsTitle}>Student Feedback (Anonymous)</Text>
                    {data.anonymousRatings.map((rating, idx) => (
                      rating.comment && rating.comment.trim() && (
                        <View key={idx} style={styles.commentCard}>
                          <View style={styles.commentHeader}>
                            <Text style={styles.commentRating}>⭐ {rating.averageRating}</Text>
                            <Text style={styles.commentDate}>{formatDate(rating.createdAt)}</Text>
                          </View>
                          <Text style={styles.commentText}>{rating.comment}</Text>
                        </View>
                      )
                    ))}
                  </View>
                )}
              </View>
            );
          })()}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 15,
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

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e2e8f0",
    marginBottom: 10,
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

  list: {
    paddingBottom: 10,
  },

  card: {
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },

  selected: {
    backgroundColor: "#1e3a5f",
    borderColor: "#2563eb",
    borderWidth: 2,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },

  moduleName: {
    fontWeight: "800",
    fontSize: 16,
    color: "#f1f5f9",
    flex: 1,
  },

  moduleCode: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 4,
  },

  courseName: {
    fontSize: 12,
    color: "#cbd5e1",
    marginBottom: 6,
  },

  ratingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  ratingBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  ratingCount: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 4,
  },

  results: {
    marginTop: 15,
    marginBottom: 30,
  },

  summaryBox: {
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },

  summaryHeader: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },

  summaryTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#facc15",
    textAlign: "center",
  },

  summarySubtitle: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 4,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },

  statItem: {
    alignItems: "center",
  },

  statNumber: {
    fontSize: 28,
    fontWeight: "800",
    color: "#22c55e",
  },

  statLabel: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 4,
  },

  progressSection: {
    marginBottom: 15,
  },

  progressTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#e2e8f0",
    marginBottom: 10,
  },

  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  progressQuestion: {
    width: 35,
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
  },

  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: "#334155",
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: "hidden",
  },

  progressBar: {
    height: "100%",
    borderRadius: 4,
  },

  progressScore: {
    width: 35,
    fontSize: 12,
    fontWeight: "600",
    color: "#e2e8f0",
    textAlign: "right",
  },

  insightBox: {
    backgroundColor: "#0f172a",
    padding: 12,
    borderRadius: 12,
    marginVertical: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#facc15",
  },

  insightText: {
    fontSize: 13,
    color: "#cbd5e1",
    fontStyle: "italic",
  },

  commentsSection: {
    marginTop: 10,
  },

  commentsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#e2e8f0",
    marginBottom: 10,
  },

  commentCard: {
    backgroundColor: "#0f172a",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },

  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  commentRating: {
    fontSize: 12,
    fontWeight: "700",
    color: "#facc15",
  },

  commentDate: {
    fontSize: 10,
    color: "#94a3b8",
  },

  commentText: {
    fontSize: 13,
    color: "#e2e8f0",
    fontStyle: "italic",
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },

  emptyIcon: {
    fontSize: 50,
    marginBottom: 10,
  },

  emptyText: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 16,
    fontWeight: "500",
  },

  emptySubtext: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 12,
    marginTop: 8,
  },
});