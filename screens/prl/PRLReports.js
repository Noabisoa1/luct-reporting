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
        (r) =>
          r.faculty === prl?.faculty || r.stream === prl?.stream
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

      Alert.alert("Success", "Feedback submitted");
      setFeedbackMap({
        ...feedbackMap,
        [id]: "",
      });

    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reports</Text>
      <TextInput
        placeholder="Search course, module or lecturer..."
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

            <Text>Lecturer: {item.lecturerName}</Text>
            <Text>Faculty: {item.faculty}</Text>

            <Text>Week: {item.week}</Text>
            <Text>Date: {item.date}</Text>
            <Text>Venue: {item.venue}</Text>
            <Text>Time: {item.scheduledTime}</Text>

            <Text style={styles.section}>Topic:</Text>
            <Text>{item.topic}</Text>

            <Text style={styles.section}>Learning Outcomes:</Text>
            <Text>{item.learningOutcomes}</Text>

            <Text style={styles.section}>Recommendations:</Text>
            <Text>{item.recommendations}</Text>

            <Text style={styles.attendance}>
              Attendance: {item.attendancePresent} / {item.totalStudents}
            </Text>

            <View style={styles.feedbackBox}>
              <Text style={styles.section}>Feedback:</Text>

              {item.prlFeedback ? (
                <Text style={styles.feedbackText}>
                  {item.prlFeedback}
                </Text>
              ) : (
                <Text style={styles.noFeedback}>
                  No feedback yet
                </Text>
              )}
            </View>

            <TextInput
              placeholder="Write feedback..."
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
    padding: 15,
    backgroundColor: "#f4f6f8",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },

  search: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },

  bold: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },

  section: {
    marginTop: 5,
    fontWeight: "bold",
  },

  attendance: {
    marginTop: 8,
    fontWeight: "bold",
    color: "#2563eb",
  },

  feedbackBox: {
    backgroundColor: "#eef4ff",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },

  feedbackText: {
    color: "#2563eb",
    fontWeight: "500",
  },

  noFeedback: {
    color: "gray",
    fontStyle: "italic",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },

  button: {
    backgroundColor: "green",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },

  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
});