import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { auth, db } from "../../config/firebase";

export default function PRLClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const uid = auth.currentUser.uid;

        const userSnap = await getDoc(doc(db, "users", uid));
        const prl = userSnap.data();
        const faculty = prl?.faculty;

        if (!faculty) {
          setLoading(false);
          return;
        }

        const prlSnap = await getDocs(
          query(collection(db, "users"), where("role", "==", "prl"))
        );

        const prls = prlSnap.docs.map(d => ({
          id: d.id,
          ...d.data(),
        }));

        const lecSnap = await getDocs(
          query(
            collection(db, "users"),
            where("role", "==", "lecturer"),
            where("faculty", "==", faculty)
          )
        );

        const lecturers = lecSnap.docs.map(d => ({
          id: d.id,
          ...d.data(),
        }));

        lecturers.sort((a, b) =>
          (a.name || "").localeCompare(b.name || "")
        );

        prls.sort((a, b) =>
          (a.name || "").localeCompare(b.name || "")
        );

        const prlIndex = prls.findIndex(p => p.id === uid);
        const perPRL = Math.ceil(lecturers.length / (prls.length || 1));

        const start = prlIndex * perPRL;
        const assignedLecturers = lecturers.slice(start, start + perPRL);

        const lecturerIds = assignedLecturers.map(l => l.id);

        if (lecturerIds.length === 0) {
          setClasses([]);
          setLoading(false);
          return;
        }

        const modulesSnap = await getDocs(collection(db, "modules"));

        const modules = modulesSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(m => lecturerIds.includes(m.lecturerId));

        const classMap = new Map();

        modules.forEach(m => {
          const key = m.className || m.courseName;

          if (!classMap.has(key)) {
            classMap.set(key, {
              className: key,
              courseName: m.courseName,
              lecturerName: m.lecturerName,
              lectureTime: m.lectureTime,
              venue: m.venue,
            });
          }
        });

        setClasses(Array.from(classMap.values()));
        setLoading(false);
      } catch (err) {
        console.log(err.message);
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <ActivityIndicator style={{ flex: 1 }} size="large" color="#22c55e" />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Classes</Text>

      {classes.length === 0 ? (
        <Text style={{ color: "#94a3b8" }}>No classes assigned</Text>
      ) : (
        classes.map((c, i) => (
          <View key={i} style={styles.card}>
            <Text style={styles.name}>{c.className}</Text>
            <Text style={styles.text}>{c.courseName}</Text>
            <Text style={styles.text}>{c.lecturerName}</Text>
            <Text style={styles.text}>{c.lectureTime}</Text>
            <Text style={styles.text}>{c.venue}</Text>
          </View>
        ))
      )}
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
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },

  name: {
    fontSize: 18,
    fontWeight: "800",
    color: "#e2e8f0",
    marginBottom: 6,
  },

  text: {
    color: "#94a3b8",
    marginTop: 4,
    fontSize: 13,
  },
});