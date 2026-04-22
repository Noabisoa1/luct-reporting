import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "../../config/firebase";

export default function PRLReports() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [feedbackMap, setFeedbackMap] = useState({});
  const [filterText, setFilterText] = useState("");

  const user = auth.currentUser;

  useEffect(() => {
    const load = async () => {
      const userSnap = await getDocs(
        query(collection(db, "users"), where("__name__", "==", user.uid))
      );

      const prl = userSnap.docs[0]?.data();

      const snap = await getDocs(collection(db, "reports"));

      let data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      data = data.filter(
        (r) => r.faculty === prl?.faculty || r.stream === prl?.stream
      );

      setReports(data);
      setFilteredReports(data);
    };

    load();
  }, []);

  useEffect(() => {
    if (!filterText) {
      setFilteredReports(reports);
      return;
    }

    const lower = filterText.toLowerCase();

    const filtered = reports.filter(
      (r) =>
        r.courseName?.toLowerCase().includes(lower) ||
        r.moduleName?.toLowerCase().includes(lower) ||
        r.lecturerName?.toLowerCase().includes(lower)
    );

    setFilteredReports(filtered);
  }, [filterText, reports]);

  const handleFeedbackChange = (id, text) => {
    setFeedbackMap({
      ...feedbackMap,
      [id]: text,
    });
  };

  const submitFeedback = async (id) => {
    try {
      const feedback = feedbackMap[id];

      if (!feedback || feedback.trim() === "") {
        Alert.alert("Error", "Write feedback first");
        return;
      }

      await updateDoc(doc(db, "reports", id), {
        prlFeedback: feedback,
      });

      const updatedReports = reports.map((r) =>
        r.id === id ? { ...r, prlFeedback: feedback } : r
      );

      const updatedFiltered = filteredReports.map((r) =>
        r.id === id ? { ...r, prlFeedback: feedback } : r
      );

      setReports(updatedReports);
      setFilteredReports(updatedFiltered);

      setFeedbackMap({
        ...feedbackMap,
        [id]: "",
      });

      Alert.alert("Success", "Feedback submitted");
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reports</Text>

      <TextInput
        placeholder="Search course, module or lecturer..."
        placeholderTextColor="#94a3b8"
        style={styles.search}
        value={filterText}
        onChangeText={setFilterText}
      />

      <FlatList
        data={filteredReports}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.bold}>
              {item.courseName} - {item.moduleName}
            </Text>

            <Text style={styles.meta}>Lecturer: {item.lecturerName}</Text>
            <Text style={styles.meta}>Faculty: {item.faculty}</Text>

            <Text style={styles.meta}>Week: {item.week}</Text>
            <Text style={styles.meta}>Date: {item.date}</Text>
            <Text style={styles.meta}>Venue: {item.venue}</Text>
            <Text style={styles.meta}>Time: {item.scheduledTime}</Text>

            <Text style={styles.section}>Topic</Text>
            <Text style={styles.text}>{item.topic}</Text>

            <Text style={styles.section}>Learning Outcomes</Text>
            <Text style={styles.text}>{item.learningOutcomes}</Text>

            <Text style={styles.section}>Recommendations</Text>
            <Text style={styles.text}>{item.recommendations}</Text>

            <Text style={styles.attendance}>
              Attendance: {item.attendancePresent} / {item.totalStudents}
            </Text>

            <View style={styles.feedbackBox}>
              <Text style={styles.section}>Feedback</Text>

              {item.prlFeedback ? (
                <Text style={styles.feedbackText}>
                  {item.prlFeedback}
                </Text>
              ) : (
                <Text style={styles.noFeedback}>No feedback yet</Text>
              )}
            </View>

            <TextInput
              placeholder="Write feedback..."
              placeholderTextColor="#94a3b8"
              style={styles.input}
              value={feedbackMap[item.id] || ""}
              onChangeText={(text) =>
                handleFeedbackChange(item.id, text)
              }
            />

            <TouchableOpacity
              style={styles.button}
              onPress={() => submitFeedback(item.id)}
            >
              <Text style={styles.btnText}>Submit Feedback</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#0f172a",
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#facc15",
    marginBottom: 12,
  },

  search: {
    backgroundColor: "#1e293b",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    color: "#e2e8f0",
  },

  card: {
    backgroundColor: "#1e293b",
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },

  bold: {
    fontWeight: "800",
    fontSize: 16,
    color: "#e2e8f0",
    marginBottom: 6,
  },

  meta: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 2,
  },

  section: {
    marginTop: 10,
    fontWeight: "700",
    color: "#e2e8f0",
  },

  text: {
    color: "#cbd5f5",
    marginTop: 2,
  },

  attendance: {
    marginTop: 10,
    fontWeight: "700",
    color: "#22c55e",
  },

  feedbackBox: {
    backgroundColor: "#0b1220",
    padding: 10,
    borderRadius: 12,
    marginTop: 10,
  },

  feedbackText: {
    color: "#38bdf8",
    fontWeight: "600",
  },

  noFeedback: {
    color: "#94a3b8",
    fontStyle: "italic",
  },

  input: {
    backgroundColor: "#0b1220",
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
    color: "#e2e8f0",
  },

  button: {
    backgroundColor: "#22c55e",
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
  },

  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
  },
});