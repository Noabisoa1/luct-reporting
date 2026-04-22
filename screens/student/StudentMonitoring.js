import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
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

export default function StudentMonitoring() {
  const [modules, setModules] = useState([]);
  const [reports, setReports] = useState([]);

  const uid = auth.currentUser.uid;

  useEffect(() => {
    const loadData = async () => {
      const userSnap = await getDoc(doc(db, "users", uid));
      const user = userSnap.data();

      const registered = user.registeredModules || [];
      const moduleIds = registered.map((m) => m.moduleId);

      if (moduleIds.length === 0) return;

      const q1 = query(
        collection(db, "modules"),
        where("__name__", "in", moduleIds)
      );

      const modSnap = await getDocs(q1);

      const mods = modSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setModules(mods);

      const q2 = query(collection(db, "reports"));
      const repSnap = await getDocs(q2);

      const allReports = repSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      const filtered = allReports.filter((r) =>
        moduleIds.includes(r.moduleId)
      );

      setReports(filtered);
    };

    loadData();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Student Dashboard</Text>

      <Text style={styles.subtitle}>My Modules</Text>

      {modules.map((m) => (
        <View key={m.id} style={styles.card}>
          <Text style={styles.titleText}>{m.moduleName}</Text>
          <Text style={styles.text}>Code: {m.moduleCode}</Text>
          <Text style={styles.text}>Lecturer: {m.lecturerName}</Text>
          <Text style={styles.text}>Course: {m.courseName}</Text>
        </View>
      ))}

      <Text style={styles.subtitle}>Lecture Reports</Text>

      {reports.map((r) => (
        <View key={r.id} style={styles.reportCard}>
          <Text style={styles.titleText}>Module: {r.moduleName}</Text>
          <Text style={styles.text}>Topic: {r.topic}</Text>
          <Text style={styles.text}>Week: {r.week}</Text>
          <Text style={styles.text}>
            Attendance: {r.attendancePresent}/{r.totalStudents}
          </Text>
          <Text style={styles.feedback}>
            {r.prlFeedback || "No feedback yet"}
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
    backgroundColor: "#0f172a",
  },

  header: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 20,
    color: "#facc15",
    letterSpacing: 1,
  },

  subtitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 10,
    color: "#e2e8f0",
  },

  card: {
    backgroundColor: "#1e293b",
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },

  reportCard: {
    backgroundColor: "#0b1220",
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },

  titleText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: 4,
  },

  text: {
    fontSize: 13,
    color: "#cbd5e1",
    marginBottom: 2,
  },

  feedback: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#38bdf8",
  },
});