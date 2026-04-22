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

import {
  collection,
  getDocs,
} from "firebase/firestore";

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
  "Overall satisfaction"
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

      const all = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const lecturerRatings = all.filter(
        r => r.lecturerId === uid
      );

      setRatings(lecturerRatings);

      const uniqueModules = [
        ...new Map(
          lecturerRatings.map(r => [r.moduleId, r])
        ).values()
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
      r => r.moduleId === selectedModule.moduleId
    );

    const totals = Array(QUESTIONS.length).fill(0);
    let count = moduleRatings.length;

    moduleRatings.forEach(r => {
      Object.keys(r.ratings || {}).forEach((key) => {
        totals[key] += r.ratings[key];
      });
    });

    const averages = totals.map(t =>
      count ? (t / count).toFixed(2) : 0
    );

    const overall =
      averages.reduce((a, b) => a + Number(b), 0) /
      QUESTIONS.length;

    return { averages, overall: overall.toFixed(2), count };
  };

  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lecturer Ratings</Text>

      <FlatList
        data={modules}
        keyExtractor={(item) => item.moduleId}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              selectedModule?.moduleId === item.moduleId &&
                styles.selected,
            ]}
            onPress={() => setSelectedModule(item)}
          >
            <Text style={styles.name}>{item.moduleName}</Text>
            <Text>{item.courseName}</Text>
          </TouchableOpacity>
        )}
      />

      {selectedModule && (
        <ScrollView style={styles.results}>
          <Text style={styles.subtitle}>
            {selectedModule.moduleName} Analysis
          </Text>

          {(() => {
            const { averages, overall, count } =
              calculateAverages();

            return (
              <>
                <Text style={styles.meta}>
                  Students Rated: {count}
                </Text>

                <Text style={styles.overall}>
                  Overall Score: {overall} / 5
                </Text>

                {QUESTIONS.map((q, i) => (
                  <View key={i} style={styles.qCard}>
                    <Text>{q}</Text>
                    <Text style={styles.score}>
                      {averages[i]} / 5
                    </Text>
                  </View>
                ))}

                <Text style={styles.insight}>
                  {overall >= 4
                    ? "Excellent teaching performance"
                    : overall >= 3
                    ? "Good, but room for improvement"
                    : "Needs improvement"}
                </Text>
              </>
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
    padding: 15,
    backgroundColor: "#f4f6f8",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },

  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },

  selected: {
    backgroundColor: "#4CAF50",
  },

  name: {
    fontWeight: "bold",
  },

  results: {
    marginTop: 10,
  },

  subtitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 10,
  },

  meta: {
    marginBottom: 5,
  },

  overall: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#2563eb",
  },

  qCard: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  score: {
    fontWeight: "bold",
  },

  insight: {
    marginTop: 15,
    fontWeight: "bold",
    textAlign: "center",
  },
});