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
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(r => r.lecturerId === uid);

      const myRatings = ratingSnap.docs
        .map(d => d.data())
        .filter(r => r.lecturerId === uid);

     
      const reportCount = myReports.length;

      let attendanceTotal = 0;

      myReports.forEach(r => {
        const rate =
          (r.attendancePresent || 0) /
          (r.totalStudents || 1);

        attendanceTotal += rate;
      });

      const avgAttendance =
        reportCount > 0 ? attendanceTotal / reportCount : 0;
      let totalRating = 0;
      let ratingCount = 0;

      myRatings.forEach(r => {
        const values = Object.values(r.ratings || {});

        values.forEach(v => {
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
    if (status === "Good") return "#16a34a";
    if (status === "Warning") return "#f59e0b";
    return "#dc2626";
  };

  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  if (!data) {
    return (
      <View style={styles.container}>
        <Text>No data found</Text>
      </View>
    );
  }

  const status = getStatus(data.avgRating, data.avgAttendance);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Lecturer Monitoring</Text>

      <View style={styles.card}>
        <Text style={styles.name}>{data.name}</Text>

        <Text style={styles.metric}>
          Reports Submitted: {data.reportCount}
        </Text>

        <Text style={styles.metric}>
          Average Attendance: {(data.avgAttendance * 100).toFixed(1)}%
        </Text>

        <Text style={styles.metric}>
          Average Student Rating: {data.avgRating.toFixed(2)} / 5
        </Text>

        <Text
          style={[
            styles.status,
            { color: getColor(status) },
          ]}
        >
          Status: {status}
        </Text>
      </View>
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
    marginBottom: 15,
  },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
  },

  name: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  metric: {
    marginBottom: 6,
    fontSize: 14,
  },

  status: {
    marginTop: 10,
    fontWeight: "bold",
    fontSize: 16,
  },
});