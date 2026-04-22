import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../config/firebase";
import Logout from "../Logout";

export default function StudentDashboard({ navigation }) {
  const [studentData, setStudentData] = useState(null);

  useEffect(() => {
    const fetchStudent = async () => {
      const uid = auth.currentUser.uid;
      const docSnap = await getDoc(doc(db, "users", uid));
      if (docSnap.exists()) setStudentData(docSnap.data());
    };
    fetchStudent();
  }, []);

  if (!studentData) return <Text style={styles.loading}>Loading...</Text>;

  const menu = [
    { title: "Monitoring", screen: "StudentMonitoring" },
    { title: "Ratings", screen: "StudentRating" },

    { title: "Register Modules", screen: "StudentRegisterModules" },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Welcome, {studentData.name}</Text>
        <Logout navigation={navigation} />
      </View>

      <View style={styles.grid}>
        {menu.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={styles.card}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#eef2f7",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 5,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
    flex: 1,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },

  card: {
    width: "48%",
    backgroundColor: "#ffffff",
    paddingVertical: 22,
    paddingHorizontal: 10,
    borderRadius: 14,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    alignItems: "center",
    justifyContent: "center",
  },

  cardTitle: {
    textAlign: "center",
    fontWeight: "600",
    fontSize: 14,
    color: "#1f2937",
  },

  loading: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#6b7280",
  },
});