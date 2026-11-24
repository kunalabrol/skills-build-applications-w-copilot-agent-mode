import { CapabilityCard } from './CapabilityCard.js';

type Team = { _id?: string; name: string; mascot?: string; members?: unknown[] };
type TeamResponse = { teams: Team[] };

export default function Teams() {
  return (
    <CapabilityCard<TeamResponse>
      title="Teams"
      description="Manage teams and members."
      path="/api/teams"
      emptyMessage="No teams yet."
      isEmpty={({ teams }) => teams.length === 0}
      renderData={({ teams }) => (
        <ul className="list-group list-group-flush">
          {teams.map((team, index) => (
            <li className="list-group-item" key={team._id ?? `${team.name}-${index}`}>
              <strong>{team.name}</strong>
              {team.mascot && <span> - {team.mascot}</span>}
              <span> - {team.members?.length ?? 0} members</span>
            </li>
          ))}
        </ul>
      )}
    />
  );
}
