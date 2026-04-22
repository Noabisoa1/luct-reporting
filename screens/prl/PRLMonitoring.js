import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { auth, db } from "../../config/firebase";

export default function PRLMonitoring() {
  const [stats, setStats] = useState({
    courses: 0,
    modules: 0,
    lecturers: 0,
    reports: 0,
  });

  const [lecturers, setLecturers] = useState([]);
  const [modulesList, setModulesList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [recentReports, setRecentReports] = useState([]);

  const [showCourses, setShowCourses] = useState(false);
  const [showModules, setShowModules] = useState(false);
  const [showLecturers, setShowLecturers] = useState(false);
  const [showReports, setShowReports] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const uid = auth.currentUser.uid;

        const userSnap = await getDoc(doc(db, "users", uid));
        const prl = userSnap.data();
        const faculty = prl?.faculty;

        if (!faculty) return;

        const prlQuery = query(
          collection(db, "users"),
          where("role", "==", "prl"),
          where("faculty", "==", faculty)
        );

        const prlSnap = await getDocs(prlQuery);
        const prls = prlSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        const lecQuery = query(
          collection(db, "users"),
          where("role", "==", "lecturer"),
          where("faculty", "==", faculty)
        );

        const lecSnap = await getDocs(lecQuery);
        const allLecturers = lecSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        allLecturers.sort((a, b) =>
          (a.name || "").localeCompare(b.name || "")
        );
        prls.sort((a, b) =>
          (a.name || "").localeCompare(b.name || "")
        );

        const prlIndex = prls.findIndex((p) => p.id === uid);

        const totalPRLs = prls.length || 1;
        const perPRL = Math.ceil(allLecturers.length / totalPRLs);

        const start = prlIndex * perPRL;
        const end = start + perPRL;

        const assignedLecturers = allLecturers.slice(start, end);

        setLecturers(assignedLecturers);

        const lecturerIds = assignedLecturers.map((l) => l.id);

        const modulesQ = query(
          collection(db, "modules"),
          where("lecturerId", "in", lecturerIds)
        );

        const modulesSnap = await getDocs(modulesQ);

        const modules = modulesSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setModulesList(modules);

        const courses = [...new Set(modules.map((m) => m.courseName))];
        setCoursesList(courses);

        const moduleIds = modules.map((m) => m.id);

        let reports = [];

        if (moduleIds.length > 0) {
          const reportsQ = query(
            collection(db, "reports"),
            where("moduleId", "in", moduleIds)
          );

          const reportsSnap = await getDocs(reportsQ);

          reports = reportsSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
        }

        setAllReports(reports);

        const sorted = reports
          .sort(
            (a, b) =>
              (b.createdAt?.seconds || 0) -
              (a.createdAt?.seconds || 0)
          )
          .slice(0, 5);

        setRecentReports(sorted);

        setStats({
          courses: courses.length,
          modules: modules.length,
          lecturers: assignedLecturers.length,
          reports: reports.length,
        });
      } catch (err) {
        console.log(err.message);
      }
    };

    loadData();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>PRL Monitoring Dashboard</Text>

      <View style={styles.grid}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => setShowCourses(!showCourses)}
        >
          <Text style={styles.num}>{stats.courses}</Text>
          <Text style={styles.label}>Courses</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => setShowModules(!showModules)}
        >
          <Text style={styles.num}>{stats.modules}</Text>
          <Text style={styles.label}>Modules</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => setShowLecturers(!showLecturers)}
        >
          <Text style={styles.num}>{stats.lecturers}</Text>
          <Text style={styles.label}>Lecturers</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => setShowReports(!showReports)}
        >
          <Text style={styles.num}>{stats.reports}</Text>
          <Text style={styles.label}>Reports</Text>
        </TouchableOpacity>
      </View>

      {showCourses && (
        <View style={styles.dropdown}>
          {coursesList.map((c, i) => (
            <Text key={i} style={styles.dropdownItem}>
              {c}
            </Text>
          ))}
        </View>
      )}

      {showModules && (
        <View style={styles.dropdown}>
          {modulesList.map((m) => (
            <View key={m.id} style={styles.dropdownItemBox}>
              <Text style={styles.bold}>{m.moduleName}</Text>
              <Text style={styles.meta}>{m.moduleCode}</Text>
              <Text style={styles.meta}>{m.courseName}</Text>
            </View>
          ))}
        </View>
      )}

      {showLecturers && (
        <View style={styles.dropdown}>
          {lecturers.map((l) => (
            <Text key={l.id} style={styles.dropdownItem}>
              {l.name}
            </Text>
          ))}
        </View>
      )}

      {showReports && (
        <View style={styles.dropdown}>
          {allReports.map((r) => (
            <View key={r.id} style={styles.dropdownItemBox}>
              <Text style={styles.bold}>{r.lecturerName}</Text>
              <Text style={styles.meta}>{r.moduleName}</Text>
              <Text style={styles.meta}>Week: {r.week}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.subtitle}>Recent Reports</Text>

      {recentReports.map((r) => (
        <View key={r.id} style={styles.reportCard}>
          <Text style={styles.bold}>{r.lecturerName}</Text>
          <Text style={styles.meta}>
            {r.courseName} - {r.moduleName}
          </Text>
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

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#facc15",
    marginBottom: 12,
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
    borderRadius: 16,
    marginBottom: 10,
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
    color: "#22c55e",
  },

  label: {
    color: "#e2e8f0",
    marginTop: 5,
    fontWeight: "600",
  },

  subtitle: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 15,
    marginBottom: 10,
    color: "#e2e8f0",
  },

  dropdown: {
    backgroundColor: "#1e293b",
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
  },

  dropdownItem: {
    color: "#e2e8f0",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },

  dropdownItemBox: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },

  reportCard: {
    backgroundColor: "#1e293b",
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
  },

  bold: {
    fontWeight: "800",
    color: "#f8fafc",
  },

  meta: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 2,
  },
});