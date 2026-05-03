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

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    if (role === "student") {
      if (!faculty) {
        Alert.alert("Error", "Faculty is required for students");
        return;
      }
      if (!semester || parseInt(semester) < 1 || parseInt(semester) > 8) {
        Alert.alert("Error", "Semester must be between 1 and 8");
        return;
      }
    }

    try {
      setLoading(true);

      const response = await fetch("http://10.11.13.251:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          role,
          faculty: role === "student" ? faculty : "",
          semester: role === "student" ? semester : "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      Alert.alert("Success", "Account created successfully!");
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
        placeholderTextColor="#94a3b8"
      />

      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor="#94a3b8"
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholderTextColor="#94a3b8"
      />

      <TextInput
        placeholder="Confirm Password"
        secureTextEntry
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholderTextColor="#94a3b8"
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

      {role === "student" && (
        <>
          <TextInput
            placeholder="Faculty (e.g., Computing, Engineering)"
            style={styles.input}
            value={faculty}
            onChangeText={setFaculty}
            placeholderTextColor="#94a3b8"
          />

          <TextInput
            placeholder="Semester (1-8)"
            style={styles.input}
            value={semester}
            onChangeText={setSemester}
            keyboardType="numeric"
            placeholderTextColor="#94a3b8"
          />
        </>
      )}

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
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
  container: {
    padding: 20,
    flexGrow: 1,
    backgroundColor: "#0f172a",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 20,
    color: "#facc15",
    textAlign: "center",
  },
  input: {
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334155",
    color: "#e2e8f0",
  },
  label: {
    fontWeight: "700",
    marginTop: 10,
    color: "#e2e8f0",
  },
  roleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },
  roleBtn: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: "#1e293b",
  },
  roleSelected: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
  },
  roleText: {
    color: "#e2e8f0",
    fontWeight: "600",
  },
  roleTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  button: {
    backgroundColor: "#22c55e",
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
  },
  btn: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
  },
  link: {
    marginTop: 15,
    textAlign: "center",
    color: "#60a5fa",
    fontWeight: "600",
  },
});