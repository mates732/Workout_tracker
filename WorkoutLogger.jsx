import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, Plus, X, MoreVertical, Check, Trash2, Play, Pause, Clock } from 'lucide-react';

const EXERCISES_LIBRARY = [
  { id: 1, name: 'Squat', muscle: 'Legs' },
  { id: 2, name: 'Deadlift', muscle: 'Back' },
  { id: 3, name: 'Deadlift (Trap Bar)', muscle: 'Back' },
  { id: 4, name: 'Bench Press', muscle: 'Chest' },
  { id: 5, name: 'Overhead Press', muscle: 'Shoulders' },
  { id: 6, name: 'Pull-Up', muscle: 'Back' },
  { id: 7, name: 'Barbell Row', muscle: 'Back' },
  { id: 8, name: 'Romanian Deadlift', muscle: 'Back' },
  { id: 9, name: 'Leg Press', muscle: 'Legs' },
  { id: 10, name: 'Bulgarian Split Squat', muscle: 'Legs' },
  { id: 11, name: 'Hip Thrust', muscle: 'Glutes' },
  { id: 12, name: 'Incline Bench Press', muscle: 'Chest' },
  { id: 13, name: 'Cable Row', muscle: 'Back' },
  { id: 14, name: 'Lat Pulldown', muscle: 'Back' },
  { id: 15, name: 'Dumbbell Curl', muscle: 'Arms' },
  { id: 16, name: 'Tricep Pushdown', muscle: 'Arms' },
  { id: 17, name: 'Lateral Raise', muscle: 'Shoulders' },
  { id: 18, name: 'Face Pull', muscle: 'Shoulders' },
  { id: 19, name: 'Calf Raise', muscle: 'Legs' },
  { id: 20, name: 'Plank', muscle: 'Core' },
];

const SET_TYPES = [
  { id: 'normal', label: '1', tag: 'Normal' },
  { id: 'warmup', label: 'W', tag: 'Warmup' },
  { id: 'dropset', label: 'D', tag: 'Drop Set' },
  { id: 'failure', label: 'F', tag: 'Failure' },
];

export default function WorkoutLogger() {
  // Workout state
  const [startTime] = useState(new Date());
  const [exercises, setExercises] = useState([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // UI state
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showExerciseMenu, setShowExerciseMenu] = useState(null);
  const [showSetTypeMenu, setShowSetTypeMenu] = useState(null);
  const [showTimerBubble, setShowTimerBubble] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [timerLaps, setTimerLaps] = useState([]);
  const [timerRunning, setTimerRunning] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Swipe state
  const [swipingSet, setSwipingSet] = useState(null);
  const swipeStartX = useRef(0);

  // Main timer (workout elapsed time)
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setElapsedSeconds(e => e + 1);
      setTimerSeconds(e => e + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}m ${s}s`;
    }
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Add exercise from picker
  const handleAddExercise = (exercise) => {
    const newExercise = {
      id: `ex-${Date.now()}`,
      libraryId: exercise.id,
      name: exercise.name,
      notes: '',
      restTimer: null,
      sets: [
        {
          id: `set-${Date.now()}`,
          kg: null,
          reps: null,
          completed: false,
          type: 'normal',
          previous: null,
        },
      ],
    };
    setExercises([...exercises, newExercise]);
    setShowExercisePicker(false);
  };

  // Update set
  const handleSetChange = (exId, setId, field, value) => {
    setExercises(exercises.map(ex => {
      if (ex.id !== exId) return ex;
      return {
        ...ex,
        sets: ex.sets.map(s => {
          if (s.id !== setId) return s;
          return { ...s, [field]: field === 'kg' || field === 'reps' ? (value ? Number(value) : null) : value };
        }),
      };
    }));
  };

  // Add set to exercise
  const handleAddSet = (exId) => {
    setExercises(exercises.map(ex => {
      if (ex.id !== exId) return ex;
      const lastSet = ex.sets[ex.sets.length - 1];
      return {
        ...ex,
        sets: [
          ...ex.sets,
          {
            id: `set-${Date.now()}`,
            kg: null,
            reps: null,
            completed: false,
            type: 'normal',
            previous: null,
          },
        ],
      };
    }));
  };

  // Remove set
  const handleRemoveSet = (exId, setId) => {
    setExercises(exercises.map(ex => {
      if (ex.id !== exId) return ex;
      return {
        ...ex,
        sets: ex.sets.filter(s => s.id !== setId),
      };
    }));
    setSwipingSet(null);
  };

  // Remove exercise
  const handleRemoveExercise = (exId) => {
    setExercises(exercises.filter(ex => ex.id !== exId));
    setShowExerciseMenu(null);
  };

  // Update rest timer
  const handleToggleRestTimer = (exId) => {
    setExercises(exercises.map(ex => {
      if (ex.id !== exId) return ex;
      const timers = [null, 60, 90, 120];
      const currentIndex = timers.indexOf(ex.restTimer);
      const nextTimer = timers[(currentIndex + 1) % timers.length];
      return { ...ex, restTimer: nextTimer };
    }));
  };

  // Swipe handlers
  const handleSetPointerDown = (e, setId) => {
    if (e.pointerType === 'touch') {
      swipeStartX.current = e.clientX;
    }
  };

  const handleSetPointerMove = (e, setId) => {
    if (!swipeStartX.current) return;
    const delta = e.clientX - swipeStartX.current;
    if (delta < -50) {
      setSwipingSet(setId);
      swipeStartX.current = 0;
    }
  };

  const handleSetPointerUp = () => {
    swipeStartX.current = 0;
  };

  const handleSwipeBack = () => {
    setSwipingSet(null);
  };

  return (
    <div style={{
      background: 'linear-gradient(155deg, #0A0A0A 0%, #1B1212 55%, #0F0F0F 100%)',
      minHeight: '100vh',
      color: '#F9F6EE',
      fontFamily: '-apple-system, "SF Pro Display", sans-serif',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Top Bar */}
      <div style={{
        background: 'rgba(10,10,10,0.94)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        {/* Left: Minimize */}
        <button style={{
          background: 'transparent',
          border: 'none',
          color: '#F9F6EE',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <ChevronDown size={16} />
          Log
        </button>

        {/* Center: Compact Timer */}
        <button
          onClick={() => setShowTimerBubble(!showTimerBubble)}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#F9F6EE',
            cursor: 'pointer',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 600,
            transition: 'all 150ms',
          }}
        >
          {formatTime(elapsedSeconds)}
        </button>

        {/* Right: Finish */}
        <button
          onClick={() => setShowFinishConfirm(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#F9F6EE',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          Finish
        </button>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '24px 16px',
        maxWidth: '430px',
        margin: '0 auto',
        width: '100%',
      }}>
        {exercises.length === 0 ? (
          // Empty State
          <div style={{
            height: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <button
              onClick={() => setShowExercisePicker(true)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '2px solid rgba(255,255,255,0.2)',
                color: '#F9F6EE',
                cursor: 'pointer',
                padding: '16px 32px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 150ms',
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
            >
              <Plus size={20} />
              Add Exercise
            </button>
          </div>
        ) : (
          // Exercise Cards
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {exercises.map((exercise) => (
              <div
                key={exercise.id}
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                  overflow: 'hidden',
                }}
              >
                {/* Exercise Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px',
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}>
                    {exercise.name[0]}
                  </div>

                  {/* Name */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#F9F6EE',
                      cursor: 'pointer',
                    }}>
                      {exercise.name}
                    </div>
                  </div>

                  {/* Menu */}
                  <button
                    onClick={() => setShowExerciseMenu(showExerciseMenu === exercise.id ? null : exercise.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(249,246,238,0.5)',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>

                {/* Sub-header: Notes & Rest Timer */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '16px',
                  fontSize: '13px',
                }}>
                  <input
                    type="text"
                    placeholder="Add notes here…"
                    defaultValue={exercise.notes}
                    style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#F9F6EE',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  />
                  <button
                    onClick={() => handleToggleRestTimer(exercise.id)}
                    style={{
                      background: exercise.restTimer
                        ? 'rgba(175,225,175,0.2)'
                        : 'rgba(255,255,255,0.05)',
                      border: '1px solid ' + (exercise.restTimer
                        ? 'rgba(175,225,175,0.3)'
                        : 'rgba(255,255,255,0.1)'),
                      color: exercise.restTimer ? '#AFE1AF' : 'rgba(249,246,238,0.5)',
                      cursor: 'pointer',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {exercise.restTimer ? `${exercise.restTimer}s` : 'Rest'}
                  </button>
                </div>

                {/* Sets Table */}
                <div style={{ marginBottom: '12px' }}>
                  {/* Header Row */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '36px 1fr 68px 52px 36px',
                    gap: '8px',
                    marginBottom: '8px',
                    fontSize: '9px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: 'rgba(249,246,238,0.25)',
                    paddingBottom: '6px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <div>Set</div>
                    <div>Prev</div>
                    <div>Kg</div>
                    <div>Reps</div>
                    <div>✓</div>
                  </div>

                  {/* Set Rows */}
                  {exercise.sets.map((set, idx) => {
                    const isCompleted = set.completed;
                    const isLocked = isCompleted;
                    const isSwiping = swipingSet === set.id;

                    return (
                      <div
                        key={set.id}
                        onPointerDown={(e) => handleSetPointerDown(e, set.id)}
                        onPointerMove={(e) => handleSetPointerMove(e, set.id)}
                        onPointerUp={handleSetPointerUp}
                        style={{
                          position: 'relative',
                          overflow: 'hidden',
                          marginBottom: '8px',
                          borderRadius: '6px',
                        }}
                      >
                        {/* Swipe Delete Background */}
                        {isSwiping && (
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            bottom: 0,
                            background: '#E05A3A',
                            display: 'flex',
                            alignItems: 'center',
                            paddingRight: '12px',
                            animation: 'slideIn 200ms ease',
                            zIndex: 1,
                          }}>
                            <Trash2 size={16} color="white" />
                          </div>
                        )}

                        {/* Main Row */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '36px 1fr 68px 52px 36px',
                          gap: '8px',
                          padding: '8px',
                          background: isCompleted ? '#AFE1AF' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${isCompleted ? 'rgba(175,225,175,0.3)' : 'rgba(255,255,255,0.1)'}`,
                          borderRadius: '6px',
                          alignItems: 'center',
                          transition: 'all 250ms',
                          position: 'relative',
                          zIndex: 2,
                          cursor: isSwiping ? 'pointer' : 'default',
                        }}>
                          {/* Set Number */}
                          <button
                            onClick={() => !isLocked && setShowSetTypeMenu(showSetTypeMenu === set.id ? null : set.id)}
                            disabled={isLocked}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: isCompleted ? '#1B1212' : '#F9F6EE',
                              cursor: isLocked ? 'default' : 'pointer',
                              fontSize: '13px',
                              fontWeight: 700,
                              opacity: isLocked ? 0.7 : 1,
                            }}
                          >
                            {SET_TYPES.find(t => t.id === set.type)?.label || set.type}
                          </button>

                          {/* Previous (empty for now) */}
                          <div style={{
                            color: 'rgba(249,246,238,0.25)',
                            fontSize: '12px',
                          }} />

                          {/* KG Input */}
                          <input
                            type="number"
                            placeholder="0"
                            value={set.kg ?? ''}
                            onChange={(e) => handleSetChange(exercise.id, set.id, 'kg', e.target.value)}
                            disabled={isLocked}
                            style={{
                              background: isCompleted ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)',
                              border: `1px solid ${isCompleted ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)'}`,
                              color: isCompleted ? '#1B1212' : '#F9F6EE',
                              padding: '6px 6px',
                              borderRadius: '4px',
                              fontSize: '13px',
                              fontWeight: 700,
                              textAlign: 'center',
                              cursor: isLocked ? 'default' : 'text',
                              opacity: isLocked ? 0.7 : 1,
                            }}
                            inputMode="decimal"
                          />

                          {/* REPS Input */}
                          <input
                            type="number"
                            placeholder="0"
                            value={set.reps ?? ''}
                            onChange={(e) => handleSetChange(exercise.id, set.id, 'reps', e.target.value)}
                            disabled={isLocked}
                            style={{
                              background: isCompleted ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)',
                              border: `1px solid ${isCompleted ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)'}`,
                              color: isCompleted ? '#1B1212' : '#F9F6EE',
                              padding: '6px 6px',
                              borderRadius: '4px',
                              fontSize: '13px',
                              fontWeight: 700,
                              textAlign: 'center',
                              cursor: isLocked ? 'default' : 'text',
                              opacity: isLocked ? 0.7 : 1,
                            }}
                            inputMode="numeric"
                          />

                          {/* Checkmark */}
                          <button
                            onClick={() => handleSetChange(exercise.id, set.id, 'completed', !isCompleted)}
                            style={{
                              background: isCompleted ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.1)',
                              border: `2px solid ${isCompleted ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'}`,
                              color: isCompleted ? '#1B1212' : 'rgba(249,246,238,0.5)',
                              cursor: 'pointer',
                              width: '32px',
                              height: '32px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 250ms',
                            }}
                          >
                            <Check size={16} />
                          </button>
                        </div>

                        {/* Delete Swipe Action */}
                        {isSwiping && (
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            bottom: 0,
                            width: '80px',
                            background: '#E05A3A',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 3,
                          }}>
                            <button
                              onClick={() => handleRemoveSet(exercise.id, set.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer',
                                padding: '8px',
                              }}
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add Set Button */}
                <button
                  onClick={() => handleAddSet(exercise.id)}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'rgba(249,246,238,0.7)',
                    cursor: 'pointer',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 150ms',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255,255,255,0.12)';
                    e.target.style.color = '#F9F6EE';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255,255,255,0.08)';
                    e.target.style.color = 'rgba(249,246,238,0.7)';
                  }}
                >
                  <Plus size={14} />
                  Add Set
                </button>
              </div>
            ))}

            {/* Add Exercise Button */}
            <button
              onClick={() => setShowExercisePicker(true)}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px dashed rgba(255,255,255,0.2)',
                color: 'rgba(249,246,238,0.6)',
                cursor: 'pointer',
                padding: '14px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '8px',
              }}
            >
              <Plus size={16} />
              Add Exercise
            </button>
          </div>
        )}
      </div>

      {/* Exercise Picker Bottom Sheet */}
      {showExercisePicker && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(5px)',
          zIndex: 100,
        }} onClick={() => setShowExercisePicker(false)}>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: '#1B1212',
              borderRadius: '16px 16px 0 0',
              maxHeight: '85vh',
              overflow: 'auto',
              padding: '20px 16px 32px',
              animation: 'slideUp 300ms cubic-bezier(.32,1,.56,1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              fontSize: '16px',
              fontWeight: 700,
              marginBottom: '16px',
            }}>
              Select Exercise
            </div>
            <input
              type="text"
              placeholder="Search exercises…"
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#F9F6EE',
                padding: '10px 12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {EXERCISES_LIBRARY.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => handleAddExercise(ex)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#F9F6EE',
                    cursor: 'pointer',
                    padding: '12px',
                    borderRadius: '8px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 150ms',
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}>
                    {ex.name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{ex.name}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(249,246,238,0.5)' }}>
                      {ex.muscle}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stopwatch Bubble */}
      {showTimerBubble && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(5px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }} onClick={() => setShowTimerBubble(false)}>
          <div
            style={{
              background: '#1B1212',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '300px',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              fontSize: '48px',
              fontWeight: 200,
              fontVariantNumeric: 'tabular-nums',
              marginBottom: '24px',
              letterSpacing: '2px',
            }}>
              {formatTimer(timerSeconds)}
            </div>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
            }}>
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                style={{
                  background: timerRunning ? '#E05A3A' : '#AFE1AF',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                {timerRunning ? 'Pause' : 'Start'}
              </button>
              <button
                onClick={() => setShowTimerBubble(false)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#F9F6EE',
                  cursor: 'pointer',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finish Confirm Dialog */}
      {showFinishConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(5px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#1B1212',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '300px',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '18px',
              fontWeight: 700,
              marginBottom: '12px',
            }}>
              Finish Workout?
            </div>
            <div style={{
              fontSize: '14px',
              color: 'rgba(249,246,238,0.7)',
              marginBottom: '24px',
            }}>
              Total time: {formatTime(elapsedSeconds)}
            </div>
            <div style={{
              display: 'flex',
              gap: '12px',
            }}>
              <button
                onClick={() => setShowFinishConfirm(false)}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#F9F6EE',
                  cursor: 'pointer',
                  padding: '10px',
                  borderRadius: '6px',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // TODO: Save workout to backend
                  setShowFinishConfirm(false);
                  setExercises([]);
                }}
                style={{
                  flex: 1,
                  background: '#AFE1AF',
                  border: 'none',
                  color: '#1B1212',
                  cursor: 'pointer',
                  padding: '10px',
                  borderRadius: '6px',
                  fontWeight: 600,
                }}
              >
                Finish
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
