import { AppDataSource } from '../database/data-source';
import { User, UserRole } from '../database/entities/User';
import { CoachProfile } from '../database/entities/CoachProfile';
import { ClientCoachRelationship, RelationshipStatus } from '../database/entities/ClientCoachRelationship';

export class RelationshipsService {
  private userRepository = AppDataSource.getRepository(User);
  private coachProfileRepository = AppDataSource.getRepository(CoachProfile);
  private relationshipRepository = AppDataSource.getRepository(ClientCoachRelationship);

  async requestCoach(clientId: string, coachId: string) {
    try {
      const coach = await this.userRepository.findOne({
        where: { id: coachId, isActive: true, role: UserRole.COACH },
      });

      if (!coach) return { success: false, message: 'Coach not found' };

      const coachProfile = await this.coachProfileRepository.findOne({ where: { userId: coachId } });
      if (!coachProfile || !coachProfile.acceptingClients) {
        return { success: false, message: 'Coach is not accepting new clients' };
      }

      const existing = await this.relationshipRepository.findOne({
        where: [
          { clientId, coachId, status: RelationshipStatus.PENDING },
          { clientId, coachId, status: RelationshipStatus.ACTIVE },
        ],
      });

      if (existing) {
        return { success: false, message: 'A relationship with this coach already exists' };
      }

      const relationship = this.relationshipRepository.create({ clientId, coachId });
      const saved = await this.relationshipRepository.save(relationship);
      return { success: true, data: saved, message: 'Coach request sent successfully' };
    } catch (error) {
      console.error('Request coach error:', error);
      return { success: false, message: 'Failed to send coach request' };
    }
  }

  async acceptRelationship(relationshipId: string, coachUserId: string) {
    try {
      const relationship = await this.relationshipRepository.findOne({
        where: { id: relationshipId, coachId: coachUserId, status: RelationshipStatus.PENDING },
      });

      if (!relationship) return { success: false, message: 'Pending request not found' };

      relationship.status = RelationshipStatus.ACTIVE;
      relationship.startedAt = new Date();

      const saved = await this.relationshipRepository.save(relationship);
      return { success: true, data: saved, message: 'Relationship accepted' };
    } catch (error) {
      console.error('Accept relationship error:', error);
      return { success: false, message: 'Failed to accept relationship' };
    }
  }

  async declineRelationship(relationshipId: string, coachUserId: string) {
    try {
      const relationship = await this.relationshipRepository.findOne({
        where: { id: relationshipId, coachId: coachUserId, status: RelationshipStatus.PENDING },
      });

      if (!relationship) return { success: false, message: 'Pending request not found' };

      relationship.status = RelationshipStatus.INACTIVE;
      relationship.endedAt = new Date();

      await this.relationshipRepository.save(relationship);
      return { success: true, message: 'Request declined' };
    } catch (error) {
      console.error('Decline relationship error:', error);
      return { success: false, message: 'Failed to decline relationship' };
    }
  }

  async endRelationship(relationshipId: string, userId: string) {
    try {
      const relationship = await this.relationshipRepository.findOne({
        where: { id: relationshipId, status: RelationshipStatus.ACTIVE },
      });

      if (!relationship) return { success: false, message: 'Active relationship not found' };

      if (relationship.clientId !== userId && relationship.coachId !== userId) {
        return { success: false, message: 'Not authorized to end this relationship' };
      }

      relationship.status = RelationshipStatus.INACTIVE;
      relationship.endedAt = new Date();

      await this.relationshipRepository.save(relationship);
      return { success: true, message: 'Relationship ended' };
    } catch (error) {
      console.error('End relationship error:', error);
      return { success: false, message: 'Failed to end relationship' };
    }
  }

  async getMyCoach(clientId: string) {
    try {
      const relationship = await this.relationshipRepository.findOne({
        where: { clientId, status: RelationshipStatus.ACTIVE },
        relations: ['coach'],
        order: { startedAt: 'DESC' },
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

  async getPendingRequests(coachUserId: string, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      const [relationships, total] = await this.relationshipRepository.findAndCount({
        where: { coachId: coachUserId, status: RelationshipStatus.PENDING },
        relations: ['client'],
        skip,
        take: limit,
        order: { createdAt: 'DESC' },
      });

      const data = relationships.map((rel) => ({
        id: rel.id,
        createdAt: rel.createdAt,
        client: {
          id: rel.client.id,
          firstName: rel.client.firstName,
          lastName: rel.client.lastName,
          username: rel.client.username,
          email: rel.client.email,
          avatar: rel.client.avatar,
        },
      }));

      return { success: true, data, total, page, limit };
    } catch (error) {
      console.error('Get pending requests error:', error);
      return { success: false, message: 'Failed to get pending requests' };
    }
  }
}
