import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";

export default function PLClasses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const snap = await getDocs(collection(db, "courses"));

        const list = snap.docs.map((doc) => {
          const data = doc.data();

          const courseCode =
            data.courseCode ||
            `${data.courseName || ""}${data.classYear || ""}`;

          return {
            id: doc.id,
            ...data,
            courseCode,
          };
        });

        setCourses(list);
      } catch (err) {
        console.log(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Program Leader Classes</Text>

      <FlatList
        data={courses}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.code}>{item.courseCode}</Text>

            <Text style={styles.text}>
              <Text style={styles.label}>Course:</Text> {item.courseName}
            </Text>

            <Text style={styles.text}>
              <Text style={styles.label}>Class:</Text> {item.classYear}
            </Text>

            <Text style={styles.text}>
              <Text style={styles.label}>Faculty:</Text> {item.faculty}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#0f172a",
  },

  loadingContainer: {
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
    elevation: 6,
  },

  code: {
    fontSize: 18,
    fontWeight: "800",
    color: "#38bdf8",
    marginBottom: 8,
  },

  text: {
    color: "#cbd5e1",
    marginBottom: 4,
    fontSize: 13,
  },

  label: {
    fontWeight: "700",
    color: "#e2e8f0",
  },
});