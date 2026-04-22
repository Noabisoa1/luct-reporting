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
          values.reduce((a, b) => a + b, 0) / values.length;

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
    return <ActivityIndicator size="large" />;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        Lecturer Performance (PRL View)
      </Text>

      {data.map((item, index) => {
        const widthPercent = (item.average / 5) * 100;

        return (
          <View key={index} style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>

            {/* BAR */}
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
    flex: 1,
    padding: 15,
    backgroundColor: "#f4f6f8",
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },

  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },

  name: {
    fontWeight: "bold",
    marginBottom: 6,
  },

  barBackground: {
    height: 12,
    backgroundColor: "#ddd",
    borderRadius: 10,
    overflow: "hidden",
  },

  barFill: {
    height: 12,
    backgroundColor: "#4CAF50",
  },

  score: {
    marginTop: 6,
    fontWeight: "bold",
  },
});