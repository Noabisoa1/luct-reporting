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

  // validation function
  const getValidationErrors = () => {
    const errors = [];

    if (!name || name.trim() === "") {
      errors.push("full name is required");
    }

    if (!email || email.trim() === "") {
      errors.push("email is required");
    } else {
      const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
      if (!emailRegex.test(email)) {
        errors.push("invalid email format");
      }
    }

    if (!password) {
      errors.push("password is required");
    } else if (password.length < 6) {
      errors.push("password must be at least 6 characters");
    }

    if (!confirmPassword) {
      errors.push("please confirm your password");
    } else if (password !== confirmPassword) {
      errors.push("passwords do not match");
    }

    if (!role) {
      errors.push("role is required");
    }

    if (!faculty || faculty.trim() === "") {
      errors.push("faculty is required for all roles");
    }

    if (role === "student") {
      if (!semester) {
        errors.push("semester is required for students");
      } else if (parseInt(semester) < 1 || parseInt(semester) > 8) {
        errors.push("semester must be between 1 and 8");
      }
    }

    return errors;
  };

  const isFormValid = () => {
    return getValidationErrors().length === 0;
  };

  const handleRegister = async () => {
    const errors = getValidationErrors();
    
    if (errors.length > 0) {
      Alert.alert("validation error", errors.join("\n• "));
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("https://luct-reporting-2-932p.onrender.com/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
          faculty: faculty.trim(),
          semester: role === "student" ? semester : "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      Alert.alert("success", "account created successfully!");
      navigation.replace("Login");

    } catch (error) {
      console.log("register error:", error.message);
      Alert.alert("error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // check if any field has error for visual feedback
  const hasNameError = name && name.trim() === "";
  const hasEmailError = email && !/^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(email);
  const hasPasswordError = password && password.length < 6;
  const hasConfirmError = confirmPassword && password !== confirmPassword;
  const hasFacultyError = faculty && faculty.trim() === "";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>create account</Text>

      <TextInput
        placeholder="full name"
        style={[styles.input, hasNameError && styles.inputError]}
        value={name}
        onChangeText={setName}
        placeholderTextColor="#94a3b8"
      />

      <TextInput
        placeholder="email"
        style={[styles.input, hasEmailError && styles.inputError]}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor="#94a3b8"
      />

      <TextInput
        placeholder="password"
        secureTextEntry
        style={[styles.input, hasPasswordError && styles.inputError]}
        value={password}
        onChangeText={setPassword}
        placeholderTextColor="#94a3b8"
      />

      <TextInput
        placeholder="confirm password"
        secureTextEntry
        style={[styles.input, hasConfirmError && styles.inputError]}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholderTextColor="#94a3b8"
      />

      <Text style={styles.label}>role</Text>

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

      <TextInput
        placeholder="faculty (e.g., fict, feng, fabs)"
        style={[styles.input, hasFacultyError && styles.inputError]}
        value={faculty}
        onChangeText={setFaculty}
        placeholderTextColor="#94a3b8"
      />

      {role === "student" && (
        <TextInput
          placeholder="semester (1-8)"
          style={styles.input}
          value={semester}
          onChangeText={setSemester}
          keyboardType="numeric"
          placeholderTextColor="#94a3b8"
        />
      )}

      <TouchableOpacity 
        style={[styles.button, (!isFormValid() || loading) && styles.buttonDisabled]} 
        onPress={handleRegister}
        disabled={!isFormValid() || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btn}>register</Text>
        )}
      </TouchableOpacity>

      {!isFormValid() && !loading && (
        <Text style={styles.warningText}>
          ⚠ please fill all required fields correctly
        </Text>
      )}

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>already have account? login</Text>
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
    textTransform: "lowercase",
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
  inputError: {
    borderColor: "#ef4444",
    borderWidth: 2,
  },
  label: {
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 5,
    color: "#e2e8f0",
    textTransform: "lowercase",
  },
  roleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15,
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
  buttonDisabled: {
    backgroundColor: "#475569",
    opacity: 0.6,
  },
  btn: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
    textTransform: "lowercase",
  },
  link: {
    marginTop: 15,
    textAlign: "center",
    color: "#60a5fa",
    fontWeight: "600",
    textTransform: "lowercase",
  },
  warningText: {
    marginTop: 10,
    textAlign: "center",
    color: "#facc15",
    fontSize: 12,
    textTransform: "lowercase",
  },
});