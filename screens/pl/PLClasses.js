import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function PLClasses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setError(null);

        const res = await fetch("http://10.11.13.251:5000/api/courses");

        if (!res.ok) {
          throw new Error("Failed to fetch courses");
        }

        const data = await res.json();

        const list = Array.isArray(data) ? data : [];

        setCourses(list);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: "red", fontWeight: "700" }}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Program Leader Classes</Text>

      <FlatList
        data={courses}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const courseCode =
            item.courseCode ||
            `${item.courseName || ""}${item.classYear || ""}`;

          return (
            <View style={styles.card}>
              <Text style={styles.code}>{courseCode}</Text>

              <Text style={styles.text}>
                <Text style={styles.label}>Course:</Text> {item.courseName || "N/A"}
              </Text>

              <Text style={styles.text}>
                <Text style={styles.label}>Class:</Text> {item.classYear || "N/A"}
              </Text>

              <Text style={styles.text}>
                <Text style={styles.label}>Faculty:</Text> {item.faculty || "N/A"}
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