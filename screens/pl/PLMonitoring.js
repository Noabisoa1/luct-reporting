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

        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>PL Monitoring Dashboard</Text>

      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.num}>{stats.courses}</Text>
          <Text>Courses</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.num}>{stats.modules}</Text>
          <Text>Modules</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.num}>{stats.lecturers}</Text>
          <Text>Lecturers</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.num}>{stats.reports}</Text>
          <Text>Reports</Text>
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

      {/* MODULES */}
<Text style={styles.subtitle}>Modules</Text>

{modules.map(m => {
  const classLabel = m.courseName && m.classYear
    ? `${m.courseName}${m.classYear}`
    : m.courseName;

  return (
    <View key={m.id} style={styles.listCard}>
      <Text style={styles.bold}>{m.moduleName}</Text>
      
      <Text>Code: {m.moduleCode}</Text>
      <Text>Class: {classLabel || "Not assigned"}</Text>

      <Text>Lecturer: {m.lecturerName || "Not assigned"}</Text>
    </View>
  );
})}

      <Text style={styles.subtitle}>Lecturers</Text>

      {lecturers.map(l => (
        <View key={l.id} style={styles.listCard}>
          <Text style={styles.bold}>{l.name}</Text>
          <Text>Faculty: {l.faculty}</Text>
          <Text>Stream: {l.stream}</Text>
        </View>
      ))}

      <Text style={styles.subtitle}>Reports</Text>

      {reports.map(r => (
        <View key={r.id} style={styles.listCard}>
          <Text style={styles.bold}>{r.lecturerName}</Text>
          <Text>{r.courseName} - {r.moduleName}</Text>
          <Text>Week: {r.week}</Text>
          <Text>
            Attendance: {r.attendancePresent}/{r.totalStudents}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#000000",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48%",
    backgroundColor: "#cabe17",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
  },

  num: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2563eb",
  },

  subtitle: {
    fontSize: 18,
    color: "#ffd000",
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 10,
  },

  listCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },

  bold: {
    fontWeight: "bold",
  },
});