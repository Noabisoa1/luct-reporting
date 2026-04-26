import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function PLMonitoring() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({
    courses: 0,
    modules: 0,
    lecturers: 0,
    reports: 0,
  });

  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);

       const [coursesRes, modulesRes, lecturersRes, reportsRes] =
       await Promise.all([
  fetch("http://192.168.156.177:5000/api/courses"),
  fetch("http://192.168.156.177:5000/api/courses/modules"), // ✅ works now
  fetch("http://192.168.156.177:5000/api/users?role=lecturer"),
  fetch("http://192.168.156.177:5000/api/reports"),
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

        setCourses(safeCourses);
        setModules(safeModules);
        setLecturers(safeLecturers);
        setReports(safeReports);

        setStats({
          courses: safeCourses.length,
          modules: safeModules.length,
          lecturers: safeLecturers.length,
          reports: safeReports.length,
        });

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
        <Text style={{ color: "red", fontWeight: "700" }}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>

      <Text style={styles.title}>PL Monitoring Dashboard</Text>

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
      </View>

      <Text style={styles.subtitle}>Courses</Text>

      {courses.map((c) => {
        const classLabel = c.classYear
          ? `${c.courseName}${c.classYear}`
          : c.courseName;

        return (
          <View key={c.id || Math.random()} style={styles.listCard}>
            <Text style={styles.bold}>{classLabel}</Text>
          </View>
        );
      })}

      <Text style={styles.subtitle}>Modules</Text>

      {modules.map((m) => {
        const classLabel = m.courseName && m.classYear
          ? `${m.courseName}${m.classYear}`
          : m.courseName;

        return (
          <View key={m.id || Math.random()} style={styles.listCard}>
            <Text style={styles.bold}>{m.moduleName || "No name"}</Text>
            <Text style={styles.meta}>
              Code: {m.moduleCode || "N/A"}
            </Text>
            <Text style={styles.meta}>
              Class: {classLabel || "Not assigned"}
            </Text>
            <Text style={styles.meta}>
              Lecturer: {m.lecturerName || "Not assigned"}
            </Text>
          </View>
        );
      })}

      <Text style={styles.subtitle}>Lecturers</Text>

      {lecturers.map((l) => (
        <View key={l.id || Math.random()} style={styles.listCard}>
          <Text style={styles.bold}>{l.name || "Unknown"}</Text>
          <Text style={styles.meta}>Faculty: {l.faculty || "N/A"}</Text>
          <Text style={styles.meta}>Role: {l.role || "N/A"}</Text>
        </View>
      ))}

      <Text style={styles.subtitle}>Reports</Text>

      {reports.map((r) => (
        <View key={r.id || Math.random()} style={styles.listCard}>
          <Text style={styles.bold}>{r.lecturerName || "Unknown"}</Text>
          <Text style={styles.meta}>
            {r.courseName || "Course"} - {r.moduleName || "Module"}
          </Text>
          <Text style={styles.meta}>
            Week: {r.week || "N/A"}
          </Text>
          <Text style={styles.meta}>
            Attendance: {r.attendancePresent || 0}/{r.totalStudents || 0}
          </Text>
        </View>
      ))}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#0f172a",
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

  num: {
    fontSize: 22,
    fontWeight: "800",
    color: "#38bdf8",
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

  bold: {
    fontWeight: "700",
    color: "#e2e8f0",
    marginBottom: 4,
  },

  meta: {
    color: "#94a3b8",
    fontSize: 13,
  },
});