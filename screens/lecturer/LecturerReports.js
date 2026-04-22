import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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
      console.log("Error fetching reports:", error);
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
    <View style={styles.container}>
      <Text style={styles.title}>My Submitted Reports</Text>

      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>No reports found</Text>
        }
        renderItem={({ item }) => {
          const createdAt = item.createdAt?.toDate?.();

          return (
            <View style={styles.card}>
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
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#f4f6f8",
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },

  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },

  module: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },

  meta: {
    marginTop: 5,
    fontWeight: "bold",
    color: "#2563eb",
  },

  date: {
    marginTop: 5,
    fontSize: 12,
    color: "gray",
  },

  empty: {
    textAlign: "center",
    marginTop: 20,
    color: "gray",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});