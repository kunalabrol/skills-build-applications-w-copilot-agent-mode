import { CapabilityCard } from './CapabilityCard.js';

type Workout = { title: string; focus?: string; minutes?: number; difficulty?: string; reason?: string };
type WorkoutResponse = { suggestions: Workout[] };

export default function Workouts() {
  return (
    <CapabilityCard<WorkoutResponse>
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      path={`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`}
      emptyMessage="No workout suggestions available."
      isEmpty={({ suggestions }) => suggestions.length === 0}
      renderData={({ suggestions }) => (
        <ul className="list-group list-group-flush">
          {suggestions.map(({ title, focus, minutes, difficulty, reason }, index) => (
            <li className="list-group-item" key={`${title}-${index}`}>
              <strong>{title}</strong>
              {focus && <span> - {focus}</span>}
              {minutes !== undefined && <span> - {minutes} minutes</span>}
              {difficulty && <span> - {difficulty}</span>}
              {reason && <p className="mb-0">{reason}</p>}
            </li>
          ))}
        </ul>
      )}
    />
  );
}
