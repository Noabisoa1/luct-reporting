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
} from "firebase/firestore";

import { auth, db } from "../../config/firebase";

export default function StudentAttendance() {
  const [modules, setModules] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  const uid = auth.currentUser.uid;

  useEffect(() => {
    const loadData = async () => {
      try {
        const userSnap = await getDoc(doc(db, "users", uid));
        const user = userSnap.data();

        const registered = user?.registeredModules || [];
        const moduleIds = registered.map((m) => m.moduleId);

        if (moduleIds.length === 0) {
          setLoading(false);
          return;
        }

        const modSnap = await getDocs(collection(db, "modules"));

        const myModules = modSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((m) => moduleIds.includes(m.id));

        setModules(myModules);

        const attSnap = await getDocs(collection(db, "attendance"));

        const myAttendance = attSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((a) => moduleIds.includes(a.moduleId))
          .map((a) => ({
            id: a.id,
            moduleName: a.moduleName,
            status: a.records?.[uid] || "not marked",
            presentCount: a.presentCount,
            totalStudents: a.totalStudents,
          }));

        setAttendance(myAttendance);

        setLoading(false);
      } catch (err) {
        console.log(err);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <ActivityIndicator style={{ flex: 1 }} size="large" color="#22c55e" />
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>My Attendance</Text>

      <Text style={styles.subtitle}>My Modules</Text>

      {modules.map((m) => (
        <View key={m.id} style={styles.card}>
          <Text style={styles.name}>{m.moduleName}</Text>
          <Text style={styles.meta}>Code: {m.moduleCode}</Text>
          <Text style={styles.meta}>
            Lecturer: {m.lecturerName || "Not assigned"}
          </Text>
        </View>
      ))}

      <Text style={styles.subtitle}>Attendance Records</Text>

      {attendance.length === 0 ? (
        <Text style={styles.empty}>No attendance yet</Text>
      ) : (
        attendance.map((a) => (
          <View key={a.id} style={styles.attCard}>
            <Text style={styles.name}>{a.moduleName}</Text>

            <Text style={styles.meta}>
              Your Status:{" "}
              <Text
                style={{
                  color:
                    a.status === "present"
                      ? "#22c55e"
                      : a.status === "absent"
                      ? "#ef4444"
                      : "#94a3b8",
                  fontWeight: "700",
                }}
              >
                {a.status}
              </Text>
            </Text>

            <Text style={styles.meta}>
              Class Attendance: {a.presentCount}/{a.totalStudents}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#0f172a",
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#facc15",
    marginBottom: 12,
  },

  subtitle: {
    marginTop: 15,
    marginBottom: 10,
    fontWeight: "700",
    color: "#e2e8f0",
  },

  card: {
    backgroundColor: "#1e293b",
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },

  attCard: {
    backgroundColor: "#0b1220",
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#22c55e",
  },

  name: {
    fontWeight: "700",
    fontSize: 16,
    color: "#e2e8f0",
  },

  meta: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
  },

  empty: {
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 20,
  },
});