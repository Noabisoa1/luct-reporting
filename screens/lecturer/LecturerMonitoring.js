import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "../../config/firebase";

export default function LecturerMonitoring() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const uid = auth.currentUser.uid;

  useEffect(() => {
    fetchMyStats();
  }, []);

  const fetchMyStats = async () => {
    try {
      const reportSnap = await getDocs(collection(db, "reports"));
      const ratingSnap = await getDocs(collection(db, "ratings"));

      const myReports = reportSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((r) => r.lecturerId === uid);

      const myRatings = ratingSnap.docs
        .map((d) => d.data())
        .filter((r) => r.lecturerId === uid);

      const reportCount = myReports.length;

      let attendanceTotal = 0;

      myReports.forEach((r) => {
        const rate =
          (r.attendancePresent || 0) /
          (r.totalStudents || 1);

        attendanceTotal += rate;
      });

      const avgAttendance =
        reportCount > 0 ? attendanceTotal / reportCount : 0;

      let totalRating = 0;
      let ratingCount = 0;

      myRatings.forEach((r) => {
        const values = Object.values(r.ratings || {});
        values.forEach((v) => {
          totalRating += v;
          ratingCount += 1;
        });
      });

      const avgRating =
        ratingCount > 0 ? totalRating / ratingCount : 0;

      setData({
        name: auth.currentUser.displayName || "Lecturer",
        reportCount,
        avgAttendance,
        avgRating,
      });

      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  const getStatus = (rating, attendance) => {
    if (rating >= 4 && attendance >= 0.75) return "Good";
    if (rating >= 3 && attendance >= 0.5) return "Warning";
    return "Critical";
  };

  const getColor = (status) => {
    if (status === "Good") return "#22c55e";
    if (status === "Warning") return "#facc15";
    return "#ef4444";
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No data found</Text>
      </View>
    );
  }

  const status = getStatus(data.avgRating, data.avgAttendance);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Lecturer Monitoring</Text>

      <View style={styles.card}>
        <Text style={styles.name}>{data.name}</Text>

        <View style={styles.metricBox}>
          <Text style={styles.label}>Reports Submitted</Text>
          <Text style={styles.value}>{data.reportCount}</Text>
        </View>

        <View style={styles.metricBox}>
          <Text style={styles.label}>Average Attendance</Text>
          <Text style={styles.value}>
            {(data.avgAttendance * 100).toFixed(1)}%
          </Text>
        </View>

        <View style={styles.metricBox}>
          <Text style={styles.label}>Average Rating</Text>
          <Text style={styles.value}>
            {data.avgRating.toFixed(2)} / 5
          </Text>
        </View>

        <View
          style={[
            styles.statusBox,
            { borderColor: getColor(status) },
          ]}
        >
          <Text style={[styles.statusText, { color: getColor(status) }]}>
            {status}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 15,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#facc15",
    marginBottom: 15,
  },

  card: {
    backgroundColor: "#1e293b",
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },

  name: {
    fontSize: 20,
    fontWeight: "800",
    color: "#f1f5f9",
    marginBottom: 15,
  },

  metricBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },

  label: {
    color: "#94a3b8",
  },

  value: {
    color: "#e2e8f0",
    fontWeight: "700",
  },

  statusBox: {
    marginTop: 15,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
  },

  statusText: {
    fontSize: 18,
    fontWeight: "800",
  },

  empty: {
    color: "#94a3b8",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});