import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { auth, db } from "../../config/firebase";

export default function LecturerClasses() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const uid = auth.currentUser.uid;

        const userSnap = await getDoc(doc(db, "users", uid));
        const user = userSnap.data();
        setUserData(user);

        const moduleRefs = user?.modules || [];

        if (moduleRefs.length === 0) {
          setModules([]);
          setLoading(false);
          return;
        }

        const moduleIds = moduleRefs.map(m => m.moduleId);

        const chunks = [];
        for (let i = 0; i < moduleIds.length; i += 10) {
          chunks.push(moduleIds.slice(i, i + 10));
        }

        let allModules = [];

        for (let chunk of chunks) {
          const q = query(
            collection(db, "modules"),
            where("__name__", "in", chunk)
          );

          const snap = await getDocs(q);

          allModules = [
            ...allModules,
            ...snap.docs.map(d => ({
              id: d.id,
              ...d.data(),
            })),
          ];
        }

        setModules(allModules);
        setLoading(false);

      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Classes</Text>

      {userData && (
        <View style={styles.profileCard}>
          <Text style={styles.profileName}>{userData.name}</Text>
          <Text style={styles.profileText}>Faculty: {userData.faculty}</Text>
          <Text style={styles.profileText}>Stream: {userData.stream}</Text>
        </View>
      )}

      <FlatList
        data={modules}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.moduleName}>{item.moduleName}</Text>
              <Text style={[
                styles.badge,
                { backgroundColor: item.lecturerId ? "#16a34a" : "#ef4444" }
              ]}>
                {item.lecturerId ? "Assigned" : "Unassigned"}
              </Text>
            </View>

            <Text style={styles.text}>Code: {item.moduleCode}</Text>
            <Text style={styles.text}>Course: {item.courseName}</Text>

            <Text style={styles.meta}>
              Students Enrolled: {item.studentIds?.length || 0}
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

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a",
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#facc15",
    marginBottom: 12,
  },

  profileCard: {
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
  },

  profileName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#e2e8f0",
    marginBottom: 4,
  },

  profileText: {
    color: "#94a3b8",
    fontSize: 13,
  },

  card: {
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },

  moduleName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#e2e8f0",
    flex: 1,
    paddingRight: 10,
  },

  badge: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: "hidden",
  },

  text: {
    color: "#cbd5e1",
    fontSize: 13,
    marginTop: 2,
  },

  meta: {
    marginTop: 8,
    fontWeight: "700",
    color: "#38bdf8",
    fontSize: 12,
  },
});