import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View
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
      <Text style={styles.title}>My Learning Progress</Text>

      <Text style={styles.subtitle}>My Modules</Text>

      {modules.map((m) => (
        <View key={m.id} style={styles.card}>
          <Text style={styles.name}>{m.moduleName}</Text>
          <Text>Code: {m.moduleCode}</Text>
          <Text>Lecturer: {m.lecturerName}</Text>
          <Text>Course: {m.courseName}</Text>
        </View>
      ))}

      <Text style={styles.subtitle}>Lecture Reports</Text>

      {reports.map((r) => (
        <View key={r.id} style={styles.reportCard}>
          <Text style={styles.bold}>Module: {r.moduleName}</Text>
          <Text>Topic: {r.topic}</Text>
          <Text>Week: {r.week}</Text>
          <Text>
            Attendance: {r.attendancePresent}/{r.totalStudents}
          </Text>
          <Text>Feedback: {r.prlFeedback || "No feedback yet"}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#f4f6f8",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 10,
  },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },

  reportCard: {
    backgroundColor: "#eef2ff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },

  name: {
    fontWeight: "bold",
    fontSize: 16,
  },

  bold: {
    fontWeight: "bold",
  },
});