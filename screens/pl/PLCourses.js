import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function PLCreateCourse() {
  const [courseName, setCourseName] = useState("");
  const [faculty, setFaculty] = useState("");
  const [classYear, setClassYear] = useState("");
  const [modules, setModules] = useState([
    { moduleName: "", moduleCode: "" },
  ]);
  const [loading, setLoading] = useState(false);

  const addModuleField = () => {
    setModules([...modules, { moduleName: "", moduleCode: "" }]);
  };

  const removeModuleField = (index) => {
    if (modules.length === 1) {
      Alert.alert("Error", "At least one module is required");
      return;
    }
    const updated = [...modules];
    updated.splice(index, 1);
    setModules(updated);
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
      (m) => m.moduleName.trim() && m.moduleCode.trim()
    );

    if (validModules.length === 0) {
      Alert.alert("Error", "At least one valid module required");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("https://luct-reporting-2-932p.onrender.com/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseName: courseName.trim(),
          faculty: faculty.trim(),
          classYear: classYear.trim(),
          modules: validModules.map(m => ({
            moduleName: m.moduleName.trim(),
            moduleCode: m.moduleCode.trim(),
          })),
        }),
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message);

      Alert.alert("Success", "Course created successfully");

      setCourseName("");
      setFaculty("");
      setClassYear("");
      setModules([{ moduleName: "", moduleCode: "" }]);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Course</Text>

      <TextInput
        placeholder="Faculty"
        placeholderTextColor="#94a3b8"
        style={styles.input}
        value={faculty}
        onChangeText={setFaculty}
      />

      <TextInput
        placeholder="Course Name"
        placeholderTextColor="#94a3b8"
        style={styles.input}
        value={courseName}
        onChangeText={setCourseName}
      />

      <TextInput
        placeholder="Class (Y1, Y2, Y3, Y4)"
        placeholderTextColor="#94a3b8"
        style={styles.input}
        value={classYear}
        onChangeText={setClassYear}
      />

      <Text style={styles.subtitle}>Modules</Text>

      {modules.map((mod, index) => (
        <View key={index} style={styles.moduleBox}>
          <View style={styles.moduleHeader}>
            <Text style={styles.moduleTitle}>Module {index + 1}</Text>
            <TouchableOpacity onPress={() => removeModuleField(index)}>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            placeholder="Module Name"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            value={mod.moduleName}
            onChangeText={(text) => updateModule(index, "moduleName", text)}
          />

          <TextInput
            placeholder="Module Code"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            value={mod.moduleCode}
            onChangeText={(text) => updateModule(index, "moduleCode", text)}
          />
        </View>
      ))}

      <TouchableOpacity style={styles.addBtn} onPress={addModuleField}>
        <Text style={styles.btnText}>+ Add Module</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleCreate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Create Course</Text>
        )}
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

  moduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  moduleTitle: {
    fontWeight: "700",
    color: "#facc15",
  },

  removeText: {
    color: "#ef4444",
    fontWeight: "600",
  },

  input: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
    padding: 12,
    marginBottom: 10,
    borderRadius: 12,
    color: "#e2e8f0",
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

  buttonDisabled: {
    backgroundColor: "#166534",
  },

  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
});