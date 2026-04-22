import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { auth, db } from "../../config/firebase";

export default function PRLClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      const uid = auth.currentUser.uid;

      const userSnap = await getDocs(collection(db, "users"));
      const currentUser = userSnap.docs.find(doc => doc.id === uid)?.data();

      const reportSnap = await getDocs(collection(db, "lecturerReports"));

      const map = new Map();

      reportSnap.docs.forEach(doc => {
        const d = doc.data();

        if (d.stream === currentUser.stream && !map.has(d.className)) {
          map.set(d.className, d);
        }
      });

      setClasses(Array.from(map.values()));
      setLoading(false);
    };

    fetchClasses();
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="green" />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Classes</Text>

      {classes.map((c, i) => (
        <View key={i} style={styles.card}>
          <Text style={styles.name}>{c.className}</Text>
          <Text style={styles.text}>{c.courseName}</Text>
          <Text style={styles.text}>{c.lecturerName}</Text>
          <Text style={styles.text}>{c.lectureTime}</Text>
          <Text style={styles.text}> {c.venue}</Text>
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

  name: { fontSize: 18, fontWeight: "bold" },
  text: { color: "#555", marginTop: 4 },
});