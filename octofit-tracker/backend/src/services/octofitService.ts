import { Activity, Team, User, Workout } from '../models/index.js';

type HttpError = Error & { status: number };

function httpError(status: number, message: string): HttpError {
  return Object.assign(new Error(message), { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredText(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw httpError(400, `${field} is required`);
  }
  return value.trim();
}

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
}

function focusForActivity(type: string): string {
  switch (type.trim().toLowerCase()) {
    case 'run':
    case 'cycle':
    case 'walk':
      return 'endurance';
    case 'strength':
      return 'strength';
    default:
      return type.trim().toLowerCase();
  }
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Activity details are required');

  const userId = input.userId;
  const teamId = input.teamId;
  if (!isObjectId(userId) || !isObjectId(teamId)) {
    throw httpError(400, 'Valid userId and teamId are required');
  }

  const type = requiredText(input.type, 'type');
  const minutes = input.minutes;
  if (typeof minutes !== 'number' || !Number.isInteger(minutes) || minutes < 1) {
    throw httpError(400, 'minutes must be a positive whole number');
  }

  const [user, team] = await Promise.all([
    User.findById(userId).select('_id').lean(),
    Team.findById(teamId).select('_id').lean(),
  ]);
  if (!user || !team) throw httpError(404, 'User or team not found');

  return Activity.create({
    user: user._id,
    team: team._id,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Team details are required');

  const name = requiredText(input.name, 'name');
  const mascot = requiredText(input.mascot, 'mascot');
  const providedMembers = input.members === undefined ? [] : input.members;
  if (!Array.isArray(providedMembers) || !providedMembers.every(isObjectId)) {
    throw httpError(400, 'members must be an array of valid user IDs');
  }

  const memberIds = [...new Set(providedMembers)];
  if (memberIds.length > 0) {
    const existingUsers = await User.find({ _id: { $in: memberIds } }).select('_id').lean();
    if (existingUsers.length !== memberIds.length) {
      throw httpError(400, 'members must reference existing users');
    }
  }

  return Team.create({ name, mascot, members: memberIds });
}

export async function getLeaderboard() {
  const teams = await Team.aggregate<{ teamName: string; totalPoints: number }>([
    {
      $lookup: {
        from: Activity.collection.name,
        let: { teamId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$team', '$$teamId'] } } },
          { $group: { _id: null, totalPoints: { $sum: '$points' } } },
        ],
        as: 'activityTotals',
      },
    },
    {
      $project: {
        _id: 0,
        teamName: '$name',
        totalPoints: { $ifNull: [{ $arrayElemAt: ['$activityTotals.totalPoints', 0] }, 0] },
      },
    },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return teams.map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const email = requiredText(userEmail, 'userEmail').toLowerCase();
  const user = await User.findOne({ email }).lean();
  if (!user) throw httpError(404, 'User not found');

  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1, _id: -1 }).limit(10).select('type').lean(),
    Workout.find().sort({ title: 1 }).lean(),
  ]);

  const recentFocuses = [...new Set(activities.map(({ type }) => focusForActivity(type)))];
  const candidateFocuses = [user.fitnessGoal.trim().toLowerCase(), ...recentFocuses];
  const selectedFocus = candidateFocuses.find((focus) =>
    workouts.some((workout) => workout.focus.trim().toLowerCase() === focus),
  );
  if (!selectedFocus) return [];

  const reason = selectedFocus === user.fitnessGoal.trim().toLowerCase()
    ? `Recommended to support your ${user.fitnessGoal} fitness goal.`
    : `Recommended based on your recent ${activities.find(({ type }) => focusForActivity(type) === selectedFocus)?.type} activity.`;

  return workouts
    .filter((workout) => workout.focus.trim().toLowerCase() === selectedFocus)
    .map((workout) => ({ ...workout, reason }));
}

export { User };
