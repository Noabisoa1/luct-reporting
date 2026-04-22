import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { auth, db } from "../../config/firebase";

export default function PRLCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const uid = auth.currentUser.uid;

      const userSnap = await getDocs(collection(db, "users"));
      const currentUser = userSnap.docs.find(doc => doc.id === uid)?.data();

      const snap = await getDocs(collection(db, "courses"));

      const filtered = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })).filter(c => c.stream === currentUser.stream);

      setCourses(filtered);
      setLoading(false);
    };

    fetch();
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="green" />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Courses</Text>

      {courses.map((c) => (
        <View key={c.id} style={styles.card}>
          <Text style={styles.name}>{c.courseName}</Text>
          <Text style={styles.text}>Code: {c.courseCode}</Text>
          <Text style={styles.text}>Lecturer: {c.lecturerName}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#f0f4f7" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 15 },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 4,
  },

  name: { fontWeight: "bold", fontSize: 16 },
  text: { color: "#555", marginTop: 4 },
});