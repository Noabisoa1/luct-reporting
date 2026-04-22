import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { auth, db } from "../../config/firebase";

export default function LecturerReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const q = query(
        collection(db, "reports"),
        where("lecturerId", "==", auth.currentUser.uid)
      );

      const snap = await getDocs(q);

      let data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      data.sort((a, b) => {
        const aTime = a.createdAt?.seconds ?? 0;
        const bTime = b.createdAt?.seconds ?? 0;
        return bTime - aTime;
      });

      setReports(data);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="green" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>My Submitted Reports</Text>

      {reports.length === 0 ? (
        <Text style={styles.empty}>No reports found</Text>
      ) : (
        reports.map((item) => {
          const createdAt = item.createdAt?.toDate?.();

          return (
            <View key={item.id} style={styles.card}>
              <Text style={styles.module}>
                {item.moduleName} ({item.moduleCode})
              </Text>

              <Text>Course: {item.courseName}</Text>
              <Text>Week: {item.week}</Text>
              <Text>Topic: {item.topic}</Text>

              <Text style={styles.meta}>
                Present: {item.attendancePresent} / {item.totalStudents}
              </Text>

              <Text style={styles.date}>
                Submitted:{" "}
                {createdAt
                  ? createdAt.toLocaleString()
                  : "Unknown time"}
              </Text>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: "#0f172a",
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#facc15",
    marginBottom: 15,
  },

  card: {
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
  },

  module: {
    fontWeight: "800",
    fontSize: 16,
    marginBottom: 6,
    color: "#e2e8f0",
  },

  meta: {
    marginTop: 6,
    fontWeight: "700",
    color: "#38bdf8",
  },

  date: {
    marginTop: 6,
    fontSize: 12,
    color: "#94a3b8",
  },

  empty: {
    textAlign: "center",
    marginTop: 20,
    color: "#94a3b8",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});