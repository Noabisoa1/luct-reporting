import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { auth, db } from "../../config/firebase";

export default function LecturerAttendance() {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);

  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModules = async () => {
      const uid = auth.currentUser.uid;

      const userSnap = await getDoc(doc(db, "users", uid));
      const user = userSnap.data();

      const moduleIds = user.modules?.map(m => m.moduleId) || [];

      if (moduleIds.length === 0) {
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "modules"),
        where("__name__", "in", moduleIds)
      );

      const snap = await getDocs(q);

      setModules(snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })));

      setLoading(false);
    };

    fetchModules();
  }, []);

  const loadStudents = async (module) => {
    setSelectedModule(module);

    if (!module.studentIds || module.studentIds.length === 0) {
      setStudents([]);
      return;
    }

    const q = query(
      collection(db, "users"),
      where("__name__", "in", module.studentIds)
    );

    const snap = await getDocs(q);

    const studentList = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(u => u.role === "student");

    setStudents(studentList);

    const initial = {};
    studentList.forEach(s => {
      initial[s.id] = "present"; 
    });

    setAttendance(initial);
  };

  
  const markAttendance = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const submitAttendance = async () => {
    if (!selectedModule) {
      Alert.alert("Error", "Select module");
      return;
    }

    try {
      const presentStudents = Object.entries(attendance)
        .filter(([_, status]) => status === "present")
        .map(([id]) => id);

      await addDoc(collection(db, "attendance"), {
        moduleId: selectedModule.id,
        moduleName: selectedModule.moduleName,

        lecturerId: auth.currentUser.uid,
        lecturerName: auth.currentUser.displayName,

        totalStudents: students.length,
        presentCount: presentStudents.length,

        records: attendance,

        createdAt: serverTimestamp(),
      });

      Alert.alert(
        "Success",
        `Attendance saved\nPresent: ${presentStudents.length}/${students.length}`
      );

    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance</Text>
      <Text style={styles.subtitle}>Select Module</Text>

      <FlatList
        data={modules}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              selectedModule?.id === item.id && styles.selected,
            ]}
            onPress={() => loadStudents(item)}
          >
            <Text style={styles.bold}>{item.moduleName}</Text>
            <Text>{item.moduleCode}</Text>
          </TouchableOpacity>
        )}
      />

      {selectedModule && (
        <>
          <Text style={styles.subtitle}>
            Students ({students.length})
          </Text>

          <FlatList
            data={students}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const status = attendance[item.id];

              return (
                <View style={styles.studentRow}>
                  <Text style={{ flex: 1 }}>{item.name}</Text>

                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      status === "present" && styles.present,
                    ]}
                    onPress={() =>
                      markAttendance(item.id, "present")
                    }
                  >
                    <Text>✔</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      status === "absent" && styles.absent,
                    ]}
                    onPress={() =>
                      markAttendance(item.id, "absent")
                    }
                  >
                    <Text>✖</Text>
                  </TouchableOpacity>
                </View>
              );
            }}
          />

          <TouchableOpacity style={styles.button} onPress={submitAttendance}>
            <Text style={styles.btnText}>Submit Attendance</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#f4f6f8" },

  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },

  subtitle: { marginTop: 10, fontWeight: "bold" },

  card: {
    padding: 12,
    backgroundColor: "#eee",
    marginBottom: 8,
    borderRadius: 8,
  },

  selected: {
    backgroundColor: "#4CAF50",
  },

  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    marginBottom: 5,
    borderRadius: 8,
  },

  checkbox: {
    width: 35,
    height: 35,
    marginLeft: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "#ddd",
  },

  present: {
    backgroundColor: "green",
  },

  absent: {
    backgroundColor: "red",
  },

  button: {
    backgroundColor: "green",
    padding: 14,
    marginTop: 15,
    borderRadius: 8,
  },

  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },

  bold: {
    fontWeight: "bold",
  },
});