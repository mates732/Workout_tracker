import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { loadTrackerSnapshot } from '../../shared/state/workoutTrackerStore';
import { useSettings } from '../settings/state/SettingsContext';
import { getCoachResponse } from '../../shared/ai/AIService';
import { useWorkoutContext } from '../workout/state/workoutContext';
import type { WorkoutHistoryEntry, PendingAction } from '../workout/workoutTracker.types';

const QUICK_PROMPTS = [
  'What should I increase next session?',
  'Should I deload this week?',
  'How should I structure my next workout?',
];

export function AiTrainerScreen() {
  const { exercises, timer } = useWorkoutContext();
  const { t, colors } = useSettings();
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('Ask for progression, volume, fatigue, or next-session strategy.');
  const [providerLabel, setProviderLabel] = useState('Ready');
  const [busy, setBusy] = useState(false);
  const [pendingQueue, setPendingQueue] = useState<PendingAction[]>([]);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryEntry[]>([]);

  useEffect(() => {
    let mounted = true;

    void loadTrackerSnapshot().then((snapshot) => {
      if (!mounted) {
        return;
      }
      setPendingQueue(snapshot.pendingQueue ?? []);
      setWorkoutHistory(snapshot.workoutHistory ?? []);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const activeSummary = useMemo(() => {
    if (!exercises.length) {
      return 'No active workout';
    }

    const totalSets = exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
    const elapsedMinutes = Math.floor(timer.seconds / 60);
    return `${exercises.length} exercises · ${totalSets} sets · ${elapsedMinutes}m`;
  }, [exercises, timer.seconds]);

  const latestHistory = workoutHistory[0];

  const submitQuestion = async (preset?: string) => {
    const nextQuestion = (preset ?? question).trim();
    if (!nextQuestion) {
      return;
    }

    setBusy(true);
    try {
      const recent = latestHistory
        ? `${latestHistory.durationMinutes}m, ${Math.round(latestHistory.totalVolume)}kg volume, ${latestHistory.totalSets} sets`
        : 'No completed sessions yet';
      const result = await getCoachResponse(nextQuestion, {
        pendingSync: pendingQueue.length,
        activeWorkoutSummary: activeSummary,
        recentSummary: recent,
      });
      setResponse(result.answer);
      setProviderLabel(`Provider: ${result.provider === 'local' ? 'offline fallback' : result.provider}`);
      setQuestion(nextQuestion);
    } catch {
      setResponse('Coach is temporarily unavailable. Try again in a moment.');
      setProviderLabel('Provider: unavailable');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}> 
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{t('coach')}</Text>
            <Text style={[styles.meta, { color: colors.textMuted }]}>{providerLabel}</Text>
          </View>

          <View style={[styles.statsBlock, { borderColor: colors.border, backgroundColor: colors.surface }]}> 
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Context</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{activeSummary}</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{t('pendingSync')}: {pendingQueue.length}</Text>
          </View>

          <View style={styles.quickRow}>
            {QUICK_PROMPTS.map((prompt) => (
              <Pressable key={prompt} onPress={() => void submitQuestion(prompt)}>
                <Text style={[styles.quickText, { color: colors.textMuted }]}>{prompt}</Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            value={question}
            onChangeText={setQuestion}
            placeholder="Ask your trainer"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
            returnKeyType="send"
            onSubmitEditing={() => {
              void submitQuestion();
            }}
          />

          <Pressable
            style={[styles.askButton, { backgroundColor: colors.text }]}
            onPress={() => {
              void submitQuestion();
            }}
          >
            <Text style={[styles.askButtonText, { color: colors.background }]}>{busy ? 'Thinking...' : t('askCoach')}</Text>
          </Pressable>

          <View style={[styles.answerBlock, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}> 
            <Text style={[styles.answerLabel, { color: colors.textMuted }]}>{t('coachInsight')}</Text>
            <Text style={[styles.answerText, { color: colors.text }]}>{response}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100,
    gap: 16,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  meta: {
    fontSize: 13,
  },
  statsBlock: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  quickRow: {
    gap: 8,
  },
  quickText: {
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  input: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    paddingHorizontal: 12,
  },
  askButton: {
    minHeight: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  askButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  answerBlock: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  answerLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  answerText: {
    fontSize: 15,
    lineHeight: 22,
  },
});
