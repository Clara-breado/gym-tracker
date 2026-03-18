import { useState } from 'react';
import ApiKeyPrompt from './components/ApiKeyPrompt';
import Dashboard from './components/Dashboard';
import PreWorkoutModal from './components/PreWorkoutModal';
import ActiveWorkout from './components/ActiveWorkout';
import AiAssistant from './components/AiAssistant';

export default function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('apiKey') || '');
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedBodyPart, setSelectedBodyPart] = useState(null);
  const [showPreWorkout, setShowPreWorkout] = useState(false);
  const [workoutPlan, setWorkoutPlan] = useState(null);

  if (!apiKey) {
    return <ApiKeyPrompt onSave={(key) => { localStorage.setItem('apiKey', key); setApiKey(key); }} />;
  }

  const handleSelectBodyPart = (bodyPart) => {
    setSelectedBodyPart(bodyPart);
    setShowPreWorkout(true);
  };

  const handlePlanGenerated = (plan) => {
    setWorkoutPlan(plan);
    setShowPreWorkout(false);
    setCurrentView('workout');
  };

  const handleFinishWorkout = () => {
    setWorkoutPlan(null);
    setSelectedBodyPart(null);
    setCurrentView('dashboard');
  };

  const handleUpdatePlan = (originalExerciseName, newExercise) => {
    setWorkoutPlan((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        workout_plan: prev.workout_plan.map((ex) =>
          ex.exercise_name === originalExerciseName ? newExercise : ex
        ),
      };
    });
  };

  return (
    <div className="min-h-dvh bg-[#0f0f1a]">
      {currentView === 'dashboard' && (
        <Dashboard onSelectBodyPart={handleSelectBodyPart} />
      )}
      {currentView === 'workout' && workoutPlan && (
        <ActiveWorkout
          plan={workoutPlan}
          bodyPart={selectedBodyPart}
          onFinish={handleFinishWorkout}
        />
      )}
      {showPreWorkout && selectedBodyPart && (
        <PreWorkoutModal
          bodyPart={selectedBodyPart}
          onClose={() => setShowPreWorkout(false)}
          onPlanGenerated={handlePlanGenerated}
        />
      )}
      <AiAssistant
        workoutPlan={workoutPlan}
        onUpdatePlan={handleUpdatePlan}
        currentView={currentView}
        selectedBodyPart={selectedBodyPart}
      />
    </div>
  );
}
