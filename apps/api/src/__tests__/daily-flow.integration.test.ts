import { randomUUID } from 'crypto';
import { AppDataSource } from '../database/data-source';
import { ClientCoachRelationship, RelationshipStatus } from '../database/entities/ClientCoachRelationship';
import { CoachingMessage } from '../database/entities/CoachingMessage';
import { MealCompletion } from '../database/entities/MealCompletion';
import { User, UserRole } from '../database/entities/User';
import { DailyService } from '../services/daily.service';

const describeDatabase = process.env.RUN_DB_TESTS === 'true' ? describe : describe.skip;

describeDatabase('daily pilot flow', () => {
  const coachId = randomUUID();
  const clientId = randomUUID();
  let relationshipId = '';

  beforeAll(async () => {
    await AppDataSource.initialize();
    await AppDataSource.runMigrations();
    await AppDataSource.getRepository(User).insert([user(coachId, UserRole.COACH), user(clientId, UserRole.CLIENT)]);
    const result = await AppDataSource.getRepository(ClientCoachRelationship).insert({ coachId, clientId, status: RelationshipStatus.ACTIVE, startedAt: new Date() });
    relationshipId = result.identifiers[0].id;
  });

  afterAll(async () => {
    if (!AppDataSource.isInitialized) return;
    await AppDataSource.getRepository(User).delete([coachId, clientId]);
    await AppDataSource.destroy();
  });

  it('tracks meals and water idempotently in the aggregated Today response', async () => {
    const service = new DailyService();
    const plan = await service.createNutritionPlan(coachId, {
      name: 'Daily fuel',
      waterTargetMl: 250,
      items: [{ dayOfWeek: 2, order: 0, mealType: 'breakfast', name: 'Oats', calories: 400 }],
    });
    const assignment = await service.assignNutritionPlan(coachId, { planId: plan.id, clientId, timezone: 'America/Chicago', startsOn: '2026-09-08' });
    const completion = { assignmentId: assignment.id, mealId: assignment.items[0].mealId, localDate: '2026-09-08', completed: true };
    await service.setMealCompletion(clientId, completion);
    await service.setMealCompletion(clientId, completion);
    await service.setWater(clientId, { localDate: '2026-09-08', amountMl: 250 });

    expect(await AppDataSource.getRepository(MealCompletion).countBy({ assignmentId: assignment.id, mealId: completion.mealId, localDate: completion.localDate })).toBe(1);
    const today = await service.getToday(clientId, '2026-09-08');
    expect(today.nutrition).toMatchObject({ status: 'completed', completed: 1, total: 1, water: { amountMl: 250, targetMl: 250 } });
    expect(today.progress).toMatchObject({ completed: 2, total: 2, percentage: 100 });
  });

  it('keeps chat inside the active relationship and deduplicates retries', async () => {
    const service = new DailyService();
    const input = { recipientId: clientId, clientRequestId: randomUUID(), kind: 'check_in' as const, body: 'How did today feel?' };
    await service.sendMessage(coachId, input);
    await service.sendMessage(coachId, input);
    expect(await AppDataSource.getRepository(CoachingMessage).countBy({ relationshipId })).toBe(1);
    expect((await service.getConversation(clientId, coachId)).items).toHaveLength(1);
  });
});

function user(id: string, role: UserRole): Partial<User> {
  return {
    id,
    email: `${id}@daily.example`,
    username: `u_${id.replace(/-/g, '')}`,
    password: '$2a$12$abcdefghijklmnopqrstuuuuuuuuuuuuuuuuuuuuuuuuuuuuu',
    firstName: role === UserRole.COACH ? 'Coach' : 'Client',
    lastName: 'Daily',
    role,
    isActive: true,
    isEmailVerified: true,
    hasCompletedOnboarding: true,
  };
}
