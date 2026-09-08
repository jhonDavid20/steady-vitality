import { randomUUID } from 'crypto';
import { In, IsNull } from 'typeorm';
import type { ExerciseInput, WorkoutAssignmentInput, WorkoutCompletionInput, WorkoutPlanInput } from '@steady/shared';
import { AppDataSource } from '../database/data-source';
import { Exercise } from '../database/entities/Exercise';
import { WorkoutPlan } from '../database/entities/WorkoutPlan';
import { WorkoutAssignment } from '../database/entities/WorkoutAssignment';
import { WorkoutCompletion } from '../database/entities/WorkoutCompletion';
import { ClientCoachRelationship, RelationshipStatus } from '../database/entities/ClientCoachRelationship';

function validTimezone(timezone: string): boolean {
  try { new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(); return true; } catch { return false; }
}

function weekday(localDate: string): number {
  return new Date(`${localDate}T12:00:00Z`).getUTCDay();
}

function previousDate(localDate: string): string {
  const date = new Date(`${localDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export class WorkoutsService {
  private exercises = AppDataSource.getRepository(Exercise);
  private plans = AppDataSource.getRepository(WorkoutPlan);
  private assignments = AppDataSource.getRepository(WorkoutAssignment);
  private completions = AppDataSource.getRepository(WorkoutCompletion);
  private relationships = AppDataSource.getRepository(ClientCoachRelationship);

  listExercises(coachId: string) {
    return this.exercises.find({ where: [{ coachId }, { coachId: IsNull() }], order: { name: 'ASC' } });
  }

  async createExercise(coachId: string, input: ExerciseInput) {
    return this.exercises.save(this.exercises.create({ coachId, ...input, description: input.description ?? null, videoUrl: input.videoUrl ?? null }));
  }

  async updateExercise(coachId: string, id: string, input: Partial<ExerciseInput>) {
    const exercise = await this.exercises.findOne({ where: { id, coachId } });
    if (!exercise) return null;
    Object.assign(exercise, input);
    return this.exercises.save(exercise);
  }

  async deleteExercise(coachId: string, id: string): Promise<boolean> {
    return (await this.exercises.delete({ id, coachId })).affected === 1;
  }

  listPlans(coachId: string) {
    return this.plans.find({ where: { coachId, isActive: true }, order: { updatedAt: 'DESC' } });
  }

  async listClients(coachId: string) {
    const relationships = await this.relationships.find({
      where: { coachId, status: RelationshipStatus.ACTIVE },
      relations: ['client'],
      order: { startedAt: 'DESC' },
    });
    return relationships.map(({ client }) => ({ id: client.id, firstName: client.firstName, lastName: client.lastName }));
  }

  async createPlan(coachId: string, input: WorkoutPlanInput) {
    await this.assertExercisesAvailable(coachId, input.items.map((item) => item.exerciseId));
    return this.plans.save(this.plans.create({ coachId, ...input, description: input.description ?? null }));
  }

  async updatePlan(coachId: string, id: string, input: WorkoutPlanInput) {
    const plan = await this.plans.findOne({ where: { id, coachId, isActive: true } });
    if (!plan) return null;
    await this.assertExercisesAvailable(coachId, input.items.map((item) => item.exerciseId));
    Object.assign(plan, input);
    return this.plans.save(plan);
  }

  async assignPlan(coachId: string, input: WorkoutAssignmentInput) {
    if (!validTimezone(input.timezone)) throw new Error('Invalid IANA timezone');
    if (input.endsOn && input.endsOn < input.startsOn) throw new Error('endsOn must be on or after startsOn');

    const [plan, relationship] = await Promise.all([
      this.plans.findOne({ where: { id: input.planId, coachId, isActive: true } }),
      this.relationships.findOne({ where: { clientId: input.clientId, coachId, status: RelationshipStatus.ACTIVE } }),
    ]);
    if (!plan) throw new Error('Workout plan not found');
    if (!relationship) throw new Error('Client does not have an active relationship with you');

    const exerciseIds = [...new Set(plan.items.map((item) => item.exerciseId))];
    const exercises = await this.exercises.find({ where: { id: In(exerciseIds) } });
    if (exercises.length !== exerciseIds.length) throw new Error('Workout plan contains unavailable exercises');
    const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]));
    const actions = plan.items.map((item) => {
      const exercise = byId.get(item.exerciseId)!;
      return { actionId: randomUUID(), ...item, name: exercise.name, muscleGroup: exercise.muscleGroup, description: exercise.description, videoUrl: exercise.videoUrl };
    });

    return AppDataSource.transaction(async (manager) => {
      await manager.update(WorkoutAssignment, { clientId: input.clientId, isActive: true }, { isActive: false, endsOn: previousDate(input.startsOn) });
      return manager.save(WorkoutAssignment, manager.create(WorkoutAssignment, {
        ...input, coachId, planName: plan.name, actions, endsOn: input.endsOn ?? null, isActive: true,
      }));
    });
  }

  async getToday(clientId: string, localDate: string) {
    const assignment = await this.assignments.createQueryBuilder('assignment')
      .where('assignment.clientId = :clientId', { clientId })
      .andWhere('assignment.isActive = true')
      .andWhere('assignment.startsOn <= :localDate', { localDate })
      .andWhere('(assignment.endsOn IS NULL OR assignment.endsOn >= :localDate)', { localDate })
      .orderBy('assignment.createdAt', 'DESC').getOne();
    if (!assignment) return { date: localDate, status: 'no_plan', actions: [], completed: 0, total: 0 };

    const actions = assignment.actions.filter((action) => action.dayOfWeek === weekday(localDate)).sort((a, b) => a.order - b.order);
    if (actions.length === 0) return { date: localDate, timezone: assignment.timezone, status: 'rest', actions: [], completed: 0, total: 0 };
    const records = await this.completions.find({ where: { assignmentId: assignment.id, localDate } });
    const state = new Map(records.map((record) => [record.actionId, record.completed]));
    const result = actions.map((action) => ({ ...action, completed: state.get(action.actionId) ?? false }));
    const completed = result.filter((action) => action.completed).length;
    return { date: localDate, timezone: assignment.timezone, assignmentId: assignment.id, planName: assignment.planName, status: completed === result.length ? 'completed' : 'active', actions: result, completed, total: result.length };
  }

  async setCompletion(clientId: string, input: WorkoutCompletionInput) {
    const assignment = await this.assignments.findOne({ where: { id: input.assignmentId, clientId, isActive: true } });
    if (!assignment || input.localDate < assignment.startsOn || (assignment.endsOn && input.localDate > assignment.endsOn)) throw new Error('Active workout assignment not found');
    const action = assignment.actions.find((candidate) => candidate.actionId === input.actionId && candidate.dayOfWeek === weekday(input.localDate));
    if (!action) throw new Error('Action is not scheduled for this day');
    await this.completions.upsert({ ...input, clientId }, { conflictPaths: ['assignmentId', 'actionId', 'localDate'] });
    return this.completions.findOneByOrFail({ assignmentId: input.assignmentId, actionId: input.actionId, localDate: input.localDate });
  }

  async getClientAdherence(coachId: string, clientId: string, from: string, to: string) {
    const relationship = await this.relationships.findOne({ where: { coachId, clientId, status: RelationshipStatus.ACTIVE } });
    if (!relationship) throw new Error('Client not found');
    const assignment = await this.assignments.findOne({ where: { coachId, clientId, isActive: true } });
    if (!assignment) return { scheduled: 0, completed: 0, percentage: 0 };
    const records = await this.completions.createQueryBuilder('completion').where('completion.assignmentId = :id', { id: assignment.id }).andWhere('completion.localDate BETWEEN :from AND :to', { from, to }).andWhere('completion.completed = true').getMany();
    let scheduled = 0;
    for (let date = new Date(`${from}T12:00:00Z`); date <= new Date(`${to}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + 1)) scheduled += assignment.actions.filter((action) => action.dayOfWeek === date.getUTCDay()).length;
    return { scheduled, completed: records.length, percentage: scheduled ? Math.round(records.length / scheduled * 100) : 0 };
  }

  private async assertExercisesAvailable(coachId: string, ids: string[]) {
    const uniqueIds = [...new Set(ids)];
    const count = await this.exercises.count({ where: uniqueIds.flatMap((id) => [{ id, coachId }, { id, coachId: IsNull() }]) });
    if (count !== uniqueIds.length) throw new Error('One or more exercises are unavailable');
  }
}
