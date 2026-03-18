import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";

import {
  addExerciseToWorkout,
  askAssistant,
  createCustomExercise,
  finishWorkout,
  getActiveWorkout,
  getAnalytics,
  getProfile,
  getWorkoutHistory,
  logSet,
  searchExercises,
  startWorkout,
  updateProfile,
} from "./src/services/mobile-api";

const goals = ["strength", "hypertrophy", "fat_loss", "general_fitness"];
const levels = ["beginner", "intermediate", "advanced"];

const initialProfile = {
  user_id: "u1",
  goal: "strength",
  level: "intermediate",
  equipment: ["barbell", "dumbbell"],
  age: "",
  height_cm: "",
  weight_kg: "",
  training_days_per_week: "4",
  injuries: [],
  limitations: [],
  preferred_split: "push-pull-legs",
  notes: "",
};

function splitCsv(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinCsv(value) {
  return (value || []).join(", ");
}

function Card({ title, children, right }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        {right}
      </View>
      {children}
    </View>
  );
}

function ActionButton({ label, onPress, variant = "primary", disabled = false }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.button, styles[variant], disabled && styles.disabledButton]}>
      <Text style={[styles.buttonText, variant === "ghost" && styles.ghostButtonText]}>{label}</Text>
    </Pressable>
  );
}

export default function App() {
  const [apiBase, setApiBase] = useState("http://192.168.1.10:8000");
  const [apiKey, setApiKey] = useState("dev-key");
  const [profile, setProfile] = useState(initialProfile);
  const [assistantQuestion, setAssistantQuestion] = useState("What should I train today based on my current fatigue and active workout?");
  const [assistantAnswer, setAssistantAnswer] = useState("");
  const [assistantContext, setAssistantContext] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [history, setHistory] = useState([]);
  const [exerciseQuery, setExerciseQuery] = useState("bench");
  const [exerciseResults, setExerciseResults] = useState([]);
  const [customExerciseName, setCustomExerciseName] = useState("");
  const [customExerciseMuscle, setCustomExerciseMuscle] = useState("chest");
  const [customExerciseEquipment, setCustomExerciseEquipment] = useState("dumbbell");
  const [customExercisePattern, setCustomExercisePattern] = useState("push");
  const [setExerciseName, setSetExerciseName] = useState("Bench Press");
  const [setWeight, setSetWeight] = useState("80");
  const [setReps, setSetReps] = useState("8");
  const [setRpe, setSetRpe] = useState("8");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const profileDraft = useMemo(
    () => ({
      ...profile,
      age: profile.age ? Number(profile.age) : null,
      height_cm: profile.height_cm ? Number(profile.height_cm) : null,
      weight_kg: profile.weight_kg ? Number(profile.weight_kg) : null,
      training_days_per_week: profile.training_days_per_week ? Number(profile.training_days_per_week) : 3,
      equipment: Array.isArray(profile.equipment) ? profile.equipment : splitCsv(profile.equipment),
      injuries: Array.isArray(profile.injuries) ? profile.injuries : splitCsv(profile.injuries),
      limitations: Array.isArray(profile.limitations) ? profile.limitations : splitCsv(profile.limitations),
    }),
    [profile]
  );

  const withLoading = async (fn, successMessage) => {
    setLoading(true);
    setMessage("");
    try {
      const result = await fn();
      if (successMessage) {
        setMessage(successMessage);
      }
      return result;
    } catch (error) {
      setMessage(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const refreshTrainingData = async () => {
    const [active, analyticsData, historyData] = await Promise.all([
      getActiveWorkout(apiBase, apiKey, profile.user_id),
      getAnalytics(apiBase, apiKey, profile.user_id),
      getWorkoutHistory(apiBase, apiKey, profile.user_id),
    ]);
    setActiveWorkout(active.workout);
    setAnalytics(analyticsData);
    setHistory(historyData.items || []);
  };

  const handleLoadProfile = () =>
    withLoading(async () => {
      const loaded = await getProfile(apiBase, apiKey, profile.user_id);
      setProfile({
        ...loaded,
        age: loaded.age ? String(loaded.age) : "",
        height_cm: loaded.height_cm ? String(loaded.height_cm) : "",
        weight_kg: loaded.weight_kg ? String(loaded.weight_kg) : "",
        training_days_per_week: String(loaded.training_days_per_week || 3),
        equipment: joinCsv(loaded.equipment),
        injuries: joinCsv(loaded.injuries),
        limitations: joinCsv(loaded.limitations),
      });
      await refreshTrainingData();
      return loaded;
    }, "Profile and training context loaded.");

  const handleSaveProfile = () =>
    withLoading(async () => {
      await updateProfile(apiBase, apiKey, profile.user_id, profileDraft);
      await refreshTrainingData();
    }, "Profile saved.");

  const handleStartWorkout = () =>
    withLoading(async () => {
      const response = await startWorkout(apiBase, apiKey, profile.user_id);
      await refreshTrainingData();
      return response;
    }, "Workout started.");

  const handleSearchExercises = () =>
    withLoading(async () => {
      const response = await searchExercises(apiBase, apiKey, {
        user_id: profile.user_id,
        query: exerciseQuery,
        include_recent: true,
        limit: 8,
      });
      setExerciseResults(response.items || []);
      return response;
    });

  const handleAddExercise = (exerciseName) =>
    withLoading(async () => {
      if (!activeWorkout?.workout_id) {
        throw new Error("Start a workout first.");
      }
      await addExerciseToWorkout(apiBase, apiKey, activeWorkout.workout_id, exerciseName);
      await refreshTrainingData();
    }, `${exerciseName} added.`);

  const handleCreateCustomExercise = () =>
    withLoading(async () => {
      if (!customExerciseName.trim()) {
        throw new Error("Custom exercise name is required.");
      }
      await createCustomExercise(apiBase, apiKey, {
        user_id: profile.user_id,
        name: customExerciseName,
        primary_muscle: customExerciseMuscle,
        equipment: customExerciseEquipment,
        movement_pattern: customExercisePattern,
        notes: "Created from Expo Go mobile app",
        is_private: true,
      });
      setCustomExerciseName("");
      await handleSearchExercises();
    }, "Custom exercise created.");

  const handleLogSet = () =>
    withLoading(async () => {
      if (!activeWorkout?.workout_id) {
        throw new Error("No active workout.");
      }
      await logSet(apiBase, apiKey, activeWorkout.workout_id, {
        exercise_name: setExerciseName,
        weight: Number(setWeight),
        reps: Number(setReps),
        rpe: Number(setRpe),
        notes: "Logged from Expo Go",
      });
      await refreshTrainingData();
    }, "Set logged.");

  const handleFinishWorkout = () =>
    withLoading(async () => {
      if (!activeWorkout?.workout_id) {
        throw new Error("No active workout.");
      }
      await finishWorkout(apiBase, apiKey, activeWorkout.workout_id);
      await refreshTrainingData();
    }, "Workout finished.");

  const handleAskAssistant = () =>
    withLoading(async () => {
      const response = await askAssistant(apiBase, apiKey, {
        user_id: profile.user_id,
        question: assistantQuestion,
        active_workout_id: activeWorkout?.workout_id || null,
      });
      setAssistantAnswer(response.answer || "");
      setAssistantContext(response.context || null);
      return response;
    });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>VPULZ Mobile Control Surface</Text>
        <Text style={styles.subtitle}>Expo Go client for profile, training, exercise library, analytics, and AI coaching.</Text>

        <Card title="Connection">
          <Text style={styles.help}>Use your LAN IP here for Expo Go. `localhost` will not work from your phone.</Text>
          <TextInput style={styles.input} value={apiBase} onChangeText={setApiBase} placeholder="http://192.168.x.x:8000" placeholderTextColor="#6f8595" />
          <TextInput style={styles.input} value={apiKey} onChangeText={setApiKey} placeholder="API key" placeholderTextColor="#6f8595" />
          <TextInput style={styles.input} value={profile.user_id} onChangeText={(value) => setProfile((current) => ({ ...current, user_id: value }))} placeholder="User ID" placeholderTextColor="#6f8595" />
          <View style={styles.row}>
            <ActionButton label="Load User" onPress={handleLoadProfile} />
            <ActionButton label="Refresh Training" variant="ghost" onPress={() => withLoading(refreshTrainingData, "Training data refreshed.")} />
          </View>
        </Card>

        <Card title="Profile">
          <View style={styles.pillRow}>
            {goals.map((goal) => (
              <Pressable key={goal} onPress={() => setProfile((current) => ({ ...current, goal }))} style={[styles.pill, profile.goal === goal && styles.pillActive]}>
                <Text style={styles.pillText}>{goal}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.pillRow}>
            {levels.map((level) => (
              <Pressable key={level} onPress={() => setProfile((current) => ({ ...current, level }))} style={[styles.pill, profile.level === level && styles.pillActive]}>
                <Text style={styles.pillText}>{level}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput style={styles.input} value={typeof profile.equipment === "string" ? profile.equipment : joinCsv(profile.equipment)} onChangeText={(value) => setProfile((current) => ({ ...current, equipment: value }))} placeholder="Equipment: barbell, dumbbell, cable" placeholderTextColor="#6f8595" />
          <TextInput style={styles.input} value={profile.age} onChangeText={(value) => setProfile((current) => ({ ...current, age: value }))} keyboardType="numeric" placeholder="Age" placeholderTextColor="#6f8595" />
          <TextInput style={styles.input} value={profile.height_cm} onChangeText={(value) => setProfile((current) => ({ ...current, height_cm: value }))} keyboardType="numeric" placeholder="Height cm" placeholderTextColor="#6f8595" />
          <TextInput style={styles.input} value={profile.weight_kg} onChangeText={(value) => setProfile((current) => ({ ...current, weight_kg: value }))} keyboardType="numeric" placeholder="Weight kg" placeholderTextColor="#6f8595" />
          <TextInput style={styles.input} value={profile.training_days_per_week} onChangeText={(value) => setProfile((current) => ({ ...current, training_days_per_week: value }))} keyboardType="numeric" placeholder="Training days per week" placeholderTextColor="#6f8595" />
          <TextInput style={styles.input} value={typeof profile.injuries === "string" ? profile.injuries : joinCsv(profile.injuries)} onChangeText={(value) => setProfile((current) => ({ ...current, injuries: value }))} placeholder="Injuries" placeholderTextColor="#6f8595" />
          <TextInput style={styles.input} value={typeof profile.limitations === "string" ? profile.limitations : joinCsv(profile.limitations)} onChangeText={(value) => setProfile((current) => ({ ...current, limitations: value }))} placeholder="Limitations" placeholderTextColor="#6f8595" />
          <TextInput style={styles.input} value={profile.preferred_split} onChangeText={(value) => setProfile((current) => ({ ...current, preferred_split: value }))} placeholder="Preferred split" placeholderTextColor="#6f8595" />
          <TextInput style={[styles.input, styles.textArea]} multiline value={profile.notes} onChangeText={(value) => setProfile((current) => ({ ...current, notes: value }))} placeholder="Coaching notes, recovery context, schedule constraints" placeholderTextColor="#6f8595" />
          <ActionButton label="Save Profile" onPress={handleSaveProfile} />
        </Card>

        <Card title="Training">
          <View style={styles.row}>
            <ActionButton label="Start Workout" onPress={handleStartWorkout} />
            <ActionButton label="Finish Workout" variant="ghost" onPress={handleFinishWorkout} />
          </View>
          <Text style={styles.sectionLabel}>Active workout</Text>
          <Text style={styles.valueText}>{activeWorkout ? `${activeWorkout.workout_id} • ${activeWorkout.exercises.length} exercises • ${activeWorkout.total_volume} volume` : "No active workout"}</Text>
          {(activeWorkout?.exercises || []).map((exercise) => (
            <View key={exercise.exercise_name} style={styles.listRow}>
              <Text style={styles.listTitle}>{exercise.exercise_name}</Text>
              <Text style={styles.listMeta}>{exercise.sets.length} sets</Text>
            </View>
          ))}
          <Text style={styles.sectionLabel}>Quick set logger</Text>
          <TextInput style={styles.input} value={setExerciseName} onChangeText={setSetExerciseName} placeholder="Exercise name" placeholderTextColor="#6f8595" />
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.flex]} value={setWeight} onChangeText={setSetWeight} keyboardType="numeric" placeholder="Weight" placeholderTextColor="#6f8595" />
            <TextInput style={[styles.input, styles.flex]} value={setReps} onChangeText={setSetReps} keyboardType="numeric" placeholder="Reps" placeholderTextColor="#6f8595" />
            <TextInput style={[styles.input, styles.flex]} value={setRpe} onChangeText={setSetRpe} keyboardType="numeric" placeholder="RPE" placeholderTextColor="#6f8595" />
          </View>
          <ActionButton label="Log Set" onPress={handleLogSet} />
        </Card>

        <Card title="Exercise Library">
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.flex]} value={exerciseQuery} onChangeText={setExerciseQuery} placeholder="Search exercises" placeholderTextColor="#6f8595" />
            <ActionButton label="Search" onPress={handleSearchExercises} />
          </View>
          {exerciseResults.map((exercise) => (
            <View key={exercise.id} style={styles.listRow}>
              <View style={styles.flex}>
                <Text style={styles.listTitle}>{exercise.name}</Text>
                <Text style={styles.listMeta}>{exercise.primary_muscle} • {exercise.equipment} • {exercise.difficulty_level}</Text>
              </View>
              <ActionButton label="Add" variant="ghost" onPress={() => handleAddExercise(exercise.name)} />
            </View>
          ))}
          <Text style={styles.sectionLabel}>Create custom exercise</Text>
          <TextInput style={styles.input} value={customExerciseName} onChangeText={setCustomExerciseName} placeholder="Exercise name" placeholderTextColor="#6f8595" />
          <TextInput style={styles.input} value={customExerciseMuscle} onChangeText={setCustomExerciseMuscle} placeholder="Primary muscle" placeholderTextColor="#6f8595" />
          <TextInput style={styles.input} value={customExerciseEquipment} onChangeText={setCustomExerciseEquipment} placeholder="Equipment" placeholderTextColor="#6f8595" />
          <TextInput style={styles.input} value={customExercisePattern} onChangeText={setCustomExercisePattern} placeholder="Movement pattern" placeholderTextColor="#6f8595" />
          <ActionButton label="Create Custom Exercise" onPress={handleCreateCustomExercise} />
        </Card>

        <Card title="Analytics">
          <Text style={styles.valueText}>Estimated 1RM: {analytics?.snapshot?.estimated_1rm ?? 0}</Text>
          <Text style={styles.valueText}>Total volume: {analytics?.snapshot?.total_volume ?? 0}</Text>
          <Text style={styles.valueText}>Consistency: {analytics?.snapshot?.consistency_score ?? 0}</Text>
          <Text style={styles.valueText}>Response profile: {analytics?.training_dna?.response_profile ?? "n/a"}</Text>
          <Text style={styles.sectionLabel}>Recent history</Text>
          {history.slice(0, 5).map((workout) => (
            <View key={workout.workout_id} style={styles.listRow}>
              <View style={styles.flex}>
                <Text style={styles.listTitle}>{workout.workout_id}</Text>
                <Text style={styles.listMeta}>{workout.exercises.length} exercises • {workout.total_volume} volume</Text>
              </View>
            </View>
          ))}
        </Card>

        <Card title="AI Trainer" right={loading ? <ActivityIndicator color="#d9fb61" /> : null}>
          <Text style={styles.help}>The trainer now receives your stored profile, injuries, limitations, routines, analytics, recent training, and active workout state.</Text>
          <TextInput style={[styles.input, styles.textArea]} multiline value={assistantQuestion} onChangeText={setAssistantQuestion} placeholder="Ask the trainer anything" placeholderTextColor="#6f8595" />
          <ActionButton label="Ask Trainer" onPress={handleAskAssistant} />
          <Text style={styles.answer}>{assistantAnswer || "No answer yet."}</Text>
          {assistantContext ? (
            <View style={styles.contextBox}>
              <Text style={styles.contextTitle}>Context sent to AI</Text>
              <Text style={styles.contextText}>Goal: {assistantContext.goal}</Text>
              <Text style={styles.contextText}>Level: {assistantContext.level}</Text>
              <Text style={styles.contextText}>Equipment: {(assistantContext.equipment || []).join(", ")}</Text>
              <Text style={styles.contextText}>Injuries: {(assistantContext.injuries || []).join(", ") || "none"}</Text>
              <Text style={styles.contextText}>Limitations: {(assistantContext.limitations || []).join(", ") || "none"}</Text>
              <Text style={styles.contextText}>Active workout: {assistantContext.active_workout_id || "none"}</Text>
              <Text style={styles.contextText}>Recent exercises: {(assistantContext.recent_exercises || []).join(", ")}</Text>
              <Text style={styles.contextText}>Strength score: {assistantContext.strength_score}</Text>
            </View>
          ) : null}
        </Card>

        {message ? <Text style={styles.message}>{message}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#08111a",
  },
  container: {
    padding: 18,
    gap: 14,
    paddingBottom: 40,
  },
  title: {
    color: "#f4f7fb",
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: "#98b0bf",
    marginBottom: 6,
  },
  card: {
    backgroundColor: "#10202d",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1e394b",
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    color: "#f4f7fb",
    fontSize: 18,
    fontWeight: "700",
  },
  help: {
    color: "#7ea0b4",
    lineHeight: 19,
  },
  input: {
    backgroundColor: "#0a1823",
    borderWidth: 1,
    borderColor: "#254456",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#f4f7fb",
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  flex: {
    flex: 1,
  },
  button: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 110,
  },
  primary: {
    backgroundColor: "#d9fb61",
  },
  ghost: {
    backgroundColor: "#132634",
    borderWidth: 1,
    borderColor: "#335267",
  },
  disabledButton: {
    opacity: 0.45,
  },
  buttonText: {
    color: "#08111a",
    fontWeight: "700",
  },
  ghostButtonText: {
    color: "#d5e3ec",
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#335267",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillActive: {
    backgroundColor: "#173448",
    borderColor: "#d9fb61",
  },
  pillText: {
    color: "#d6e6ef",
  },
  sectionLabel: {
    color: "#d9fb61",
    fontWeight: "700",
    marginTop: 6,
  },
  valueText: {
    color: "#eef5fa",
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#18313f",
  },
  listTitle: {
    color: "#f4f7fb",
    fontWeight: "600",
  },
  listMeta: {
    color: "#8ba6b7",
    fontSize: 12,
    marginTop: 2,
  },
  answer: {
    color: "#f4f7fb",
    lineHeight: 21,
  },
  contextBox: {
    backgroundColor: "#0a1823",
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  contextTitle: {
    color: "#d9fb61",
    fontWeight: "700",
    marginBottom: 4,
  },
  contextText: {
    color: "#c9d9e3",
  },
  message: {
    color: "#d9fb61",
    textAlign: "center",
    paddingVertical: 8,
  },
});
