import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../config/firebase";

export default function PLCreateCourse() {

  const [courseName, setCourseName] = useState("");
  const [faculty, setFaculty] = useState("");
  const [classYear, setClassYear] = useState("");

  const [modules, setModules] = useState([
    { moduleName: "", moduleCode: "" },
  ]);

  const addModuleField = () => {
    setModules([...modules, { moduleName: "", moduleCode: "" }]);
  };

  const updateModule = (index, field, value) => {
    const updated = [...modules];
    updated[index][field] = value;
    setModules(updated);
  };

  const handleCreate = async () => {
    if (!courseName || !faculty || !classYear) {
      Alert.alert("Error", "Course name, faculty and class required");
      return;
    }

    const validModules = modules.filter(
      (m) => m.moduleName && m.moduleCode
    );

    if (validModules.length === 0) {
      Alert.alert("Error", "At least one valid module required");
      return;
    }

    try {
      const courseCode = `${courseName}${classYear}`;

      const courseRef = await addDoc(collection(db, "courses"), {
        courseName,
        classYear,
        courseCode,
        faculty,
        studentIds: [],
        createdAt: serverTimestamp(),
      });

      for (let mod of validModules) {
        await addDoc(collection(db, "modules"), {
          courseId: courseRef.id,
          courseName,
          courseCode,
          classYear,
          faculty,

          moduleName: mod.moduleName,
          moduleCode: mod.moduleCode,

          lecturerId: null,
          lecturerName: null,

          studentIds: [],
          createdAt: serverTimestamp(),
        });
      }

      Alert.alert("Success", "Course created successfully");

      setCourseName("");
      setFaculty("");
      setClassYear("");
      setModules([{ moduleName: "", moduleCode: "" }]);

    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Course</Text>

      <TextInput
        placeholder="Faculty (e.g FICT)"
        placeholderTextColor="#94a3b8"
        style={styles.input}
        value={faculty}
        onChangeText={setFaculty}
      />

      <TextInput
        placeholder="Course Name (e.g BSCSM)"
        placeholderTextColor="#94a3b8"
        style={styles.input}
        value={courseName}
        onChangeText={setCourseName}
      />

      <TextInput
        placeholder="Class (e.g Y1, Y2, Y3)"
        placeholderTextColor="#94a3b8"
        style={styles.input}
        value={classYear}
        onChangeText={setClassYear}
      />

      {courseName && classYear && (
        <View style={styles.preview}>
          <Text style={styles.previewLabel}>Preview</Text>
          <Text style={styles.previewText}>{courseName + classYear}</Text>
        </View>
      )}

      <Text style={styles.subtitle}>Modules</Text>

      {modules.map((mod, index) => (
        <View key={index} style={styles.moduleBox}>
          <Text style={styles.moduleTitle}>Module {index + 1}</Text>

          <TextInput
            placeholder="Module Name"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            value={mod.moduleName}
            onChangeText={(text) =>
              updateModule(index, "moduleName", text)
            }
          />

          <TextInput
            placeholder="Module Code"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            value={mod.moduleCode}
            onChangeText={(text) =>
              updateModule(index, "moduleCode", text)
            }
          />
        </View>
      ))}

      <TouchableOpacity style={styles.addBtn} onPress={addModuleField}>
        <Text style={styles.btnText}>Add Module</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleCreate}>
        <Text style={styles.btnText}>Create Course</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: "#0f172a",
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#facc15",
    marginBottom: 15,
  },

  subtitle: {
    marginTop: 10,
    fontWeight: "700",
    color: "#e2e8f0",
    marginBottom: 10,
  },

  moduleBox: {
    backgroundColor: "#1e293b",
    padding: 14,
    marginBottom: 12,
    borderRadius: 16,
  },

  moduleTitle: {
    fontWeight: "700",
    marginBottom: 8,
    color: "#e2e8f0",
  },

  input: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    padding: 12,
    marginBottom: 10,
    borderRadius: 12,
    color: "#e2e8f0",
  },

  preview: {
    backgroundColor: "#020617",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },

  previewLabel: {
    color: "#94a3b8",
    fontSize: 12,
  },

  previewText: {
    color: "#facc15",
    fontWeight: "700",
    marginTop: 4,
  },

  addBtn: {
    backgroundColor: "#334155",
    padding: 14,
    borderRadius: 14,
    marginTop: 10,
  },

  button: {
    backgroundColor: "#22c55e",
    padding: 16,
    marginTop: 15,
    borderRadius: 14,
  },

  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
});