import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";

export default function PLRatings() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRatings();
  }, []);

  const fetchRatings = async () => {
    try {
      const snap = await getDocs(collection(db, "ratings"));

      const all = snap.docs.map((doc) => doc.data());

      const lecturerMap = {};

      all.forEach((r) => {
        const name = r.lecturerName || "Unknown";

        if (!lecturerMap[name]) {
          lecturerMap[name] = { total: 0, count: 0 };
        }

        const values = Object.values(r.ratings || {});
        const avg =
          values.length > 0
            ? values.reduce((a, b) => a + b, 0) / values.length
            : 0;

        lecturerMap[name].total += avg;
        lecturerMap[name].count += 1;
      });

      const result = Object.keys(lecturerMap).map((name) => {
        const obj = lecturerMap[name];
        const average = obj.total / obj.count;

        return {
          name,
          average,
          count: obj.count,
        };
      });

      result.sort((a, b) => b.average - a.average);

      setData(result);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const getPerformance = (score) => {
    if (score >= 4.5) return "Outstanding";
    if (score >= 4) return "Excellent";
    if (score >= 3) return "Good";
    if (score >= 2) return "Average";
    return "Needs Improvement";
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Lecturer Ratings</Text>

      {data.map((item, index) => {
        const widthPercent = (item.average / 5) * 100;

        return (
          <View key={index} style={styles.card}>

            <Text style={styles.name}>
              {index + 1}. {item.name}
            </Text>

            <Text style={styles.meta}>
              Ratings Count: {item.count}
            </Text>

            <View style={styles.barBackground}>
              <View
                style={[
                  styles.barFill,
                  { width: `${widthPercent}%` },
                ]}
              />
            </View>

            <Text style={styles.score}>
              {item.average.toFixed(2)} / 5
            </Text>

            <Text style={styles.performance}>
              {getPerformance(item.average)}
            </Text>

          </View>
        );
      })}
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

  card: {
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },

  name: {
    fontWeight: "700",
    fontSize: 16,
    color: "#e2e8f0",
    marginBottom: 6,
  },

  meta: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 6,
  },

  barBackground: {
    height: 12,
    backgroundColor: "#334155",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 6,
  },

  barFill: {
    height: 12,
    backgroundColor: "#22c55e",
  },

  score: {
    marginTop: 8,
    fontWeight: "700",
    color: "#38bdf8",
  },

  performance: {
    marginTop: 5,
    fontWeight: "700",
    color: "#facc15",
  },
});