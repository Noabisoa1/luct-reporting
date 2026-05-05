import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

export default function PLReports() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);

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

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      const res = await fetch(`${BASE_URL}/api/reports`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "failed to load reports");
      }

      let reportsData = Array.isArray(data) ? data : [];
      
      reportsData = reportsData.filter(r => r.prlFeedback && r.prlFeedback.trim() !== "");
      
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
      console.log(`loaded ${reportsData.length} reports with feedback`);
    } catch (error) {
      console.log("fetch reports error:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchUserData();
      await fetchReports();
    };
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReports();
  };

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

  const formatDate = (dateString) => {
    if (!dateString) return "unknown";
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
      <Text style={styles.title}>prl reports & feedback</Text>
      
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

      <Text style={styles.subtitle}>reports with feedback: {filteredReports.length}</Text>

      {filteredReports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>no reports with feedback</Text>
          <Text style={styles.emptySubtext}>reports with prl feedback will appear here</Text>
        </View>
      ) : (
        filteredReports.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.moduleName}>{item.moduleName}</Text>
              <Text style={styles.moduleCode}>{item.moduleCode}</Text>
            </View>

            <Text style={styles.courseName}>
              {item.courseName} ({item.courseCode || "no code"})
            </Text>

            <Text style={styles.lecturerName}>lecturer: {item.lecturerName}</Text>
            <Text style={styles.facultyName}>faculty: {item.faculty || item.lecturerFaculty}</Text>

            <View style={styles.row}>
              <Text style={styles.meta}>week: {item.week}</Text>
              <Text style={styles.meta}>date: {item.date}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.meta}>venue: {item.venue}</Text>
              <Text style={styles.meta}>time: {item.scheduledTime}</Text>
            </View>

            <Text style={styles.sectionTitle}>topic</Text>
            <Text style={styles.text}>{item.topic}</Text>

            <Text style={styles.sectionTitle}>learning outcomes</Text>
            <Text style={styles.text}>{item.learningOutcomes || "not provided"}</Text>

            <Text style={styles.sectionTitle}>recommendations</Text>
            <Text style={styles.text}>{item.recommendations || "not provided"}</Text>

            <View style={styles.attendanceBox}>
              <Text style={styles.attendanceText}>
                attendance: {item.attendancePresent || 0} / {item.totalStudents || 0} students
              </Text>
              <Text style={styles.attendanceRate}>
                rate: {item.attendanceRate || 0}%
              </Text>
            </View>

            <View style={styles.feedbackBox}>
              <Text style={styles.feedbackTitle}>prl feedback</Text>
              <Text style={styles.feedbackText}>{item.prlFeedback}</Text>
            </View>

            <Text style={styles.dateInfo}>
              submitted: {formatDate(item.createdAt)}
            </Text>
          </View>
        ))
      )}

      <View style={styles.footer} />
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
    marginBottom: 8,
  },

  moduleName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#facc15",
    flex: 1,
    textTransform: "lowercase",
  },

  moduleCode: {
    fontSize: 12,
    color: "#94a3b8",
    textTransform: "lowercase",
  },

  courseName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e2e8f0",
    marginBottom: 6,
    textTransform: "lowercase",
  },

  lecturerName: {
    fontSize: 13,
    color: "#cbd5e1",
    marginBottom: 2,
    textTransform: "lowercase",
  },

  facultyName: {
    fontSize: 13,
    color: "#94a3b8",
    marginBottom: 8,
    textTransform: "lowercase",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },

  meta: {
    fontSize: 12,
    color: "#94a3b8",
  },

  sectionTitle: {
    marginTop: 12,
    fontWeight: "700",
    color: "#e2e8f0",
    marginBottom: 4,
    textTransform: "lowercase",
  },

  text: {
    color: "#cbd5e1",
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },

  attendanceBox: {
    backgroundColor: "#0f172a",
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
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
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },

  feedbackTitle: {
    fontWeight: "700",
    color: "#facc15",
    marginBottom: 6,
    textTransform: "lowercase",
  },

  feedbackText: {
    color: "#38bdf8",
    fontSize: 13,
    fontStyle: "italic",
  },

  dateInfo: {
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

  footer: {
    height: 30,
  },
});