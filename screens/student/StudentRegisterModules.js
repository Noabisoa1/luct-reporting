import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function StudentRegisterModules({ route }) {
  const user = route?.params?.user;

  const studentId = user?.uid;

  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [registered, setRegistered] = useState([]);

  useEffect(() => {
    if (!studentId) {
      Alert.alert("Error", "User not found. Please login again.");
      return;
    }

    loadCourses();
    loadStudent();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await fetch("http://192.168.156.177:5000/api/courses");
      const data = await res.json();
      setCourses(data);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const loadStudent = async () => {
    try {
      const res = await fetch(
        `http://192.168.156.177:5000/api/users?role=student`
      );

      const users = await res.json();

      const student = users.find((u) => u.id === studentId);

      setRegistered(student?.registeredModules || []);
    } catch (err) {
      console.log(err.message);
    }
  };

  const loadModules = async (courseId) => {
    try {
      const res = await fetch(
        `http://192.168.156.177:5000/api/courses/modules/course/${courseId}`
      );

      const data = await res.json();
      setModules(data);
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
      const res = await fetch(
        "http://192.168.156.177:5000/api/courses/register-modules",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentId,
            courseId: module.courseId,
            modules: [
              {
                moduleId: module.id,
                moduleName: module.moduleName,
              },
            ],
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

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
    <ScrollView style={styles.container}>
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
            <Text style={styles.courseText}>
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
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.name}>
                  {item.moduleName}
                </Text>

                <Text style={styles.meta}>
                  Code: {item.moduleCode}
                </Text>

                <Text style={styles.meta}>
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

  courseCard: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: "#1e293b",
    borderRadius: 16,
    marginRight: 10,
    width: 140,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },

  selected: {
    borderWidth: 2,
    borderColor: "#22c55e",
    backgroundColor: "#1e293b",
  },

  courseText: {
    fontWeight: "700",
    color: "#e2e8f0",
    textAlign: "center",
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

  btn: {
    backgroundColor: "#22c55e",
    padding: 12,
    marginTop: 10,
    borderRadius: 12,
  },

  disabledBtn: {
    backgroundColor: "#475569",
  },

  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
});