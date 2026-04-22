import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../../config/firebase";

export default function PLAssignLecturers() {
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [lecturers, setLecturers] = useState([]);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedLecturer, setSelectedLecturer] = useState(null);

  const fetchCourses = async () => {
    const snap = await getDocs(collection(db, "courses"));
    setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const fetchLecturers = async () => {
    const q = query(
      collection(db, "users"),
      where("role", "==", "lecturer")
    );

    const snap = await getDocs(q);
    setLecturers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchCourses();
    fetchLecturers();
  }, []);

  const loadModules = async (courseId) => {
    const q = query(
      collection(db, "modules"),
      where("courseId", "==", courseId)
    );

    const snap = await getDocs(q);
    setModules(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const handleAssign = async () => {
    if (!selectedModule || !selectedLecturer) {
      Alert.alert("Error", "Select module and lecturer");
      return;
    }

    try {
      await updateDoc(doc(db, "modules", selectedModule.id), {
        lecturerId: selectedLecturer.id,
        lecturerName: selectedLecturer.name,
        lecturerFaculty: selectedLecturer.faculty,
      });

      await updateDoc(doc(db, "users", selectedLecturer.id), {
        modules: arrayUnion({
          moduleId: selectedModule.id,
          moduleName: selectedModule.moduleName,
          courseId: selectedModule.courseId,
        }),
      });

      Alert.alert("Success", "Lecturer assigned");

      setSelectedModule(null);
      setSelectedLecturer(null);

      if (selectedCourse?.id) {
        loadModules(selectedCourse.id);
      }

    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>

      <Text style={styles.title}>Assign Lecturers</Text>

      <Text style={styles.subtitle}>Select Course</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {courses.map((item) => {
            const classLabel = item.classYear
              ? `${item.courseName}${item.classYear}`
              : item.courseName;

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.card,
                  selectedCourse?.id === item.id && styles.selected,
                ]}
                onPress={() => {
                  setSelectedCourse(item);
                  loadModules(item.id);
                }}
              >
                <Text style={styles.cardTitle}>{classLabel}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {selectedCourse && (
        <>
          <Text style={styles.subtitle}>Modules</Text>

          {modules.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.card,
                selectedModule?.id === item.id && styles.selected,
              ]}
              onPress={() => setSelectedModule(item)}
            >
              <Text style={styles.cardTitle}>{item.moduleName}</Text>
              <Text style={styles.meta}>Code: {item.moduleCode}</Text>
              <Text style={styles.meta}>
                Lecturer: {item.lecturerName || "Not assigned"}
              </Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      <Text style={styles.subtitle}>Lecturers</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {lecturers.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.card,
                selectedLecturer?.id === item.id && styles.selected,
              ]}
              onPress={() => setSelectedLecturer(item)}
            >
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.meta}>{item.faculty}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.button} onPress={handleAssign}>
        <Text style={styles.btnText}>Assign Lecturer</Text>
      </TouchableOpacity>

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
    marginBottom: 12,
  },

  subtitle: {
    marginTop: 15,
    marginBottom: 10,
    fontWeight: "700",
    color: "#e2e8f0",
  },

  row: {
    flexDirection: "row",
    gap: 10,
  },

  card: {
    padding: 14,
    backgroundColor: "#1e293b",
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 16,
    minWidth: 140,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },

  selected: {
    borderWidth: 2,
    borderColor: "#22c55e",
  },

  cardTitle: {
    fontWeight: "700",
    color: "#e2e8f0",
    fontSize: 14,
  },

  meta: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
  },

  button: {
    backgroundColor: "#22c55e",
    padding: 16,
    marginTop: 20,
    borderRadius: 14,
  },

  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
});