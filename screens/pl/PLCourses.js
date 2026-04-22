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

      // CREATE COURSE
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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create Course</Text>

      <TextInput
        placeholder="Faculty (e.g FICT)"
        style={styles.input}
        value={faculty}
        onChangeText={setFaculty}
      />

      <TextInput
        placeholder="Course Name (e.g BSCSM)"
        style={styles.input}
        value={courseName}
        onChangeText={setCourseName}
      />

      <TextInput
        placeholder="Class (e.g Y1, Y2, Y3)"
        style={styles.input}
        value={classYear}
        onChangeText={setClassYear}
      />

      {courseName && classYear && (
        <View style={styles.preview}>
          <Text style={{ fontWeight: "bold" }}>Preview:</Text>
          <Text>{courseName + classYear}</Text>
        </View>
      )}

      <Text style={styles.subtitle}>Modules</Text>

      {modules.map((mod, index) => (
        <View key={index} style={styles.moduleBox}>
          <Text style={styles.moduleTitle}>
            Module {index + 1}
          </Text>

          <TextInput
            placeholder="Module Name"
            style={styles.input}
            value={mod.moduleName}
            onChangeText={(text) =>
              updateModule(index, "moduleName", text)
            }
          />

          <TextInput
            placeholder="Module Code"
            style={styles.input}
            value={mod.moduleCode}
            onChangeText={(text) =>
              updateModule(index, "moduleCode", text)
            }
          />
        </View>
      ))}

      <TouchableOpacity style={styles.addBtn} onPress={addModuleField}>
        <Text style={styles.btnText}>Add Another Module</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleCreate}>
        <Text style={styles.btnText}>Create Course</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#000000" },

  title: { fontSize: 22, color:'#fad608', fontWeight: "bold", marginBottom: 10 },

  subtitle: { marginTop: 10, fontWeight: "bold", color: '#fad608', },

  moduleBox: {
    backgroundColor: "#fff",
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },

  moduleTitle: {
    fontWeight: "bold",
    marginBottom: 5,
  },

  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
  },

  preview: {
    backgroundColor: "#e0f2fe",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

  addBtn: {
    backgroundColor: "#3498db",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
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