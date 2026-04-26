import { Alert, StyleSheet, Text, TouchableOpacity } from "react-native";

export default function Logout({ navigation }) {
  const handleLogout = async () => {
    try {
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });

    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
      <Text style={styles.logoutText}>Logout</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  logoutBtn: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "#ef4444",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});