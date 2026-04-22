import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";

export default function PLReports() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, "reports"));

      let data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      data = data.filter((r) => r.prlFeedback);

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Program Leader Reports</Text>

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
              <Text style={styles.section}>PRL Feedback:</Text>
              <Text style={styles.feedbackText}>
                {item.prlFeedback}
              </Text>
            </View>

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
});