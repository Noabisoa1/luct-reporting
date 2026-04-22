import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "../../config/firebase";

const QUESTIONS = [
  "Prepared for class",
  "Explained clearly",
  "Engaging lecture",
  "Encouraged participation",
  "Good pace",
  "Useful examples",
  "Punctual",
  "Helpful materials",
  "Answered questions",
  "Overall satisfaction",
];

export default function LecturerRatings() {
  const [ratings, setRatings] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [loading, setLoading] = useState(true);

  const uid = auth.currentUser.uid;

  useEffect(() => {
    fetchRatings();
  }, []);

  const fetchRatings = async () => {
    try {
      const snap = await getDocs(collection(db, "ratings"));

      const all = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const lecturerRatings = all.filter((r) => r.lecturerId === uid);

      setRatings(lecturerRatings);

      const uniqueModules = [
        ...new Map(
          lecturerRatings.map((r) => [r.moduleId, r])
        ).values(),
      ];

      setModules(uniqueModules);
      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  const calculateAverages = () => {
    const moduleRatings = ratings.filter(
      (r) => r.moduleId === selectedModule.moduleId
    );

    const totals = Array(QUESTIONS.length).fill(0);
    const count = moduleRatings.length;

    moduleRatings.forEach((r) => {
      Object.keys(r.ratings || {}).forEach((key) => {
        totals[key] += r.ratings[key];
      });
    });

    const averages = totals.map((t) =>
      count ? (t / count).toFixed(2) : 0
    );

    const overall =
      averages.reduce((a, b) => a + Number(b), 0) / QUESTIONS.length;

    return { averages, overall: overall.toFixed(2), count };
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lecturer Ratings</Text>

      <FlatList
        data={modules}
        keyExtractor={(item) => item.moduleId}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              selectedModule?.moduleId === item.moduleId &&
                styles.selected,
            ]}
            onPress={() => setSelectedModule(item)}
          >
            <Text style={styles.moduleName}>{item.moduleName}</Text>
            <Text style={styles.course}>{item.courseName}</Text>
          </TouchableOpacity>
        )}
      />

      {selectedModule && (
        <ScrollView style={styles.results}>
          <Text style={styles.subtitle}>
            {selectedModule.moduleName} Analysis
          </Text>

          {(() => {
            const { averages, overall, count } = calculateAverages();

            return (
              <View style={styles.summaryBox}>
                <Text style={styles.meta}>Students Rated: {count}</Text>

                <Text style={styles.overall}>
                  Overall Score: {overall} / 5
                </Text>

                {QUESTIONS.map((q, i) => (
                  <View key={i} style={styles.questionCard}>
                    <Text style={styles.question}>{q}</Text>
                    <Text style={styles.score}>
                      {averages[i]} / 5
                    </Text>
                  </View>
                ))}

                <Text style={styles.insight}>
                  {overall >= 4
                    ? "Excellent teaching performance"
                    : overall >= 3
                    ? "Good performance with room for improvement"
                    : "Needs improvement"}
                </Text>
              </View>
            );
          })()}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 15,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#facc15",
    marginBottom: 15,
  },

  list: {
    paddingBottom: 10,
  },

  card: {
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },

  selected: {
    backgroundColor: "#2563eb",
    borderColor: "#60a5fa",
  },

  moduleName: {
    fontWeight: "800",
    fontSize: 16,
    color: "#f1f5f9",
  },

  course: {
    color: "#94a3b8",
    marginTop: 4,
  },

  results: {
    marginTop: 10,
  },

  subtitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#e2e8f0",
    marginBottom: 10,
  },

  summaryBox: {
    backgroundColor: "#1e293b",
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },

  meta: {
    color: "#94a3b8",
    marginBottom: 6,
  },

  overall: {
    fontSize: 20,
    fontWeight: "800",
    color: "#38bdf8",
    marginBottom: 12,
  },

  questionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },

  question: {
    color: "#e2e8f0",
    flex: 1,
  },

  score: {
    fontWeight: "800",
    color: "#facc15",
  },

  insight: {
    marginTop: 15,
    textAlign: "center",
    fontWeight: "800",
    color: "#22c55e",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});