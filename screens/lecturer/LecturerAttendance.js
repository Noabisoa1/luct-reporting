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

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#22c55e" />
    </View>
  );

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
            <Text style={styles.moduleName}>{item.moduleName}</Text>
            <Text style={styles.moduleCode}>{item.moduleCode}</Text>
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
                  <Text style={styles.studentName}>{item.name}</Text>

                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      status === "present" && styles.present,
                    ]}
                    onPress={() => markAttendance(item.id, "present")}
                  >
                    <Text style={styles.icon}>✔</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      status === "absent" && styles.absent,
                    ]}
                    onPress={() => markAttendance(item.id, "absent")}
                  >
                    <Text style={styles.icon}>✖</Text>
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
    marginBottom: 10,
  },

  subtitle: {
    marginTop: 10,
    fontWeight: "700",
    fontSize: 14,
    color: "#94a3b8",
  },

  card: {
    padding: 14,
    backgroundColor: "#1e293b",
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },

  selected: {
    backgroundColor: "#16a34a",
  },

  moduleName: {
    fontWeight: "800",
    color: "#e2e8f0",
    fontSize: 15,
  },

  moduleCode: {
    color: "#94a3b8",
    marginTop: 2,
  },

  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    padding: 12,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },

  studentName: {
    flex: 1,
    color: "#e2e8f0",
    fontWeight: "600",
  },

  checkbox: {
    width: 40,
    height: 40,
    marginLeft: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#334155",
  },

  icon: {
    color: "#fff",
    fontWeight: "900",
  },

  present: {
    backgroundColor: "#16a34a",
  },

  absent: {
    backgroundColor: "#dc2626",
  },

  button: {
    backgroundColor: "#22c55e",
    padding: 15,
    marginTop: 15,
    borderRadius: 14,
  },

  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
  },
});