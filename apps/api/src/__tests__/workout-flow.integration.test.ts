import { randomUUID } from 'crypto';
import { AppDataSource } from '../database/data-source';
import { User, UserRole } from '../database/entities/User';
import { ClientCoachRelationship, RelationshipStatus } from '../database/entities/ClientCoachRelationship';
import { Exercise } from '../database/entities/Exercise';
import { WorkoutPlan } from '../database/entities/WorkoutPlan';
import { WorkoutAssignment } from '../database/entities/WorkoutAssignment';
import { WorkoutCompletion } from '../database/entities/WorkoutCompletion';
import { WorkoutsService } from '../services/workouts.service';

const describeDatabase = process.env.RUN_DB_TESTS === 'true' ? describe : describe.skip;

describeDatabase('workout flow', () => {
  const coachId = randomUUID();
  const otherCoachId = randomUUID();
  const clientId = randomUUID();
  const otherClientId = randomUUID();

  beforeAll(async () => {
    await AppDataSource.initialize();
    await AppDataSource.runMigrations({ transaction: 'each' });

    await AppDataSource.getRepository(User).insert([
      user(coachId, UserRole.COACH),
      user(otherCoachId, UserRole.COACH),
      user(clientId, UserRole.CLIENT),
      user(otherClientId, UserRole.CLIENT),
    ]);
    await AppDataSource.getRepository(ClientCoachRelationship).insert({
      coachId,
      clientId,
      status: RelationshipStatus.ACTIVE,
      startedAt: new Date(),
    });
  });

  afterAll(async () => {
    if (!AppDataSource.isInitialized) return;
    await AppDataSource.getRepository(User).delete([coachId, otherCoachId, clientId, otherClientId]);
    await AppDataSource.destroy();
  });

  it('keeps assigned actions immutable and completion retries idempotent', async () => {
    const service = new WorkoutsService();
    const exercise = await service.createExercise(coachId, {
      name: 'Goblet squat',
      muscleGroup: 'Legs',
      description: 'Original instructions',
    });
    const plan = await service.createPlan(coachId, {
      name: 'Tuesday strength',
      items: [{ exerciseId: exercise.id, dayOfWeek: 2, order: 1 }],
    });
    const assignment = await service.assignPlan(coachId, {
      planId: plan.id,
      clientId,
      timezone: 'America/Chicago',
      startsOn: '2026-09-08',
    });

    await service.updateExercise(coachId, exercise.id, { name: 'Renamed squat' });
    await service.updatePlan(coachId, plan.id, {
      name: 'Changed template',
      items: [{ exerciseId: exercise.id, dayOfWeek: 3, order: 1 }],
    });

    const today = await service.getToday(clientId, '2026-09-08');
    expect(today).toMatchObject({ status: 'active', planName: 'Tuesday strength', total: 1 });
    expect(today.actions[0]).toMatchObject({ name: 'Goblet squat', description: 'Original instructions' });

    const completion = {
      assignmentId: assignment.id,
      actionId: assignment.actions[0].actionId,
      localDate: '2026-09-08',
      completed: true,
    };
    await service.setCompletion(clientId, completion);
    await service.setCompletion(clientId, completion);

    expect(await AppDataSource.getRepository(WorkoutCompletion).countBy({
      assignmentId: assignment.id,
      actionId: completion.actionId,
      localDate: completion.localDate,
    })).toBe(1);
    await expect(service.setCompletion(otherClientId, completion)).rejects.toThrow('Active workout assignment not found');
  });

  it('allows only the active coach to assign and inspect adherence', async () => {
    const exercise = await AppDataSource.getRepository(Exercise).findOneByOrFail({ coachId });
    const plan = await AppDataSource.getRepository(WorkoutPlan).findOneByOrFail({ coachId });
    const service = new WorkoutsService();

    await expect(service.assignPlan(otherCoachId, {
      planId: plan.id,
      clientId,
      timezone: 'America/Chicago',
      startsOn: '2026-09-08',
    })).rejects.toThrow('Workout plan not found');
    await expect(service.getClientAdherence(otherCoachId, clientId, '2026-09-08', '2026-09-08'))
      .rejects.toThrow('Client not found');
    expect(exercise.coachId).toBe(coachId);
  });
});

function user(id: string, role: UserRole): Partial<User> {
  return {
    id,
    email: `${id}@example.test`,
    username: `u_${id.replace(/-/g, '')}`,
    password: '$2a$12$abcdefghijklmnopqrstuuuuuuuuuuuuuuuuuuuuuuuuuuuuu',
    firstName: role === UserRole.COACH ? 'Coach' : 'Client',
    lastName: 'Test',
    role,
    isActive: true,
    isEmailVerified: true,
    hasCompletedOnboarding: true,
  };
}
