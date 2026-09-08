import { AppDataSource } from '../database/data-source';
import { User } from '../database/entities/User';
import { CoachProfile } from '../database/entities/CoachProfile';
import { ClientCoachRelationship, RelationshipStatus } from '../database/entities/ClientCoachRelationship';
import { ClientPackage, ClientPackageStatus } from '../database/entities/ClientPackage';

export class RelationshipsService {
  private coachProfileRepository = AppDataSource.getRepository(CoachProfile);
  private relationshipRepository = AppDataSource.getRepository(ClientCoachRelationship);

  /** Ends an active relationship and clears the derived current-coach pointer. */
  async endRelationship(relationshipId: string, userId: string) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const relationship = await queryRunner.manager.findOne(ClientCoachRelationship, {
        where: { id: relationshipId, status: RelationshipStatus.ACTIVE },
        lock: { mode: 'pessimistic_write' },
      });

      if (!relationship) {
        await queryRunner.rollbackTransaction();
        return { success: false, message: 'Active relationship not found' };
      }
      if (relationship.clientId !== userId && relationship.coachId !== userId) {
        await queryRunner.rollbackTransaction();
        return { success: false, message: 'Not authorized to end this relationship' };
      }

      const activePackage = await queryRunner.manager.findOne(ClientPackage, {
        where: {
          clientId: relationship.clientId,
          coachId: relationship.coachId,
          status: ClientPackageStatus.ACTIVE,
        },
        lock: { mode: 'pessimistic_read' },
      });
      if (activePackage) {
        await queryRunner.rollbackTransaction();
        return { success: false, message: 'End the active package before ending this relationship' };
      }

      relationship.status = RelationshipStatus.INACTIVE;
      relationship.endedAt = new Date();
      await queryRunner.manager.save(ClientCoachRelationship, relationship);
      await queryRunner.manager.update(User, {
        id: relationship.clientId,
        coachId: relationship.coachId,
      }, { coachId: null });
      await queryRunner.commitTransaction();

      return { success: true, message: 'Relationship ended' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('End relationship error:', error);
      return { success: false, message: 'Failed to end relationship' };
    } finally {
      await queryRunner.release();
    }
  }

  async getMyCoach(clientId: string) {
    try {
      const relationship = await this.relationshipRepository.findOne({
        where: { clientId, status: RelationshipStatus.ACTIVE },
        relations: ['coach'],
      });

      if (!relationship) return { success: false, message: 'No active coach relationship found' };

      const coachProfile = await this.coachProfileRepository.findOne({
        where: { userId: relationship.coachId },
      });

      return {
        success: true,
        data: {
          relationshipId: relationship.id,
          startedAt: relationship.startedAt,
          coach: {
            id: relationship.coach.id,
            firstName: relationship.coach.firstName,
            lastName: relationship.coach.lastName,
            username: relationship.coach.username,
            email: relationship.coach.email,
            avatar: relationship.coach.avatar,
            coachProfile: coachProfile
              ? {
                  bio: coachProfile.bio,
                  specialties: coachProfile.specialties,
                  sessionRateUSD: coachProfile.sessionRateUSD,
                  certifications: coachProfile.certifications,
                }
              : null,
          },
        },
      };
    } catch (error) {
      console.error('Get my coach error:', error);
      return { success: false, message: 'Failed to get coach information' };
    }
  }
}
