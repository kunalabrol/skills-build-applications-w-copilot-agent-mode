import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  return (
    <CapabilityCard<LeaderboardResponse>
      title="Leaderboard"
      description="Compare team point totals."
      path="/api/leaderboard"
      emptyMessage="No leaderboard rankings yet."
      isEmpty={({ leaderboard }) => leaderboard.length === 0}
      renderData={({ leaderboard }) => (
        <ol className="list-group">
          {leaderboard.map(({ teamName, totalPoints, rank }) => (
            <li className="list-group-item d-flex justify-content-between" key={`${rank}-${teamName}`}>
              <span>Rank {rank}: {teamName}</span>
              <span>{totalPoints} points</span>
            </li>
          ))}
        </ol>
      )}
    />
  );
}
