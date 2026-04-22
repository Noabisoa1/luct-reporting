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
        placeholderTextColor="#94a3b8"
        style={styles.search}
        value={filterText}
        onChangeText={setFilterText}
      />

      <FlatList
        data={filteredReports}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>

            <Text style={styles.bold}>
              {item.courseName} - {item.moduleName}
            </Text>

            <Text style={styles.meta}>Lecturer: {item.lecturerName}</Text>
            <Text style={styles.meta}>Faculty: {item.faculty}</Text>

            <View style={styles.row}>
              <Text style={styles.meta}>Week: {item.week}</Text>
              <Text style={styles.meta}>Date: {item.date}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.meta}>Venue: {item.venue}</Text>
              <Text style={styles.meta}>Time: {item.scheduledTime}</Text>
            </View>

            <Text style={styles.section}>Topic</Text>
            <Text style={styles.text}>{item.topic}</Text>

            <Text style={styles.section}>Learning Outcomes</Text>
            <Text style={styles.text}>{item.learningOutcomes}</Text>

            <Text style={styles.section}>Recommendations</Text>
            <Text style={styles.text}>{item.recommendations}</Text>

            <Text style={styles.attendance}>
              {item.attendancePresent} / {item.totalStudents} Present
            </Text>

            <View style={styles.feedbackBox}>
              <Text style={styles.feedbackTitle}>PRL Feedback</Text>
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
    padding: 16,
    backgroundColor: "#0f172a",
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#facc15",
    marginBottom: 15,
  },

  search: {
    backgroundColor: "#1e293b",
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
    color: "#e2e8f0",
  },

  card: {
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  bold: {
    fontWeight: "700",
    fontSize: 16,
    color: "#f1f5f9",
    marginBottom: 6,
  },

  meta: {
    fontSize: 13,
    color: "#94a3b8",
    marginBottom: 2,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },

  section: {
    marginTop: 10,
    fontWeight: "600",
    color: "#e2e8f0",
  },

  text: {
    color: "#cbd5f5",
    fontSize: 13,
    marginTop: 2,
  },

  attendance: {
    marginTop: 10,
    fontWeight: "700",
    color: "#38bdf8",
  },

  feedbackBox: {
    backgroundColor: "#020617",
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },

  feedbackTitle: {
    fontWeight: "700",
    color: "#facc15",
    marginBottom: 4,
  },

  feedbackText: {
    color: "#e2e8f0",
    fontSize: 13,
  },
});