import {
  collection,
  getDocs,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { db } from "../../config/firebase";

export default function PLMonitoring() {
  const [loading, setLoading] = useState(true);

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
        const coursesSnap = await getDocs(collection(db, "courses"));
        const courseList = coursesSnap.docs.map(d => ({
          id: d.id,
          ...d.data(),
        }));

        const modulesSnap = await getDocs(collection(db, "modules"));
        const moduleList = modulesSnap.docs.map(d => ({
          id: d.id,
          ...d.data(),
        }));

        const lecturersSnap = await getDocs(collection(db, "users"));

        const lecturerList = lecturersSnap.docs
          .map(d => ({
            id: d.id,
            ...d.data(),
          }))
          .filter(u => u.role === "lecturer");

        const reportsSnap = await getDocs(collection(db, "reports"));
        const reportList = reportsSnap.docs.map(d => ({
          id: d.id,
          ...d.data(),
        }));

        setStats({
          courses: courseList.length,
          modules: moduleList.length,
          lecturers: lecturerList.length,
          reports: reportList.length,
        });

        setCourses(courseList);
        setModules(moduleList);
        setLecturers(lecturerList);
        setReports(reportList);

      } catch (error) {
        console.log(error);
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

      <Text style={styles.subtitle}>Classes</Text>

      {courses.map(c => {
        const classLabel = c.classYear
          ? `${c.courseName}${c.classYear}`
          : c.courseName;

        return (
          <View key={c.id} style={styles.listCard}>
            <Text style={styles.bold}>{classLabel}</Text>
          </View>
        );
      })}

      <Text style={styles.subtitle}>Modules</Text>

      {modules.map(m => {
        const classLabel = m.courseName && m.classYear
          ? `${m.courseName}${m.classYear}`
          : m.courseName;

        return (
          <View key={m.id} style={styles.listCard}>
            <Text style={styles.bold}>{m.moduleName}</Text>
            <Text style={styles.meta}>Code: {m.moduleCode}</Text>
            <Text style={styles.meta}>Class: {classLabel || "Not assigned"}</Text>
            <Text style={styles.meta}>Lecturer: {m.lecturerName || "Not assigned"}</Text>
          </View>
        );
      })}

      <Text style={styles.subtitle}>Lecturers</Text>

      {lecturers.map(l => (
        <View key={l.id} style={styles.listCard}>
          <Text style={styles.bold}>{l.name}</Text>
          <Text style={styles.meta}>Faculty: {l.faculty}</Text>
          <Text style={styles.meta}>Stream: {l.stream}</Text>
        </View>
      ))}

      <Text style={styles.subtitle}>Reports</Text>

      {reports.map(r => (
        <View key={r.id} style={styles.listCard}>
          <Text style={styles.bold}>{r.lecturerName}</Text>
          <Text style={styles.meta}>{r.courseName} - {r.moduleName}</Text>
          <Text style={styles.meta}>Week: {r.week}</Text>
          <Text style={styles.meta}>
            Attendance: {r.attendancePresent}/{r.totalStudents}
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
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
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