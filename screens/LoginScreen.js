import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
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
import { auth, db } from "../config/firebase";

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

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const uid = userCredential.user.uid;

      const userDoc = await getDoc(doc(db, "users", uid));

      if (!userDoc.exists()) {
        Alert.alert("Error", "User not found");
        return;
      }

      const role = userDoc.data()?.role;

      if (role === "student") {
        navigation.replace("StudentDashboard");
      } else if (role === "lecturer") {
        navigation.replace("LecturerDashboard");
      } else if (role === "prl") {
        navigation.replace("PRLDashboard");
      } else if (role === "pl") {
        navigation.replace("PLDashboard");
      } else {
        Alert.alert("Error", "Invalid role");
      }
    } catch (error) {
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
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={styles.link}>Do not have an account? Register</Text>
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