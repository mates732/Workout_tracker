import WorkoutScreen from '../../screens/WorkoutScreen';
import { useWorkoutFlow } from '../../shared/state/WorkoutFlowContext';

export default function ActiveWorkoutScreen() {
const { currentWorkout } = useWorkoutFlow();

// 🔥 DOČASNĚ: vždy zobraz WorkoutScreen (abychom mohli vyvíjet UI)
if (!currentWorkout) {
return <WorkoutScreen />;
}

return <WorkoutScreen />;
}
