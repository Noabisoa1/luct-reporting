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
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "../../config/firebase";

export default function StudentRegisterModules() {
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [registered, setRegistered] = useState([]);

  const uid = auth.currentUser.uid;

  useEffect(() => {
    const loadCourses = async () => {
      const snap = await getDocs(collection(db, "courses"));
      setCourses(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    };

    loadCourses();
  }, []);


  useEffect(() => {
    const loadStudent = async () => {
      const userSnap = await getDoc(doc(db, "users", uid));
      const user = userSnap.data();

      setRegistered(user?.registeredModules ?? []);
    };

    loadStudent();
  }, []);

  const loadModules = async (courseId) => {
    try {
      const q = query(
        collection(db, "modules"),
        where("courseId", "==", courseId)
      );

      const snap = await getDocs(q);

      setModules(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const selectCourse = (course) => {
    setSelectedCourse(course);
    loadModules(course.id);
  };

  const registerModule = async (module) => {
    try {
      const userRef = doc(db, "users", uid);
      const moduleRef = doc(db, "modules", module.id);

      await updateDoc(userRef, {
        registeredModules: arrayUnion({
          moduleId: module.id,
          moduleName: module.moduleName,
          courseId: module.courseId,
        }),
      });

      await updateDoc(moduleRef, {
        studentIds: arrayUnion(uid),
      });

      Alert.alert("Success", "Module registered!");

      setRegistered((prev) => [
        ...prev,
        { moduleId: module.id },
      ]);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const isRegistered = (id) =>
    registered.some((m) => m.moduleId === id);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register Modules</Text>
      <Text style={styles.subtitle}>Select Course</Text>

      <FlatList
        data={courses}
        horizontal
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.courseCard,
              selectedCourse?.id === item.id && styles.selected,
            ]}
            onPress={() => selectCourse(item)}
          >
            <Text style={{ fontWeight: "bold" }}>
              {item.courseName}
            </Text>
          </TouchableOpacity>
        )}
      />

      {selectedCourse && (
        <>
          <Text style={styles.subtitle}>Modules</Text>

          <FlatList
            data={modules}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.name}>
                  {item.moduleName}
                </Text>
                <Text>{item.moduleCode}</Text>
                <Text>
                  Lecturer: {item.lecturerName || "Not assigned"}
                </Text>

                <TouchableOpacity
                  disabled={isRegistered(item.id)}
                  onPress={() => registerModule(item)}
                  style={[
                    styles.btn,
                    isRegistered(item.id) && styles.disabledBtn,
                  ]}
                >
                  <Text style={styles.btnText}>
                    {isRegistered(item.id)
                      ? "Registered"
                      : "Register"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#f4f6f8",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },

  subtitle: {
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
  },

  courseCard: {
    padding: 12,
    backgroundColor: "#eee",
    borderRadius: 10,
    marginRight: 10,
  },

  selected: {
    backgroundColor: "#4CAF50",
  },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },

  name: {
    fontWeight: "bold",
    fontSize: 16,
  },

  btn: {
    backgroundColor: "green",
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
  },

  disabledBtn: {
    backgroundColor: "#aaa",
  },

  btnText: {
    color: "#fff",
    textAlign: "center",
  },
});