import { randomUUID } from 'crypto';
import { Between } from 'typeorm';
import type { CoachingMessageInput, MealCompletionInput, NutritionAssignmentInput, NutritionPlanInput, WaterLogInput } from '@steady/shared';
import { AppDataSource } from '../database/data-source';
import { ClientCoachRelationship, RelationshipStatus } from '../database/entities/ClientCoachRelationship';
import { CoachingMessage, CoachingMessageKind } from '../database/entities/CoachingMessage';
import { MealCompletion } from '../database/entities/MealCompletion';
import { NutritionAssignment } from '../database/entities/NutritionAssignment';
import { NutritionPlan } from '../database/entities/NutritionPlan';
import { UserProfile } from '../database/entities/UserProfile';
import { WaterLog } from '../database/entities/WaterLog';
import { WorkoutAssignment } from '../database/entities/WorkoutAssignment';
import { WorkoutCompletion } from '../database/entities/WorkoutCompletion';
import { WorkoutsService } from './workouts.service';

export function weekday(localDate: string): number {
  return new Date(`${localDate}T12:00:00Z`).getUTCDay();
}

export function shiftDate(localDate: string, days: number): string {
  const date = new Date(`${localDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function humaneStreak(days: Array<{ scheduled: number; completed: number }>): number {
  let streak = 0;
  let misses = 0;
  for (let index = days.length - 1; index >= 0; index -= 1) {
    const day = days[index];
    if (day.scheduled === 0) continue;
    if (day.completed >= day.scheduled) { streak += 1; misses = 0; continue; }
    misses += 1;
    if (misses === 1) continue;
    break;
  }
  return streak;
}

function validTimezone(timezone: string): boolean {
  try { new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(); return true; } catch { return false; }
}

export class DailyService {
  private plans = AppDataSource.getRepository(NutritionPlan);
  private assignments = AppDataSource.getRepository(NutritionAssignment);
  private meals = AppDataSource.getRepository(MealCompletion);
  private water = AppDataSource.getRepository(WaterLog);
  private messages = AppDataSource.getRepository(CoachingMessage);
  private relationships = AppDataSource.getRepository(ClientCoachRelationship);

  listNutritionPlans(coachId: string) {
    return this.plans.find({ where: { coachId, isActive: true }, order: { updatedAt: 'DESC' } });
  }

  createNutritionPlan(coachId: string, input: NutritionPlanInput) {
    return this.plans.save(this.plans.create({
      coachId,
      ...input,
      items: input.items.map((item) => ({
        ...item,
        mealId: item.mealId ?? randomUUID(),
        description: item.description ?? null,
        calories: item.calories ?? null,
      })),
    }));
  }

  async updateNutritionPlan(coachId: string, planId: string, input: NutritionPlanInput) {
    const plan = await this.plans.findOne({ where: { id: planId, coachId, isActive: true } });
    if (!plan) return null;
    plan.name = input.name;
    plan.waterTargetMl = input.waterTargetMl;
    plan.items = input.items.map((item) => ({
      ...item,
      mealId: item.mealId ?? randomUUID(),
      description: item.description ?? null,
      calories: item.calories ?? null,
    }));
    return this.plans.save(plan);
  }

  async assignNutritionPlan(coachId: string, input: NutritionAssignmentInput) {
    if (!validTimezone(input.timezone)) throw new Error('Invalid IANA timezone');
    if (input.endsOn && input.endsOn < input.startsOn) throw new Error('endsOn must be on or after startsOn');
    const [plan, relationship] = await Promise.all([
      this.plans.findOne({ where: { id: input.planId, coachId, isActive: true } }),
      this.relationships.findOne({ where: { clientId: input.clientId, coachId, status: RelationshipStatus.ACTIVE } }),
    ]);
    if (!plan) throw new Error('Nutrition plan not found');
    if (!relationship) throw new Error('Client does not have an active relationship with you');
    return AppDataSource.transaction(async (manager) => {
      await manager.update(NutritionAssignment, { clientId: input.clientId, isActive: true }, { isActive: false, endsOn: shiftDate(input.startsOn, -1) });
      return manager.save(NutritionAssignment, manager.create(NutritionAssignment, {
        ...input,
        coachId,
        planName: plan.name,
        items: plan.items,
        waterTargetMl: plan.waterTargetMl,
        endsOn: input.endsOn ?? null,
        isActive: true,
      }));
    });
  }

  async getNutritionToday(clientId: string, localDate: string) {
    const assignment = await this.assignments.createQueryBuilder('assignment')
      .where('assignment.clientId = :clientId', { clientId })
      .andWhere('assignment.isActive = true')
      .andWhere('assignment.startsOn <= :localDate', { localDate })
      .andWhere('(assignment.endsOn IS NULL OR assignment.endsOn >= :localDate)', { localDate })
      .orderBy('assignment.createdAt', 'DESC').getOne();
    const water = await this.water.findOne({ where: { clientId, localDate } });
    if (!assignment) return { status: 'no_plan', meals: [], completed: 0, total: 0, water: { amountMl: water?.amountMl ?? 0, targetMl: 0 } };
    const scheduled = assignment.items.filter((item) => item.dayOfWeek === weekday(localDate)).sort((a, b) => a.order - b.order);
    const records = await this.meals.find({ where: { assignmentId: assignment.id, localDate } });
    const states = new Map(records.map((record) => [record.mealId, record.completed]));
    const meals = scheduled.map((meal) => ({ ...meal, completed: states.get(meal.mealId) ?? false }));
    const completed = meals.filter((meal) => meal.completed).length;
    return {
      status: meals.length === 0 ? 'rest' : completed === meals.length ? 'completed' : 'active',
      assignmentId: assignment.id,
      planName: assignment.planName,
      meals,
      completed,
      total: meals.length,
      water: { amountMl: water?.amountMl ?? 0, targetMl: assignment.waterTargetMl },
    };
  }

  async setMealCompletion(clientId: string, input: MealCompletionInput) {
    const assignment = await this.assignments.findOne({ where: { id: input.assignmentId, clientId, isActive: true } });
    const meal = assignment?.items.find((item) => item.mealId === input.mealId && item.dayOfWeek === weekday(input.localDate));
    if (!assignment || !meal || input.localDate < assignment.startsOn || (assignment.endsOn && input.localDate > assignment.endsOn)) throw new Error('Scheduled meal not found');
    await this.meals.upsert({ ...input, clientId }, { conflictPaths: ['assignmentId', 'mealId', 'localDate'] });
    return this.meals.findOneByOrFail({ assignmentId: input.assignmentId, mealId: input.mealId, localDate: input.localDate });
  }

  async setWater(clientId: string, input: WaterLogInput) {
    await this.water.upsert({ ...input, clientId }, { conflictPaths: ['clientId', 'localDate'] });
    return this.water.findOneByOrFail({ clientId, localDate: input.localDate });
  }

  async getToday(clientId: string, localDate: string) {
    const activeRelationship = await this.relationships.findOne({ where: { clientId, status: RelationshipStatus.ACTIVE } });
    const [workout, nutrition, streak, profile, checkIn] = await Promise.all([
      new WorkoutsService().getToday(clientId, localDate),
      this.getNutritionToday(clientId, localDate),
      this.getStreak(clientId, localDate),
      AppDataSource.getRepository(UserProfile).findOne({ where: { userId: clientId } }),
      activeRelationship
        ? this.messages.findOne({ where: { relationshipId: activeRelationship.id, recipientId: clientId, kind: CoachingMessageKind.CHECK_IN }, order: { createdAt: 'DESC' } })
        : Promise.resolve(null),
    ]);
    const total = workout.total + nutrition.total + (nutrition.water.targetMl > 0 ? 1 : 0);
    const completed = workout.completed + nutrition.completed + (nutrition.water.targetMl > 0 && nutrition.water.amountMl >= nutrition.water.targetMl ? 1 : 0);
    return {
      date: localDate,
      workout,
      nutrition,
      streak,
      progress: { completed, total, percentage: total ? Math.round(completed / total * 100) : 0, weight: profile?.weight ?? null, targetWeight: profile?.targetWeight ?? null },
      checkIn: checkIn ? { id: checkIn.id, body: checkIn.body, createdAt: checkIn.createdAt } : null,
    };
  }

  async getStreak(clientId: string, through: string) {
    const from = shiftDate(through, -44);
    const [workoutAssignments, nutritionAssignments, workoutCompletions, mealCompletions, waterLogs] = await Promise.all([
      AppDataSource.getRepository(WorkoutAssignment).find({ where: { clientId } }),
      this.assignments.find({ where: { clientId } }),
      AppDataSource.getRepository(WorkoutCompletion).find({ where: { clientId, localDate: Between(from, through), completed: true } }),
      this.meals.find({ where: { clientId, localDate: Between(from, through), completed: true } }),
      this.water.find({ where: { clientId, localDate: Between(from, through) } }),
    ]);
    const days: Array<{ scheduled: number; completed: number }> = [];
    for (let date = from; date <= through; date = shiftDate(date, 1)) {
      const workout = eligible(workoutAssignments, date);
      const nutrition = eligible(nutritionAssignments, date);
      const workoutActions = workout?.actions.filter((item) => item.dayOfWeek === weekday(date)) ?? [];
      const meals = nutrition?.items.filter((item) => item.dayOfWeek === weekday(date)) ?? [];
      const waterTarget = nutrition?.waterTargetMl ?? 0;
      const scheduled = workoutActions.length + meals.length + (waterTarget > 0 ? 1 : 0);
      const completed = workoutCompletions.filter((item) => item.localDate === date && item.assignmentId === workout?.id).length
        + mealCompletions.filter((item) => item.localDate === date && item.assignmentId === nutrition?.id).length
        + (waterTarget > 0 && (waterLogs.find((item) => item.localDate === date)?.amountMl ?? 0) >= waterTarget ? 1 : 0);
      days.push({ scheduled, completed });
    }
    return humaneStreak(days);
  }

  async getClientProgress(coachId: string, clientId: string, from: string, to: string) {
    if (from > to || shiftDate(from, 90) < to) throw new Error('Progress range must be between 1 and 90 days');
    const relationship = await this.relationships.findOne({ where: { coachId, clientId, status: RelationshipStatus.ACTIVE } });
    if (!relationship) throw new Error('Client not found');
    const [workoutAssignments, nutritionAssignments, workoutCompletions, mealCompletions, waterLogs, streak, latestMessage] = await Promise.all([
      AppDataSource.getRepository(WorkoutAssignment).find({ where: { coachId, clientId } }),
      this.assignments.find({ where: { coachId, clientId } }),
      AppDataSource.getRepository(WorkoutCompletion).find({ where: { clientId, localDate: Between(from, to), completed: true } }),
      this.meals.find({ where: { clientId, localDate: Between(from, to), completed: true } }),
      this.water.find({ where: { clientId, localDate: Between(from, to) } }),
      this.getStreak(clientId, to),
      this.messages.findOne({ where: { relationshipId: relationship.id }, order: { createdAt: 'DESC' } }),
    ]);
    let scheduled = 0;
    let completed = 0;
    for (let date = from; date <= to; date = shiftDate(date, 1)) {
      const workout = eligible(workoutAssignments, date);
      const nutrition = eligible(nutritionAssignments, date);
      scheduled += (workout?.actions.filter((item) => item.dayOfWeek === weekday(date)).length ?? 0)
        + (nutrition?.items.filter((item) => item.dayOfWeek === weekday(date)).length ?? 0)
        + ((nutrition?.waterTargetMl ?? 0) > 0 ? 1 : 0);
      completed += workoutCompletions.filter((item) => item.localDate === date && item.assignmentId === workout?.id).length
        + mealCompletions.filter((item) => item.localDate === date && item.assignmentId === nutrition?.id).length
        + ((nutrition?.waterTargetMl ?? 0) > 0 && (waterLogs.find((item) => item.localDate === date)?.amountMl ?? 0) >= nutrition!.waterTargetMl ? 1 : 0);
    }
    return {
      from,
      to,
      scheduled,
      completed,
      percentage: scheduled ? Math.round(completed / scheduled * 100) : 0,
      streak,
      latestMessage: latestMessage ? { body: latestMessage.body, kind: latestMessage.kind, senderId: latestMessage.senderId, createdAt: latestMessage.createdAt } : null,
    };
  }

  async sendMessage(senderId: string, input: CoachingMessageInput) {
    const relationship = await this.relationshipForPair(senderId, input.recipientId);
    if (!relationship) throw new Error('Active coaching relationship not found');
    const message = this.messages.create({
      relationshipId: relationship.id,
      senderId,
      recipientId: input.recipientId,
      clientRequestId: input.clientRequestId,
      kind: input.kind as CoachingMessageKind,
      body: input.body,
      readAt: null,
    });
    await this.messages.upsert(message, { conflictPaths: ['senderId', 'clientRequestId'], skipUpdateIfNoValuesChanged: true });
    return this.messages.findOneByOrFail({ senderId, clientRequestId: input.clientRequestId });
  }

  async listPeers(userId: string) {
    const relationships = await this.relationships.find({
      where: [
        { coachId: userId, status: RelationshipStatus.ACTIVE },
        { clientId: userId, status: RelationshipStatus.ACTIVE },
      ],
      relations: ['coach', 'client'],
      order: { startedAt: 'DESC' },
    });
    return relationships.map((relationship) => {
      const peer = relationship.coachId === userId ? relationship.client : relationship.coach;
      return { id: peer.id, firstName: peer.firstName, lastName: peer.lastName, role: peer.role };
    });
  }

  async getConversation(userId: string, peerId: string, before?: string, limit = 50) {
    const relationship = await this.relationshipForPair(userId, peerId);
    if (!relationship) throw new Error('Active coaching relationship not found');
    await this.messages.createQueryBuilder().update().set({ readAt: new Date() })
      .where('"relationshipId" = :relationshipId AND "recipientId" = :userId AND "readAt" IS NULL', { relationshipId: relationship.id, userId }).execute();
    const query = this.messages.createQueryBuilder('message')
      .where('message.relationshipId = :relationshipId', { relationshipId: relationship.id })
      .orderBy('message.createdAt', 'DESC')
      .take(limit + 1);
    if (before) query.andWhere('message.createdAt < :before', { before });
    const records = await query.getMany();
    const hasMore = records.length > limit;
    const page = records.slice(0, limit);
    const nextCursor = hasMore ? page[page.length - 1]?.createdAt.toISOString() ?? null : null;
    return { items: page.reverse(), nextCursor };
  }

  private relationshipForPair(firstId: string, secondId: string) {
    return this.relationships.findOne({ where: [
      { coachId: firstId, clientId: secondId, status: RelationshipStatus.ACTIVE },
      { coachId: secondId, clientId: firstId, status: RelationshipStatus.ACTIVE },
    ] });
  }
}

function eligible<T extends { startsOn: string; endsOn: string | null; createdAt: Date }>(assignments: T[], date: string): T | undefined {
  return assignments.filter((assignment) => assignment.startsOn <= date && (!assignment.endsOn || assignment.endsOn >= date))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
}
