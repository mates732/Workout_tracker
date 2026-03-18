import { h, render } from "https://unpkg.com/preact@10.19.3/dist/preact.module.js";
import { useEffect, useMemo, useState } from "https://unpkg.com/preact@10.19.3/hooks/dist/hooks.module.js";
import htm from "https://unpkg.com/htm@3.1.1/preact/index.mjs";

const html = htm.bind(h);

const COLORS = {
  background: "#000000",
  surface: "#0B0B0B",
  surfaceElevated: "#121212",
  input: "#1A1A1A",
  textPrimary: "#F5F5F5",
  textSecondary: "#C8C8C8",
  divider: "#2A2A2A",
  accent: "#FFFFFF",
  error: "#FF5A5F",
};

const STORAGE_KEY = "vpulz_tracker_state_v1";

const sampleExercises = [
  {
    id: "bench_press",
    name: "Barbell Bench Press",
    muscle: "Chest",
    equipment: "Barbell",
    difficulty: "Intermediate",
    instructions: "Press the bar from chest with controlled tempo.",
  },
  {
    id: "pull_up",
    name: "Pull Ups",
    muscle: "Back",
    equipment: "Bodyweight",
    difficulty: "Intermediate",
    instructions: "Full range of motion, avoid swinging.",
  },
  {
    id: "squat",
    name: "Back Squat",
    muscle: "Legs",
    equipment: "Barbell",
    difficulty: "Intermediate",
    instructions: "Maintain braced core, descend below parallel.",
  },
  {
    id: "oh_press",
    name: "Overhead Press",
    muscle: "Shoulders",
    equipment: "Barbell",
    difficulty: "Intermediate",
    instructions: "Press overhead without leaning back.",
  },
  {
    id: "db_row",
    name: "Dumbbell Row",
    muscle: "Back",
    equipment: "Dumbbell",
    difficulty: "Beginner",
    instructions: "Flat back, pull to hip.",
  },
  {
    id: "incline_db",
    name: "Incline DB Press",
    muscle: "Chest",
    equipment: "Dumbbell",
    difficulty: "Intermediate",
    instructions: "Press with slight elbow tuck.",
  },
  {
    id: "hip_thrust",
    name: "Barbell Hip Thrust",
    muscle: "Glutes",
    equipment: "Barbell",
    difficulty: "Intermediate",
    instructions: "Lockout with glute squeeze, neutral spine.",
  },
];

const sampleTemplates = [
  {
    id: "template_push",
    name: "Push Day",
    description: "Chest, shoulders, triceps focus",
    exercises: [
      { exerciseId: "bench_press", sets: 3, reps: 8, rest: 120 },
      { exerciseId: "oh_press", sets: 3, reps: 10, rest: 120 },
      { exerciseId: "incline_db", sets: 3, reps: 12, rest: 90 },
    ],
  },
  {
    id: "template_pull",
    name: "Pull Day",
    description: "Back and biceps volume",
    exercises: [
      { exerciseId: "pull_up", sets: 4, reps: 6, rest: 150 },
      { exerciseId: "db_row", sets: 3, reps: 12, rest: 90 },
    ],
  },
];

const sampleHistory = [
  {
    id: "wk_prev_1",
    startAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    endAt: Date.now() - 1000 * 60 * 60 * 24 * 2 + 52 * 60 * 1000,
    source: "quick_start",
    notes: "Felt strong, slight fatigue on pull ups.",
    exercises: [
      {
        uid: "e1",
        exerciseId: "bench_press",
        name: "Barbell Bench Press",
        muscle: "Chest",
        equipment: "Barbell",
        order: 0,
        sets: [
          { id: "s1", weight: 80, reps: 8, rpe: 7.5, volume: 640 },
          { id: "s2", weight: 80, reps: 7, rpe: 8, volume: 560 },
          { id: "s3", weight: 75, reps: 6, rpe: 8.5, volume: 450 },
        ],
      },
      {
        uid: "e2",
        exerciseId: "pull_up",
        name: "Pull Ups",
        muscle: "Back",
        equipment: "Bodyweight",
        order: 1,
        sets: [
          { id: "s4", weight: 0, reps: 10, rpe: 7, volume: 0 },
          { id: "s5", weight: 0, reps: 9, rpe: 7.5, volume: 0 },
        ],
      },
    ],
  },
];

const uid = (prefix = "id") => `${prefix}_${Math.random().toString(36).slice(2, 8)}`;

const volumeOfSet = (weight, reps) => (weight || 0) * (reps || 0);

const bestStatsForExercise = (exerciseId, workouts) => {
  let maxWeight = 0;
  let maxReps = 0;
  let maxVolume = 0;
  workouts.forEach((wk) => {
    wk.exercises
      .filter((ex) => ex.exerciseId === exerciseId)
      .forEach((ex) => {
        ex.sets.forEach((s) => {
          maxWeight = Math.max(maxWeight, s.weight || 0);
          maxReps = Math.max(maxReps, s.reps || 0);
          maxVolume = Math.max(maxVolume, s.volume || volumeOfSet(s.weight, s.reps));
        });
      });
  });
  return { maxWeight, maxReps, maxVolume };
};

const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { currentWorkout: null, history: sampleHistory };
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load state", e);
    return { currentWorkout: null, history: sampleHistory };
  }
};

const saveState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state", e);
  }
};

const findExerciseById = (id) => sampleExercises.find((x) => x.id === id);

const formatDuration = (seconds) => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
};

const RestPill = ({ label, onAdd, onSubtract, remaining }) =>
  html`<div class="rest-pill">
    <span>${label}</span>
    <div class="rest-actions">
      <button class="ghost" onClick={onSubtract}>-30s</button>
      <span class="mono">${formatDuration(Math.max(0, remaining))}</span>
      <button class="ghost" onClick={onAdd}>+30s</button>
    </div>
  </div>`;

const SectionCard = ({ title, children, actions }) =>
  html`<section class="card">
    <header class="card-header">
      <div class="card-title">${title}</div>
      ${actions ? html`<div class="card-actions">${actions}</div>` : null}
    </header>
    <div class="card-body">${children}</div>
  </section>`;

const QuickBadge = ({ text }) => html`<span class="badge">${text}</span>`;

const ExerciseNote = ({ value, onChange }) =>
  html`<label class="field">
    <span class="field-label">Exercise note</span>
    <textarea
      value={value || ""}
      onInput={(e) => onChange(e.target.value)}
      placeholder="Technique, pain warnings, tempo"
    />
  </label>`;

const SetRow = ({ set, onChange, onDuplicate, onDelete, showPR }) => {
  return html`<div class="set-row">
    <div class="set-index">#${set.index}</div>
    <input
      class="input weight"
      type="number"
      step="0.5"
      value={set.weight ?? ""}
      onInput={(e) => onChange({ ...set, weight: Number(e.target.value) })}
      placeholder="kg"
    />
    <input
      class="input reps"
      type="number"
      value={set.reps ?? ""}
      onInput={(e) => onChange({ ...set, reps: Number(e.target.value) })}
      placeholder="reps"
    />
    <input
      class="input rpe"
      type="number"
      step="0.5"
      value={set.rpe ?? ""}
      onInput={(e) => onChange({ ...set, rpe: Number(e.target.value) })}
      placeholder="RPE"
    />
    <button class="ghost" onClick={onDuplicate}>Duplicate</button>
    <button class="ghost danger" onClick={onDelete}>Delete</button>
    ${showPR ? html`<span class="pr-badge">PR</span>` : null}
  </div>`;
};

const PreviousBlock = ({ exerciseId, history }) => {
  const last = history.find((wk) =>
    wk.exercises.some((ex) => ex.exerciseId === exerciseId)
  );
  if (!last) return html`<div class="previous">No previous data</div>`;
  const ex = last.exercises.find((e) => e.exerciseId === exerciseId);
  return html`<div class="previous">
    <div class="previous-title">Last workout</div>
    <div class="previous-sets">
      ${ex.sets.map(
        (s) => html`<span>${s.weight}kg × ${s.reps}</span>`
      )}
    </div>
  </div>`;
};

const ExerciseCard = ({
  exercise,
  history,
  onAddSet,
  onChangeSet,
  onDuplicateSet,
  onDeleteSet,
  onStartRest,
  restRemaining,
  onNote,
  onReplace,
  onSuperset,
  onMoveUp,
  onMoveDown,
}) => {
  return html`<div class="exercise-card">
    <div class="exercise-head">
      <div>
        <div class="exercise-name">${exercise.name}</div>
        <div class="exercise-meta">${exercise.muscle} · ${exercise.equipment}</div>
        ${exercise.supersetGroupId
          ? html`<div class="superset-label">Superset group ${
              exercise.supersetGroupId
            }</div>`
          : null}
      </div>
      <div class="exercise-actions">
        <button class="ghost" onClick={onMoveUp}>↑</button>
        <button class="ghost" onClick={onMoveDown}>↓</button>
        <button class="ghost" onClick={onSuperset}>Superset</button>
        <button class="ghost" onClick={onReplace}>Replace</button>
        <button class="ghost" onClick={() => onStartRest(exercise)}>Rest</button>
      </div>
    </div>
    <${PreviousBlock} exerciseId={exercise.exerciseId} history={history} />
    <div class="set-table">
      ${exercise.sets.map((s, idx) =>
        html`<${SetRow}
          key=${s.id}
          set={{ ...s, index: idx + 1 }}
          showPR=${s.pr}
          onChange={(next) => onChangeSet(exercise.uid, s.id, next)}
          onDuplicate={() => onDuplicateSet(exercise.uid, s)}
          onDelete={() => onDeleteSet(exercise.uid, s.id)}
        />`
      )}
      <button class="primary full" onClick={() => onAddSet(exercise.uid)}>
        + Add set
      </button>
    </div>
    <${ExerciseNote}
      value={exercise.notes}
      onChange={(val) => onNote(exercise.uid, val)}
    />
    ${restRemaining > 0
      ? html`<${RestPill}
          label="Rest"
          remaining={restRemaining}
          onAdd={() => onStartRest(exercise, 30, true)}
          onSubtract={() => onStartRest(exercise, -30, true)}
        />`
      : null}
  </div>`;
};

const ExercisePicker = ({
  open,
  onClose,
  onSelect,
  onCreateCustom,
  recent,
}) => {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return sampleExercises.filter((ex) =>
      [ex.name, ex.muscle, ex.equipment].some((f) => f.toLowerCase().includes(q))
    );
  }, [query]);

  if (!open) return null;
  return html`<div class="sheet">
    <div class="sheet-content">
      <div class="sheet-head">
        <div>
          <div class="sheet-title">Add exercise</div>
          <div class="muted">Search, filter, or pick a recent</div>
        </div>
        <button class="ghost" onClick={onClose}>Close</button>
      </div>
      <input
        class="input full"
        placeholder="Search name, muscle, equipment"
        value={query}
        onInput={(e) => setQuery(e.target.value)}
      />
      <div class="chip-row">
        ${recent.map((r) =>
          html`<button class="chip" onClick={() => onSelect(r)}>${r.name}</button>`
        )}
      </div>
      <div class="exercise-list">
        ${filtered.map(
          (ex) => html`<button class="exercise-row" onClick={() => onSelect(ex)}>
            <div>
              <div class="exercise-name">${ex.name}</div>
              <div class="exercise-meta">${ex.muscle} · ${ex.equipment}</div>
            </div>
            <span class="muted">${ex.difficulty}</span>
          </button>`
        )}
      </div>
      <div class="custom-create">
        <div class="muted">Need something else?</div>
        <button
          class="primary full"
          onClick={() => {
            const name = prompt("Custom exercise name?");
            if (!name) return;
            const muscle = prompt("Primary muscle group?") || "Custom";
            const equipment = prompt("Equipment?") || "Bodyweight";
            const custom = {
              id: uid("custom"),
              name,
              muscle,
              equipment,
              difficulty: "Custom",
              instructions: "User defined",
              is_custom: true,
            };
            onCreateCustom(custom);
            onSelect(custom);
          }}
        >
          Create custom exercise
        </button>
      </div>
    </div>
  </div>`;
};

const SummaryCard = ({ workout, onDuplicate }) => {
  const totalSets = workout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const totalReps = workout.exercises.reduce(
    (acc, ex) => acc + ex.sets.reduce((s, set) => s + (set.reps || 0), 0),
    0
  );
  const totalVolume = workout.exercises.reduce(
    (acc, ex) => acc + ex.sets.reduce((s, set) => s + (set.volume || 0), 0),
    0
  );
  const durationMin = Math.round((workout.endAt - workout.startAt) / 60000);
  return html`<div class="summary">
    <div class="summary-line"><span>Duration</span><span>${durationMin}m</span></div>
    <div class="summary-line"><span>Total sets</span><span>${totalSets}</span></div>
    <div class="summary-line"><span>Total reps</span><span>${totalReps}</span></div>
    <div class="summary-line"><span>Total volume</span><span>${totalVolume} kg</span></div>
    <button class="ghost" onClick={onDuplicate}>Duplicate workout</button>
  </div>`;
};

const TabNav = ({ view, onChange }) => {
  const tabs = [
    { id: "home", label: "Home" },
    { id: "workout", label: "Workout" },
    { id: "history", label: "History" },
    { id: "progress", label: "Progress" },
    { id: "templates", label: "Templates" },
  ];
  return html`<div class="tabs">
    ${tabs.map((t) =>
      html`<button
        class=${"tab" + (view === t.id ? " active" : "")}
        onClick={() => onChange(t.id)}
      >
        ${t.label}
      </button>`
    )}
  </div>`;
};

const StatsBlock = ({ history }) => {
  const aggregates = useMemo(() => {
    let totalVolume7 = 0;
    let totalWorkouts7 = 0;
    const now = Date.now();
    history.forEach((wk) => {
      if (now - wk.endAt <= 7 * 24 * 3600 * 1000) {
        totalWorkouts7 += 1;
        wk.exercises.forEach((ex) => {
          ex.sets.forEach((s) => {
            totalVolume7 += s.volume || volumeOfSet(s.weight, s.reps);
          });
        });
      }
    });
    return { totalVolume7, totalWorkouts7 };
  }, [history]);

  return html`<div class="stats">
    <div class="stat">
      <div class="stat-label">7d Volume</div>
      <div class="stat-value">${aggregates.totalVolume7} kg</div>
    </div>
    <div class="stat">
      <div class="stat-label">7d Frequency</div>
      <div class="stat-value">${aggregates.totalWorkouts7} sessions</div>
    </div>
  </div>`;
};

const ProgressBlock = ({ history }) => {
  const exercises = Array.from(
    new Set(history.flatMap((wk) => wk.exercises.map((ex) => ex.name)))
  );
  return html`<div class="progress">
    ${exercises.map((name) => {
      const trend = history
        .map((wk) => {
          const ex = wk.exercises.find((e) => e.name === name);
          if (!ex) return null;
          const vol = ex.sets.reduce((acc, s) => acc + (s.volume || volumeOfSet(s.weight, s.reps)), 0);
          return { ts: wk.endAt, vol };
        })
        .filter(Boolean)
        .sort((a, b) => a.ts - b.ts);
      const last = trend[trend.length - 1];
      return html`<div class="progress-row">
        <div>
          <div class="exercise-name">${name}</div>
          <div class="muted">Volume trend</div>
        </div>
        <div class="muted">${last ? `${last.vol} kg` : "-"}</div>
      </div>`;
    })}
  </div>`;
};

const TemplateBlock = ({ onStart }) =>
  html`<div class="template-grid">
    ${sampleTemplates.map(
      (t) => html`<div class="template-card">
        <div class="template-title">${t.name}</div>
        <div class="muted">${t.description}</div>
        <div class="template-meta">${t.exercises.length} exercises</div>
        <button class="primary full" onClick={() => onStart(t)}>Start</button>
      </div>`
    )}
  </div>`;

const HistoryList = ({ history, onRepeat }) =>
  html`<div class="history-list">
    ${history.map((wk) => {
      const date = new Date(wk.startAt).toLocaleDateString();
      const volume = wk.exercises.reduce(
        (acc, ex) => acc + ex.sets.reduce((s, set) => s + (set.volume || 0), 0),
        0
      );
      return html`<div class="history-row">
        <div>
          <div class="history-title">${date}</div>
          <div class="muted">${wk.exercises.length} exercises · ${volume} kg</div>
        </div>
        <button class="ghost" onClick={() => onRepeat(wk)}>Repeat</button>
      </div>`;
    })}
  </div>`;

const QuickStartPanel = ({ onStart, onAIStart, onRepeat, lastWorkout }) =>
  html`<div class="quick-grid">
    <div class="quick-card">
      <div class="quick-title">Quick Start</div>
      <div class="muted">Blank canvas, timer starts instantly.</div>
      <button class="primary full" onClick={() => onStart("quick_start")}>Start</button>
    </div>
    <div class="quick-card">
      <div class="quick-title">AI Recommend</div>
      <div class="muted">Uses fatigue + recent volume.</div>
      <button class="primary full" onClick={onAIStart}>Get AI plan</button>
    </div>
    <div class="quick-card">
      <div class="quick-title">Repeat Last</div>
      <div class="muted">${lastWorkout ? "Load last structure" : "No history yet"}</div>
      <button class="primary full" disabled={!lastWorkout} onClick={() => lastWorkout && onRepeat(lastWorkout)}>
        Repeat
      </button>
    </div>
  </div>`;

const WorkoutCanvas = ({
  workout,
  onAddExercise,
  onAddSet,
  onChangeSet,
  onDuplicateSet,
  onDeleteSet,
  onFinish,
  onStartRest,
  restTimers,
  onNote,
  history,
  onReplaceExercise,
  onSuperset,
  onReorder,
}) => {
  const [now, setNow] = useState(Date.now());
  const [paused, setPaused] = useState(false);
  const [pauseStart, setPauseStart] = useState(null);
  const [pausedMs, setPausedMs] = useState(workout.pausedMs || 0);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  const elapsedSec = useMemo(() => {
    if (!workout.startAt) return 0;
    const base = (workout.endAt || now) - workout.startAt - pausedMs;
    return Math.max(0, Math.floor(base / 1000));
  }, [workout.startAt, workout.endAt, now, pausedMs]);

  const togglePause = () => {
    if (paused) {
      const delta = Date.now() - pauseStart;
      setPausedMs((p) => p + delta);
      workout.pausedMs = (workout.pausedMs || 0) + delta;
      setPaused(false);
    } else {
      setPauseStart(Date.now());
      setPaused(true);
    }
  };

  const sortedExercises = [...workout.exercises].sort((a, b) => a.order - b.order);

  return html`<div class="workout-canvas">
    <div class="timer-bar">
      <div>
        <div class="muted">Workout timer</div>
        <div class="timer-value">${formatDuration(elapsedSec)}</div>
      </div>
      <div class="timer-actions">
        <button class="ghost" onClick={togglePause}>${paused ? "Resume" : "Pause"}</button>
        <button class="ghost" onClick={onFinish}>Finish</button>
        <button class="primary" onClick={onAddExercise}>+ Exercise</button>
      </div>
    </div>

    <div class="exercise-list-stack">
      ${sortedExercises.map((ex, idx) =>
        html`<${ExerciseCard}
          key=${ex.uid}
          exercise={ex}
          history={history}
          restRemaining=${restTimers[ex.uid] || 0}
          onAddSet={onAddSet}
          onChangeSet={onChangeSet}
          onDuplicateSet={onDuplicateSet}
          onDeleteSet={onDeleteSet}
          onStartRest={(exercise, delta = 90, relative = false) =>
            onStartRest(exercise.uid, delta, relative)
          }
          onNote={onNote}
          onReplace={() => onReplaceExercise(ex.uid)}
          onSuperset={() => onSuperset(ex.uid)}
          onMoveUp={() => onReorder(ex.uid, idx - 1)}
          onMoveDown={() => onReorder(ex.uid, idx + 1)}
        />`
      )}
    </div>

    <label class="field">
      <span class="field-label">Workout notes</span>
      <textarea
        value={workout.notes || ""}
        onInput={(e) => onNote(null, e.target.value)}
        placeholder="Fatigue, gym conditions, observations"
      />
    </label>
  </div>`;
};

const App = () => {
  const [state, setState] = useState(loadState);
  const [view, setView] = useState("home");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [restTimers, setRestTimers] = useState({});

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    const id = setInterval(() => {
      setRestTimers((prev) => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach((key) => {
          if (next[key] > 0) {
            next[key] -= 1;
            changed = true;
          } else {
            next[key] = 0;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const upsertWorkout = (fn) => {
    setState((prev) => ({ ...prev, currentWorkout: fn(prev.currentWorkout) }));
  };

  const appendHistory = (wk) => {
    setState((prev) => ({ ...prev, history: [wk, ...prev.history] }));
  };

  const startWorkout = (source, template, baseWorkout) => {
    const startAt = Date.now();
    const exercises = [];
    if (template) {
      template.exercises.forEach((item, idx) => {
        const exDef = findExerciseById(item.exerciseId) || item;
        const sets = Array.from({ length: item.sets }, (_, i) => ({
          id: uid("set"),
          weight: exDef.defaultWeight || 0,
          reps: item.reps,
          rpe: null,
          volume: volumeOfSet(exDef.defaultWeight || 0, item.reps),
        }));
        exercises.push({
          uid: uid("ex"),
          exerciseId: exDef.id,
          name: exDef.name,
          muscle: exDef.muscle,
          equipment: exDef.equipment,
          order: idx,
          sets,
        });
      });
    } else if (baseWorkout) {
      baseWorkout.exercises.forEach((ex, idx) => {
        exercises.push({
          ...ex,
          uid: uid("ex"),
          order: idx,
          sets: ex.sets.map((s) => ({
            ...s,
            id: uid("set"),
            volume: s.volume || volumeOfSet(s.weight, s.reps),
          })),
        });
      });
    }

    setState((prev) => ({
      ...prev,
      currentWorkout: {
        id: uid("wk"),
        source,
        startAt,
        status: "in_progress",
        notes: "",
        exercises,
      },
    }));
    setView("workout");
  };

  const handleAddExercise = (exerciseDef) => {
    if (!state.currentWorkout) return;
    upsertWorkout((wk) => {
      const prev = state.history.find((h) =>
        h.exercises.some((ex) => ex.exerciseId === exerciseDef.id)
      );
      const prevEx = prev?.exercises.find((ex) => ex.exerciseId === exerciseDef.id);
      const sets = prevEx
        ? prevEx.sets.map((s) => ({
            id: uid("set"),
            weight: s.weight,
            reps: s.reps,
            rpe: s.rpe,
            volume: s.volume || volumeOfSet(s.weight, s.reps),
          }))
        : [
            { id: uid("set"), weight: 0, reps: 8, rpe: null, volume: 0 },
            { id: uid("set"), weight: 0, reps: 8, rpe: null, volume: 0 },
            { id: uid("set"), weight: 0, reps: 8, rpe: null, volume: 0 },
          ];
      const order = wk.exercises.length;
      const nextExercises = [
        ...wk.exercises,
        {
          uid: uid("ex"),
          exerciseId: exerciseDef.id,
          name: exerciseDef.name,
          muscle: exerciseDef.muscle,
          equipment: exerciseDef.equipment,
          order,
          sets,
        },
      ];
      return { ...wk, exercises: nextExercises };
    });
  };

  const handleAddSet = (exerciseUid) => {
    upsertWorkout((wk) => {
      const ex = wk.exercises.find((e) => e.uid === exerciseUid);
      if (!ex) return wk;
      const last = ex.sets[ex.sets.length - 1];
      const nextSet = {
        id: uid("set"),
        weight: last?.weight || 0,
        reps: last?.reps || 8,
        rpe: last?.rpe || null,
        volume: volumeOfSet(last?.weight || 0, last?.reps || 0),
      };
      const nextExercises = wk.exercises.map((e) =>
        e.uid === exerciseUid
          ? { ...e, sets: recomputePR(e.exerciseId, [...e.sets, nextSet]) }
          : e
      );
      return { ...wk, exercises: nextExercises };
    });
  };

  const recomputePR = (exerciseId, sets) => {
    const best = bestStatsForExercise(exerciseId, state.history);
    let updated = false;
    let maxWeight = best.maxWeight;
    let maxVolume = best.maxVolume;
    return sets.map((s) => {
      const volume = volumeOfSet(s.weight, s.reps);
      const isWeightPR = s.weight > maxWeight;
      const isVolumePR = volume > maxVolume;
      if (isWeightPR) maxWeight = s.weight;
      if (isVolumePR) maxVolume = volume;
      const pr = isWeightPR || isVolumePR;
      if (pr) updated = true;
      return { ...s, volume, pr };
    });
  };

  const handleChangeSet = (exerciseUid, setId, nextSet) => {
    upsertWorkout((wk) => {
      const nextExercises = wk.exercises.map((ex) => {
        if (ex.uid !== exerciseUid) return ex;
        const sets = ex.sets.map((s) => (s.id === setId ? { ...s, ...nextSet } : s));
        const withPR = recomputePR(ex.exerciseId, sets);
        return { ...ex, sets: withPR };
      });
      return { ...wk, exercises: nextExercises };
    });
  };

  const handleDuplicateSet = (exerciseUid, set) => {
    upsertWorkout((wk) => {
      const nextExercises = wk.exercises.map((ex) => {
        if (ex.uid !== exerciseUid) return ex;
        const nextSet = { ...set, id: uid("set") };
        const sets = [...ex.sets, nextSet];
        const withPR = recomputePR(ex.exerciseId, sets);
        return { ...ex, sets: withPR };
      });
      return { ...wk, exercises: nextExercises };
    });
  };

  const handleDeleteSet = (exerciseUid, setId) => {
    upsertWorkout((wk) => {
      const nextExercises = wk.exercises.map((ex) => {
        if (ex.uid !== exerciseUid) return ex;
        const sets = ex.sets.filter((s) => s.id !== setId);
        const withPR = recomputePR(ex.exerciseId, sets);
        return { ...ex, sets: withPR };
      });
      return { ...wk, exercises: nextExercises };
    });
  };

  const handleFinish = () => {
    if (!state.currentWorkout) return;
    const completed = {
      ...state.currentWorkout,
      endAt: Date.now(),
      status: "completed",
    };
    appendHistory(completed);
    setState((prev) => ({ ...prev, currentWorkout: null }));
    setView("history");
  };

  const handleStartRest = (exerciseUid, delta = 90, relative = false) => {
    setRestTimers((prev) => {
      const current = prev[exerciseUid] || 0;
      const next = relative ? Math.max(0, current + delta) : delta;
      return { ...prev, [exerciseUid]: next };
    });
  };

  const handleNote = (exerciseUid, note) => {
    upsertWorkout((wk) => {
      if (!wk) return wk;
      if (exerciseUid === null) return { ...wk, notes: note };
      const nextExercises = wk.exercises.map((ex) =>
        ex.uid === exerciseUid ? { ...ex, notes: note } : ex
      );
      return { ...wk, exercises: nextExercises };
    });
  };

  const handleReplaceExercise = (exerciseUid) => {
    const current = state.currentWorkout;
    if (!current) return;
    const target = current.exercises.find((e) => e.uid === exerciseUid);
    if (!target) return;
    const candidates = sampleExercises.filter(
      (ex) => ex.muscle === target.muscle && ex.equipment === target.equipment && ex.id !== target.exerciseId
    );
    const replacement = candidates[0] || sampleExercises.find((ex) => ex.id !== target.exerciseId);
    if (!replacement) return;
    upsertWorkout((wk) => {
      const nextExercises = wk.exercises.map((ex) =>
        ex.uid === exerciseUid
          ? {
              ...ex,
              exerciseId: replacement.id,
              name: replacement.name,
              muscle: replacement.muscle,
              equipment: replacement.equipment,
            }
          : ex
      );
      return { ...wk, exercises: nextExercises };
    });
  };

  const handleSuperset = (exerciseUid) => {
    if (!state.currentWorkout) return;
    const other = state.currentWorkout.exercises.find((ex) => ex.uid !== exerciseUid);
    if (!other) return;
    const groupId = uid("ss");
    upsertWorkout((wk) => {
      const next = wk.exercises.map((ex) =>
        ex.uid === exerciseUid || ex.uid === other.uid ? { ...ex, supersetGroupId: groupId } : ex
      );
      return { ...wk, exercises: next };
    });
  };

  const handleReorder = (exerciseUid, newIndex) => {
    upsertWorkout((wk) => {
      const list = [...wk.exercises].sort((a, b) => a.order - b.order);
      const currentIndex = list.findIndex((ex) => ex.uid === exerciseUid);
      if (newIndex < 0 || newIndex >= list.length) return wk;
      const [moved] = list.splice(currentIndex, 1);
      list.splice(newIndex, 0, moved);
      const next = list.map((ex, idx) => ({ ...ex, order: idx }));
      return { ...wk, exercises: next };
    });
  };

  const handleRepeat = (wk) => {
    startWorkout("repeat", null, wk);
  };

  const handleAIStart = () => {
    const fatigue = Math.random();
    const template = fatigue > 0.5 ? sampleTemplates[0] : sampleTemplates[1];
    startWorkout("ai", template);
  };

  const lastWorkout = state.history[0];

  const recentExercises = state.history
    .flatMap((wk) => wk.exercises)
    .slice(0, 6)
    .map((ex) => ({ name: ex.name, id: ex.exerciseId, muscle: ex.muscle, equipment: ex.equipment }));

  return html`<div class="shell">
    <header class="app-header">
      <div class="brand">VPULZ</div>
      <${TabNav} view={view} onChange={setView} />
      <div class="muted">Premium black/white experience</div>
    </header>

    ${view === "home"
      ? html`<div class="grid">
          <${SectionCard}
            title="Start a workout"
            children=${html`<${QuickStartPanel}
              onStart={(src) => startWorkout(src)}
              onAIStart={handleAIStart}
              onRepeat={handleRepeat}
              lastWorkout={lastWorkout}
            />`}
          />
          <${SectionCard}
            title="Templates"
            children=${html`<${TemplateBlock} onStart={(t) => startWorkout("template", t)} />`}
          />
          <${SectionCard}
            title="Stats"
            children=${html`<${StatsBlock} history={state.history} />`}
          />
          <${SectionCard}
            title="Progress"
            children=${html`<${ProgressBlock} history={state.history} />`}
          />
        </div>`
      : null}

    ${view === "workout"
      ? state.currentWorkout
        ? html`<${WorkoutCanvas}
            workout={state.currentWorkout}
            history={state.history}
            restTimers={restTimers}
            onAddExercise={() => setPickerOpen(true)}
            onAddSet={handleAddSet}
            onChangeSet={handleChangeSet}
            onDuplicateSet={handleDuplicateSet}
            onDeleteSet={handleDeleteSet}
            onFinish={handleFinish}
            onStartRest={handleStartRest}
            onNote={handleNote}
            onReplaceExercise={handleReplaceExercise}
            onSuperset={handleSuperset}
            onReorder={handleReorder}
          />`
        : html`<div class="empty">No active workout. Start one from Home.</div>`
      : null}

    ${view === "history"
      ? html`<div class="grid">
          <${SectionCard}
            title="History"
            children=${html`<${HistoryList} history={state.history} onRepeat={handleRepeat} />`}
          />
          ${state.history.length
            ? html`<${SectionCard}
                title="Last summary"
                children=${html`<${SummaryCard}
                  workout={state.history[0]}
                  onDuplicate={() => handleRepeat(state.history[0])}
                />`}
              />`
            : null}
        </div>`
      : null}

    ${view === "progress"
      ? html`<div class="grid">
          <${SectionCard}
            title="Progress"
            children=${html`<${ProgressBlock} history={state.history} />`}
          />
          <${SectionCard}
            title="Training stats"
            children=${html`<${StatsBlock} history={state.history} />`}
          />
        </div>`
      : null}

    ${view === "templates"
      ? html`<div class="grid">
          <${SectionCard}
            title="Templates"
            children=${html`<${TemplateBlock} onStart={(t) => startWorkout("template", t)} />`}
          />
        </div>`
      : null}

    <${ExercisePicker}
      open={pickerOpen}
      onClose={() => setPickerOpen(false)}
      recent={recentExercises}
      onSelect={(ex) => {
        handleAddExercise(ex);
        setPickerOpen(false);
      }}
      onCreateCustom={(custom) => sampleExercises.push(custom)}
    />
  </div>`;
};

render(html`<${App} />`, document.getElementById("app"));
