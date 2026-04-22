import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { auth, db } from "../../config/firebase";

const QUESTIONS = [
  "Was the lecturer prepared for class?",
  "Did the lecturer explain concepts clearly?",
  "Was the lecture engaging?",
  "Did the lecturer encourage participation?",
  "Was the pace of teaching appropriate?",
  "Did the lecturer provide useful examples?",
  "Was the lecturer punctual?",
  "Were learning materials helpful?",
  "Did the lecturer answer questions effectively?",
  "Overall satisfaction with this module?"
];

export default function StudentRating() {
  const [modules, setModules] = useState([]);
  const [student, setStudent] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);

  const [ratings, setRatings] = useState({});
  const [comment, setComment] = useState("");

  const uid = auth.currentUser.uid;

  useEffect(() => {
    const load = async () => {
      const userSnap = await getDoc(doc(db, "users", uid));
      const user = userSnap.data();

      setStudent(user);

      const registered = user.registeredModules || [];
      const moduleIds = registered.map((m) => m.moduleId);

      if (moduleIds.length === 0) return;

      const q = query(
        collection(db, "modules"),
        where("__name__", "in", moduleIds)
      );

      const snap = await getDocs(q);

      setModules(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    };

    load();
  }, []);

  const handleRatingChange = (index, value) => {
    setRatings((prev) => ({
      ...prev,
      [index]: value,
    }));
  };

  const submitRating = async () => {
    if (!selectedModule) {
      Alert.alert("Error", "Select a module first");
      return;
    }

    if (Object.keys(ratings).length < QUESTIONS.length) {
      Alert.alert("Error", "Please rate all questions");
      return;
    }

    try {
      await addDoc(collection(db, "ratings"), {
        studentId: uid,
        studentName: student?.name,

        moduleId: selectedModule.id,
        moduleName: selectedModule.moduleName,
        courseId: selectedModule.courseId,
        courseName: selectedModule.courseName,

        lecturerId: selectedModule.lecturerId,
        lecturerName: selectedModule.lecturerName,

        ratings,
        comment,

        createdAt: serverTimestamp(),
      });

      Alert.alert("Success", "Rating submitted!");

      setSelectedModule(null);
      setRatings({});
      setComment("");
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Student Rating</Text>

      <Text style={styles.subtitle}>Select Module</Text>

      <FlatList
        data={modules}
        keyExtractor={(item) => item.id}
        style={{ maxHeight: 220 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              selectedModule?.id === item.id && styles.selected,
            ]}
            onPress={() => {
              setSelectedModule(item);
              setRatings({});
              setComment("");
            }}
          >
            <Text style={styles.titleText}>{item.moduleName}</Text>
            <Text style={styles.text}>
              Lecturer: {item.lecturerName || "Not assigned"}
            </Text>
            <Text style={styles.text}>Course: {item.courseName}</Text>
          </TouchableOpacity>
        )}
      />

      {selectedModule && (
        <ScrollView style={styles.formContainer}>
          <View style={styles.headerCard}>
            <Text style={styles.headerText}>
              Rate {selectedModule.lecturerName}
            </Text>
            <Text style={styles.smallText}>
              Module: {selectedModule.moduleName}
            </Text>
          </View>

          {QUESTIONS.map((q, index) => (
            <View key={index} style={styles.questionCard}>
              <Text style={styles.question}>
                {index + 1}. {q}
              </Text>

              <View style={styles.row}>
                {[1, 2, 3, 4, 5].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.ratingBtn,
                      ratings[index] === num && styles.selectedRating,
                    ]}
                    onPress={() => handleRatingChange(index, num)}
                  >
                    <Text style={styles.ratingText}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          <View style={styles.commentBox}>
            <TextInput
              placeholder="General Comment (optional)"
              placeholderTextColor="#94a3b8"
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              multiline
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={submitRating}>
            <Text style={styles.btnText}>Submit Rating</Text>
          </TouchableOpacity>

          <View style={{ height: 30 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#0f172a",
  },

  header: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 15,
    color: "#facc15",
  },

  subtitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e2e8f0",
    marginBottom: 10,
  },

  card: {
    backgroundColor: "#1e293b",
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },

  selected: {
    backgroundColor: "#4CAF50",
  },

  titleText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: 3,
  },

  text: {
    fontSize: 13,
    color: "#cbd5e1",
  },

  formContainer: {
    marginTop: 10,
  },

  headerCard: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 14,
    marginBottom: 15,
  },

  headerText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },

  smallText: {
    color: "#e0e7ff",
    fontSize: 12,
    marginTop: 3,
  },

  questionCard: {
    backgroundColor: "#1e293b",
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },

  question: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f1f5f9",
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  ratingBtn: {
    width: 42,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
  },

  selectedRating: {
    backgroundColor: "#16a34a",
    borderColor: "#16a34a",
  },

  ratingText: {
    color: "#fff",
    fontWeight: "700",
  },

  commentBox: {
    backgroundColor: "#1e293b",
    padding: 10,
    borderRadius: 14,
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },

  commentInput: {
    minHeight: 80,
    color: "#fff",
    textAlignVertical: "top",
  },

  button: {
    backgroundColor: "#16a34a",
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