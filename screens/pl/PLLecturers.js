import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
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

      loadModules(selectedCourse.id);

    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Assign Lecturers</Text>

      {/* COURSES */}
      <Text style={styles.subtitle}>Select Course</Text>

      <FlatList
  data={courses}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => {
    const classLabel = item.classYear
      ? `${item.courseName}${item.classYear}`
      : item.courseName;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          selectedCourse?.id === item.id && styles.selected,
        ]}
        onPress={() => {
          setSelectedCourse(item);
          loadModules(item.id);
        }}
      >
        <Text style={{ fontWeight: "bold" }}>
          {classLabel}
        </Text>
      </TouchableOpacity>
    );
  }}
/>

      {selectedCourse && (
        <>
          <Text style={styles.subtitle}>Modules</Text>
          <FlatList
            data={modules}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.card,
                  selectedModule?.id === item.id && styles.selected,
                ]}
                onPress={() => setSelectedModule(item)}
              >
                <Text style={{ fontWeight: "bold" }}>
                  {item.moduleName}
                </Text>
                <Text style={{ fontSize: 12 }}>
                  Code: {item.moduleCode}
                </Text>
                <Text style={{ fontSize: 12 }}>
                  Lecturer: {item.lecturerName || "Not assigned"}
                </Text>
              </TouchableOpacity>
            )}
          />
        </>
      )}
      <Text style={styles.subtitle}>Select Lecturer</Text>
      <FlatList
        data={lecturers}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              selectedLecturer?.id === item.id && styles.selected,
            ]}
            onPress={() => setSelectedLecturer(item)}
          >
            <Text>{item.name}</Text>
            <Text style={{ fontSize: 12 }}>
              Faculty: {item.faculty}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* ASSIGN */}
      <TouchableOpacity style={styles.button} onPress={handleAssign}>
        <Text style={styles.btnText}>Assign Lecturer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#000000" },

  title: { fontSize: 22, color:'#ffd000', fontWeight: "bold", marginBottom: 10 },

  subtitle: { color:'#ffd000', marginTop: 10, fontWeight: "bold" },

  card: {
    padding: 12,
    backgroundColor: "#eee",
    marginBottom: 8,
    borderRadius: 8,
  },

  selected: {
    backgroundColor: "#44fa9f",
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
});