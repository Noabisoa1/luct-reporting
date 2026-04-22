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

export default function PRLRating() {
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
          values.reduce((a, b) => a + b, 0) / (values.length || 1);

        lecturerMap[name].total += avg;
        lecturerMap[name].count += 1;
      });

      const result = Object.keys(lecturerMap).map((name) => {
        const obj = lecturerMap[name];
        return {
          name,
          average: obj.total / obj.count,
        };
      });

      setData(result);
      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        style={{ flex: 1 }}
        color="#22c55e"
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        Lecturer Performance (PRL View)
      </Text>

      {data.map((item, index) => {
        const widthPercent = (item.average / 5) * 100;

        return (
          <View key={index} style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>

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

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#facc15",
    marginBottom: 15,
  },

  card: {
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },

  name: {
    fontWeight: "800",
    marginBottom: 10,
    color: "#e2e8f0",
    fontSize: 16,
  },

  barBackground: {
    height: 12,
    backgroundColor: "#334155",
    borderRadius: 10,
    overflow: "hidden",
  },

  barFill: {
    height: 12,
    backgroundColor: "#22c55e",
  },

  score: {
    marginTop: 8,
    fontWeight: "700",
    color: "#94a3b8",
  },
});