import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";

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

export default function LecturerReportForm() {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);

  const [students, setStudents] = useState([]);

 
  const [week, setWeek] = useState("");
  const [venue, setVenue] = useState("");
  const [topic, setTopic] = useState("");
  const [outcomes, setOutcomes] = useState("");
  const [recommendations, setRecommendations] = useState("");

  const [presentCount, setPresentCount] = useState(0);

  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());

  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const uid = auth.currentUser.uid;

      const userSnap = await getDoc(doc(db, "users", uid));
      const user = userSnap.data();
      setUserData(user);

      const moduleObjects = user.modules || [];
      const moduleIds = moduleObjects.map((m) => m.moduleId);

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

    fetchData();
  }, []);

  const loadStudents = async (module) => {
    if (!module?.studentIds?.length) {
      setStudents([]);
      return;
    }

    const q = query(
      collection(db, "users"),
      where("__name__", "in", module.studentIds)
    );

    const snap = await getDocs(q);

    setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const fetchAttendance = async (moduleId) => {
    const q = query(
      collection(db, "attendance"),
      where("moduleId", "==", moduleId)
    );

    const snap = await getDocs(q);

    if (!snap.empty) {
      const latest = snap.docs
        .map(d => d.data())
        .sort(
          (a, b) =>
            (b.createdAt?.seconds || 0) -
            (a.createdAt?.seconds || 0)
        )[0];

      setPresentCount(latest.presentCount || 0);
    } else {
      setPresentCount(0);
    }
  };

  const handleSelectModule = (m) => {
    setSelectedModule(m);
    loadStudents(m);
    fetchAttendance(m.id);
  };

  const submitReport = async () => {
    if (!selectedModule || !week || !topic) {
      Alert.alert("Error", "Fill required fields");
      return;
    }

    try {
      await addDoc(collection(db, "reports"), {
        lecturerId: auth.currentUser.uid,
        lecturerName: userData?.name,
        faculty: userData?.faculty,

        courseId: selectedModule.courseId,
        courseName: selectedModule.courseName,

        moduleId: selectedModule.id,
        moduleName: selectedModule.moduleName,
        moduleCode: selectedModule.moduleCode,

        week,
        date: date.toISOString().split("T")[0],
        scheduledTime: time.toTimeString().split(" ")[0],

        venue,
        topic,
        learningOutcomes: outcomes,
        recommendations,
        attendancePresent: presentCount,

        totalStudents:
          selectedModule.studentIds?.length || students.length || 0,

        prlFeedback: "",
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success", "Report submitted");
      setWeek("");
      setVenue("");
      setTopic("");
      setOutcomes("");
      setRecommendations("");
      setSelectedModule(null);
      setStudents([]);
      setPresentCount(0);

    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Report Form</Text>
      <Text style={styles.subtitle}>Select Module</Text>

      <FlatList
        data={modules}
        scrollEnabled={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              selectedModule?.id === item.id && styles.selected,
            ]}
            onPress={() => handleSelectModule(item)}
          >
            <Text style={{ fontWeight: "bold" }}>{item.moduleName}</Text>
            <Text>{item.moduleCode}</Text>
            <Text>{item.courseName}</Text>
          </TouchableOpacity>
        )}
      />

      {selectedModule && (
        <View style={styles.infoBox}>
          <Text style={{ fontWeight: "bold" }}>
            Total Students: {students.length}
          </Text>

          <Text style={{ marginTop: 5 }}>
            Present Students: {presentCount}
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.input} onPress={() => setShowDate(true)}>
        <Text>Select Date: {date.toDateString()}</Text>
      </TouchableOpacity>

      {showDate && (
        <DateTimePicker
          value={date}
          mode="date"
          onChange={(e, selected) => {
            setShowDate(false);
            if (selected) setDate(selected);
          }}
        />
      )}

      <TouchableOpacity style={styles.input} onPress={() => setShowTime(true)}>
        <Text>Select Time: {time.toTimeString().slice(0, 5)}</Text>
      </TouchableOpacity>

      {showTime && (
        <DateTimePicker
          value={time}
          mode="time"
          onChange={(e, selected) => {
            setShowTime(false);
            if (selected) setTime(selected);
          }}
        />
      )}

      <TextInput placeholder="Week" style={styles.input} value={week} onChangeText={setWeek} />
      <TextInput placeholder="Venue" style={styles.input} value={venue} onChangeText={setVenue} />
      <TextInput placeholder="Topic" style={styles.input} value={topic} onChangeText={setTopic} />
      <TextInput placeholder="Learning Outcomes" style={styles.input} value={outcomes} onChangeText={setOutcomes} />
      <TextInput placeholder="Recommendations" style={styles.input} value={recommendations} onChangeText={setRecommendations} />

      <TouchableOpacity style={styles.button} onPress={submitReport}>
        <Text style={styles.btnText}>Submit Report</Text>
      </TouchableOpacity>
    </ScrollView>
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

  subtitle: {
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
  },

  card: {
    padding: 12,
    backgroundColor: "#eee",
    marginBottom: 8,
    borderRadius: 8,
  },

  selected: {
    backgroundColor: "#4CAF50",
  },

  infoBox: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#2563eb",
  },

  input: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
  },

  button: {
    backgroundColor: "green",
    padding: 14,
    borderRadius: 8,
    marginTop: 15,
  },

  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
});