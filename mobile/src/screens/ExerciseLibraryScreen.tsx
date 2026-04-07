import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { useWorkoutLogger } from "../state/WorkoutLoggerContext";
import { palette, radius, spacing, typography } from "../theme/workoutLoggerTheme";

type LibraryNavigation = NativeStackNavigationProp<RootStackParamList, "ExerciseLibrary">;

export default function ExerciseLibraryScreen(): React.JSX.Element {
  const navigation = useNavigation<LibraryNavigation>();
  const { exerciseLibrary, addExercisesToWorkout } = useWorkoutLogger();
  const [search, setSearch] = useState<string>("");
  const [selectedNames, setSelectedNames] = useState<Record<string, true>>({});

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return exerciseLibrary;
    }

    return exerciseLibrary.filter(
      (item) =>
        item.name.toLowerCase().includes(term) || item.muscle.toLowerCase().includes(term)
    );
  }, [exerciseLibrary, search]);

  const selectedCount = useMemo(() => Object.keys(selectedNames).length, [selectedNames]);

  const toggleSelect = (name: string): void => {
    setSelectedNames((current) => {
      const next = { ...current };
      if (next[name]) {
        delete next[name];
      } else {
        next[name] = true;
      }
      return next;
    });
  };

  const addSelected = (): void => {
    const names = Object.keys(selectedNames);
    addExercisesToWorkout(names);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Exercise Library</Text>
        <Pressable style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Text style={styles.closeButtonText}>Close</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder="Search exercise or muscle"
        placeholderTextColor={palette.textDim}
      />

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.map((item) => {
          const selected = Boolean(selectedNames[item.name]);

          return (
            <Pressable
              key={item.id}
              style={[styles.row, selected && styles.rowSelected]}
              onPress={() => toggleSelect(item.name)}
            >
              <View style={styles.rowCopy}>
                <Text style={[styles.rowTitle, selected && styles.rowTitleSelected]}>{item.name}</Text>
                <Text style={styles.rowMeta}>{item.muscle}</Text>
              </View>
              <Text style={[styles.rowStatus, selected && styles.rowStatusSelected]}>
                {selected ? "Selected" : "Select"}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{`${selectedCount} selected`}</Text>
        <Pressable
          style={[styles.addButton, selectedCount === 0 && styles.addButtonDisabled]}
          onPress={addSelected}
          disabled={selectedCount === 0}
        >
          <Text style={styles.addButtonText}>Add Selected</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.bgDeep,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  title: {
    color: palette.text,
    fontSize: typography.subtitle,
    fontWeight: "800",
  },
  closeButton: {
    minHeight: 40,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  closeButtonText: {
    color: palette.textMuted,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  searchInput: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: palette.card,
    color: palette.text,
    paddingHorizontal: spacing.sm,
    fontSize: typography.body,
    fontWeight: "600",
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    paddingBottom: 120,
  },
  row: {
    minHeight: 64,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: palette.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  rowSelected: {
    borderColor: palette.success,
    backgroundColor: "rgba(175,225,175,0.22)",
  },
  rowCopy: {
    flex: 1,
  },
  rowTitle: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: "800",
  },
  rowTitleSelected: {
    color: palette.bgDeep,
  },
  rowMeta: {
    color: palette.textMuted,
    fontSize: typography.caption,
    marginTop: 2,
  },
  rowStatus: {
    color: palette.textMuted,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  rowStatusSelected: {
    color: palette.bgDeep,
  },
  footer: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: "rgba(30,43,50,0.95)",
    padding: spacing.sm,
    gap: spacing.sm,
  },
  footerText: {
    color: palette.textMuted,
    fontSize: typography.caption,
  },
  addButton: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(249,246,238,0.36)",
    backgroundColor: palette.accentBg,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonDisabled: {
    opacity: 0.45,
  },
  addButtonText: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: "800",
  },
});
