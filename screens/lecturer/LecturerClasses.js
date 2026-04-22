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
        <ActivityIndicator size="large" color="green" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Classes</Text>

      {userData && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Name: {userData.name}</Text>
          <Text style={styles.infoText}>Faculty: {userData.faculty}</Text>
          <Text style={styles.infoText}>Stream: {userData.stream}</Text>
        </View>
      )}

      <FlatList
        data={modules}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.moduleName}</Text>

            <Text>Code: {item.moduleCode}</Text>
            <Text>Course: {item.courseName}</Text>

            <Text>
              Students: {item.studentIds?.length || 0}
            </Text>

            <Text style={styles.status}>
              {item.lecturerId
                ? "Assigned"
                : "Not Assigned"}
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

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },

  infoBox: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "green",
  },

  infoText: {
    fontSize: 13,
    color: "#333",
  },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },

  name: {
    fontSize: 16,
    fontWeight: "bold",
  },

  status: {
    marginTop: 5,
    fontWeight: "bold",
    color: "#2563eb",
  },
});