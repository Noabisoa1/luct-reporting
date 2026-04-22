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

          // 🔥 generate course code if not stored
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
        setLoading(false);
      } catch (err) {
        console.log(err.message);
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading)
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Program Leader Classes</Text>

      <FlatList
        data={courses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.code}>{item.courseCode}</Text>

            <Text style={styles.text}>
              Course: {item.courseName}
            </Text>

            <Text style={styles.text}>
              Class: {item.classYear}
            </Text>

            <Text style={styles.text}>
              Faculty: {item.faculty}
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
    padding: 15,
    backgroundColor: "#f4f6f8",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 3,
  },

  code: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2563eb",
    marginBottom: 5,
  },

  text: {
    color: "#555",
  },
});