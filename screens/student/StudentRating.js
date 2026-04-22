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
      <Text style={styles.title}>Select Lecturers modules to rate</Text>

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
            <Text style={styles.name}>{item.moduleName}</Text>
            <Text style={styles.subText}>
              Lecturer: {item.lecturerName || "Not assigned"}
            </Text>
            <Text style={styles.subText}>
              Course: {item.courseName}
            </Text>
          </TouchableOpacity>
        )}
      />



    {/*Rating form*/}
      {selectedModule && (
        <ScrollView
          style={styles.formContainer}
          showsVerticalScrollIndicator={false}
        >
          
          <View style={styles.headerCard}>
            <Text style={styles.subtitle}>
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
    backgroundColor: "#f4f6f8",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
  },

  selected: {
    backgroundColor: "#4CAF50",
  },

  name: {
    fontWeight: "bold",
    fontSize: 16,
  },

  subText: {
    fontSize: 12,
    color: "#555",
  },

  formContainer: {
    marginTop: 10,
  },

  headerCard: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },

  subtitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#fff",
  },

  smallText: {
    color: "#e0e0e0",
    fontSize: 12,
    marginTop: 3,
  },

  questionCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 1,
    paddingHorizontal: 1,
  },

  question: {
    fontSize: 14,
    marginBottom: 10,
    fontWeight: "500",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 1,
  },

  ratingBtn: {
    width: 45,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#ccc",
    backgroundColor: "#fafafa",
    marginHorizontal: 3,
  },

  selectedRating: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },

  ratingText: {
    fontWeight: "bold",
  },

  commentBox: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 10,
  },

  commentInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },

  button: {
    backgroundColor: "green",
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
  },

  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
});