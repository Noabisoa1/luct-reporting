import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Enter email and password");
      return;
    }

    try {
      setLoading(true);

      console.log("Attempting login for:", email);

      const response = await fetch("https://luct-reporting-2-932p.onrender.com/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Store user data and token
      await AsyncStorage.setItem("user", JSON.stringify(data));
      await AsyncStorage.setItem("token", data.token);
      
      console.log("User stored, role:", data.role);

      if (data.role === "student") {
        navigation.replace("StudentDashboard", { user: data });
      } else if (data.role === "lecturer") {
        navigation.replace("LecturerDashboard", { user: data });
      } else if (data.role === "prl") {
        navigation.replace("PRLDashboard", { user: data });
      } else if (data.role === "pl") {
        navigation.replace("PLDashboard", { user: data });
      } else {
        Alert.alert("Error", "Invalid role: " + data.role);
      }

    } catch (error) {
      console.log("Login error:", error.message);
      Alert.alert("Login Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LUCT Reporting System</Text>

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

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={styles.link}>Dont have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#0f172a",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 30,
    textAlign: "center",
    color: "#facc15",
  },
  input: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    padding: 14,
    marginBottom: 12,
    borderRadius: 12,
    color: "#e2e8f0",
  },
  button: {
    backgroundColor: "#22c55e",
    padding: 15,
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
  },
  link: {
    marginTop: 15,
    textAlign: "center",
    color: "#38bdf8",
    fontWeight: "600",
  },
});