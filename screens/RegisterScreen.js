import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
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
import { auth, db } from "../config/firebase";

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // 🔥 NEW

  const [role, setRole] = useState("student");
  const [faculty, setFaculty] = useState("");
  const [semester, setSemester] = useState("");

  const [loading, setLoading] = useState(false);

  const ROLES = ["student", "lecturer", "prl", "pl"];

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "All fields required");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const uid = userCredential.user.uid;

      const userData = {
        uid,
        name: name.trim(),
        email: email.trim(),
        role,
        faculty: faculty.trim(),
        semester: semester.trim(),
        createdAt: serverTimestamp(),
        modules: [],
        registeredModules: [],
      };

      await setDoc(doc(db, "users", uid), userData);

      Alert.alert("Success", "Account created!");
      navigation.replace("Login");

    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        placeholder="Full Name"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        placeholder="Confirm Password"
        secureTextEntry
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TextInput
        placeholder="Faculty"
        style={styles.input}
        value={faculty}
        onChangeText={setFaculty}
      />

      <TextInput
        placeholder="Semester"
        style={styles.input}
        value={semester}
        onChangeText={setSemester}
      />

      <Text style={styles.label}>Role</Text>

      <View style={styles.roleContainer}>
        {ROLES.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.roleBtn, role === r && styles.roleSelected]}
            onPress={() => setRole(r)}
          >
            <Text
              style={[
                styles.roleText,
                role === r && styles.roleTextSelected,
              ]}
            >
              {r.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btn}>Register</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>Already have account? Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flexGrow: 1, backgroundColor: "#f5f7fb" },

  title: { fontSize: 26, fontWeight: "bold", marginBottom: 20 },

  input: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  label: { fontWeight: "bold", marginTop: 10 },

  roleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },

  roleBtn: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#2563eb",
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },

  roleSelected: {
    backgroundColor: "#2563eb",
  },

  roleText: {
    color: "#2563eb",
    fontWeight: "600",
  },

  roleTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },

  button: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },

  btn: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },

  link: {
    marginTop: 15,
    textAlign: "center",
    color: "#2563eb",
    fontWeight: "600",
  },
});