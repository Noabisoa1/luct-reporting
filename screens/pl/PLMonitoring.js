import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";

export default function PLMonitoring() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({
    courses: 0,
    modules: 0,
    lecturers: 0,
    reports: 0,
    assignedModules: 0,
    unassignedModules: 0,
  });

  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [reports, setReports] = useState([]);
  const [recentReports, setRecentReports] = useState([]);

  const BASE_URL = "http://10.11.13.251:5000";

  const loadData = async () => {
    try {
      setError(null);

      const [coursesRes, modulesRes, lecturersRes, reportsRes] = await Promise.all([
        fetch(`${BASE_URL}/api/courses`),
        fetch(`${BASE_URL}/api/courses/modules`),
        fetch(`${BASE_URL}/api/users?role=lecturer`),
        fetch(`${BASE_URL}/api/reports`),
      ]);

      if (!coursesRes.ok || !modulesRes.ok || !lecturersRes.ok || !reportsRes.ok) {
        throw new Error("Failed to fetch one or more resources");
      }

      const coursesData = await coursesRes.json();
      const modulesData = await modulesRes.json();
      const lecturersData = await lecturersRes.json();
      const reportsData = await reportsRes.json();

      const safeCourses = Array.isArray(coursesData) ? coursesData : [];
      const safeModules = Array.isArray(modulesData) ? modulesData : [];
      const safeLecturers = Array.isArray(lecturersData) ? lecturersData : [];
      const safeReports = Array.isArray(reportsData) ? reportsData : [];

      const assignedModules = safeModules.filter(m => m.lecturerId && m.lecturerId !== "");
      const unassignedModules = safeModules.filter(m => !m.lecturerId || m.lecturerId === "");
      const recentReportsList = [...safeReports].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      ).slice(0, 5);

      setCourses(safeCourses);
      setModules(safeModules);
      setLecturers(safeLecturers);
      setReports(safeReports);
      setRecentReports(recentReportsList);

      setStats({
        courses: safeCourses.length,
        modules: safeModules.length,
        lecturers: safeLecturers.length,
        reports: safeReports.length,
        assignedModules: assignedModules.length,
        unassignedModules: unassignedModules.length,
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const getModuleStatusColor = (module) => {
    if (module.lecturerId && module.lecturerId !== "") return "#22c55e";
    return "#ef4444";
  };

  const getReportStatusColor = (report) => {
    const attendanceRate = (report.attendancePresent / report.totalStudents) * 100;
    if (attendanceRate >= 75) return "#22c55e";
    if (attendanceRate >= 50) return "#facc15";
    return "#ef4444";
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: "#ef4444", fontWeight: "700" }}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#facc15"]} />
      }
    >
      <Text style={styles.title}>PL Monitoring Dashboard</Text>

      {/* STATS GRID */}
      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.num}>{stats.courses}</Text>
          <Text style={styles.label}>Courses</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.num}>{stats.modules}</Text>
          <Text style={styles.label}>Modules</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.num}>{stats.lecturers}</Text>
          <Text style={styles.label}>Lecturers</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.num}>{stats.reports}</Text>
          <Text style={styles.label}>Reports</Text>
        </View>

        <View style={[styles.card, styles.successCard]}>
          <Text style={[styles.num, styles.successText]}>{stats.assignedModules}</Text>
          <Text style={styles.label}>Assigned Modules</Text>
        </View>

        <View style={[styles.card, styles.warningCard]}>
          <Text style={[styles.num, styles.warningText]}>{stats.unassignedModules}</Text>
          <Text style={styles.label}>Unassigned Modules</Text>
        </View>
      </View>

      {/* COURSES SECTION */}
      <Text style={styles.subtitle}>Courses ({stats.courses})</Text>
      {courses.length === 0 ? (
        <Text style={styles.emptyText}>No courses available</Text>
      ) : (
        courses.map((c) => (
          <View key={c.id} style={styles.listCard}>
            <Text style={styles.bold}>{c.courseName} {c.classYear}</Text>
            <Text style={styles.meta}>Faculty: {c.faculty}</Text>
            <Text style={styles.meta}>Code: {c.courseCode}</Text>
            <Text style={styles.meta}>Students: {c.studentIds?.length || 0}</Text>
          </View>
        ))
      )}

      {/* MODULES SECTION */}
      <Text style={styles.subtitle}>Modules ({stats.modules})</Text>
      {modules.length === 0 ? (
        <Text style={styles.emptyText}>No modules available</Text>
      ) : (
        modules.map((m) => (
          <View key={m.id} style={styles.listCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.bold}>{m.moduleName}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getModuleStatusColor(m) }]}>
                <Text style={styles.statusText}>
                  {m.lecturerId ? "Assigned" : "Unassigned"}
                </Text>
              </View>
            </View>
            <Text style={styles.meta}>Code: {m.moduleCode}</Text>
            <Text style={styles.meta}>Course: {m.courseName} {m.classYear}</Text>
            <Text style={styles.meta}>Lecturer: {m.lecturerName || "Not assigned"}</Text>
            <Text style={styles.meta}>Students: {m.studentIds?.length || 0}</Text>
            {m.averageRating > 0 && (
              <Text style={styles.meta}>Rating: ⭐ {m.averageRating} ({m.totalRatings} reviews)</Text>
            )}
          </View>
        ))
      )}

      {/* LECTURERS SECTION */}
      <Text style={styles.subtitle}>Lecturers ({stats.lecturers})</Text>
      {lecturers.length === 0 ? (
        <Text style={styles.emptyText}>No lecturers available</Text>
      ) : (
        lecturers.map((l) => {
          const lecturerModules = modules.filter(m => m.lecturerId === l.id);
          return (
            <View key={l.id} style={styles.listCard}>
              <Text style={styles.bold}>{l.name}</Text>
              <Text style={styles.meta}>Email: {l.email}</Text>
              <Text style={styles.meta}>Faculty: {l.faculty || "N/A"}</Text>
              <Text style={styles.meta}>Modules: {lecturerModules.length}</Text>
            </View>
          );
        })
      )}

      {/* REPORTS SECTION */}
      <Text style={styles.subtitle}>Recent Reports</Text>
      {reports.length === 0 ? (
        <Text style={styles.emptyText}>No reports submitted</Text>
      ) : (
        recentReports.map((r, index) => {
          const attendanceRate = r.totalStudents > 0 
            ? ((r.attendancePresent / r.totalStudents) * 100).toFixed(1) 
            : 0;
          return (
            <View key={r.id || index} style={styles.listCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.bold}>{r.lecturerName || "Unknown"}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getReportStatusColor(r) }]}>
                  <Text style={styles.statusText}>{attendanceRate}%</Text>
                </View>
              </View>
              <Text style={styles.meta}>
                {r.courseName} - {r.moduleName}
              </Text>
              <Text style={styles.meta}>Week: {r.week} | Date: {r.date || "N/A"}</Text>
              <Text style={styles.meta}>
                Attendance: {r.attendancePresent || 0}/{r.totalStudents || 0} students
              </Text>
              {r.content && (
                <Text style={styles.meta} numberOfLines={2}>
                  Content: {r.content}
                </Text>
              )}
            </View>
          );
        })
      )}

      {reports.length > 5 && (
        <TouchableOpacity style={styles.viewAllBtn}>
          <Text style={styles.viewAllText}>View All Reports ({stats.reports})</Text>
        </TouchableOpacity>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#0f172a",
    flexGrow: 1,
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a",
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#facc15",
    marginBottom: 15,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48%",
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    alignItems: "center",
    elevation: 5,
  },

  successCard: {
    backgroundColor: "#064e3b",
  },

  warningCard: {
    backgroundColor: "#451a03",
  },

  num: {
    fontSize: 22,
    fontWeight: "800",
    color: "#38bdf8",
  },

  successText: {
    color: "#22c55e",
  },

  warningText: {
    color: "#facc15",
  },

  label: {
    color: "#cbd5e1",
    marginTop: 4,
  },

  subtitle: {
    fontSize: 18,
    color: "#facc15",
    fontWeight: "700",
    marginTop: 18,
    marginBottom: 10,
  },

  listCard: {
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  bold: {
    fontWeight: "700",
    color: "#e2e8f0",
    marginBottom: 4,
  },

  meta: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 2,
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },

  statusText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },

  emptyText: {
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 10,
  },

  retryBtn: {
    marginTop: 15,
    backgroundColor: "#facc15",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },

  retryText: {
    color: "#0f172a",
    fontWeight: "700",
  },

  viewAllBtn: {
    marginTop: 5,
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#334155",
    borderRadius: 12,
  },

  viewAllText: {
    color: "#facc15",
    textAlign: "center",
    fontWeight: "600",
  },
});