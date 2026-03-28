import { AppDataSource } from '../database/data-source';
import { User, UserRole } from '../database/entities/User';
import { CoachProfile } from '../database/entities/CoachProfile';
import { ClientCoachRelationship, RelationshipStatus } from '../database/entities/ClientCoachRelationship';
import { ClientPackage, ClientPackageStatus } from '../database/entities/ClientPackage';
import { UserProfile } from '../database/entities/UserProfile';

export interface CoachProfileData {
  bio?: string;
  specialties?: string[];
  sessionRateUSD?: number;
  certifications?: string[];
  acceptingClients?: boolean;
}

export class CoachesService {
  private userRepository = AppDataSource.getRepository(User);
  private coachProfileRepository = AppDataSource.getRepository(CoachProfile);
  private relationshipRepository = AppDataSource.getRepository(ClientCoachRelationship);
  private clientPackageRepository = AppDataSource.getRepository(ClientPackage);
  private profileRepository = AppDataSource.getRepository(UserProfile);

  async listCoaches(page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      const [coaches, total] = await this.coachProfileRepository.findAndCount({
        where: { acceptingClients: true },
        relations: ['user'],
        skip,
        take: limit,
        order: { createdAt: 'DESC' },
      });

      const data = coaches.map((cp) => ({
        id: cp.userId,
        coachProfileId: cp.id,
        firstName: cp.user.firstName,
        lastName: cp.user.lastName,
        username: cp.user.username,
        avatar: cp.user.avatar,
        bio: cp.bio,
        specialties: cp.specialties,
        sessionRateUSD: cp.sessionRateUSD,
        certifications: cp.certifications,
        acceptingClients: cp.acceptingClients,
      }));

      return { success: true, data, total, page, limit };
    } catch (error) {
      console.error('List coaches error:', error);
      return { success: false, message: 'Failed to list coaches' };
    }
  }

  async getCoachByUserId(userId: string) {
    try {
      const cp = await this.coachProfileRepository.findOne({
        where: { userId },
        relations: ['user'],
      });

      if (!cp) return { success: false, message: 'Coach not found' };

      return {
        success: true,
        data: {
          id: cp.userId,
          coachProfileId: cp.id,
          firstName: cp.user.firstName,
          lastName: cp.user.lastName,
          username: cp.user.username,
          avatar: cp.user.avatar,
          bio: cp.bio,
          specialties: cp.specialties,
          sessionRateUSD: cp.sessionRateUSD,
          certifications: cp.certifications,
          acceptingClients: cp.acceptingClients,
        },
      };
    } catch (error) {
      console.error('Get coach by userId error:', error);
      return { success: false, message: 'Failed to get coach profile' };
    }
  }

  async getMyCoachProfile(userId: string) {
    try {
      const cp = await this.coachProfileRepository.findOne({ where: { userId } });
      if (!cp) return { success: false, message: 'Coach profile not found' };
      return { success: true, data: cp };
    } catch (error) {
      console.error('Get my coach profile error:', error);
      return { success: false, message: 'Failed to get coach profile' };
    }
  }

  async createCoachProfile(userId: string, data: CoachProfileData) {
    try {
      const existing = await this.coachProfileRepository.findOne({ where: { userId } });
      if (existing) return { success: false, message: 'Coach profile already exists' };

      const cp = this.coachProfileRepository.create({
        userId,
        bio: data.bio,
        specialties: data.specialties ?? [],
        sessionRateUSD: data.sessionRateUSD,
        certifications: data.certifications ?? [],
        acceptingClients: data.acceptingClients ?? true,
      });

      const saved = await this.coachProfileRepository.save(cp);
      return { success: true, data: saved, message: 'Coach profile created successfully' };
    } catch (error) {
      console.error('Create coach profile error:', error);
      return { success: false, message: 'Failed to create coach profile' };
    }
  }

  async updateCoachProfile(userId: string, data: CoachProfileData) {
    try {
      const cp = await this.coachProfileRepository.findOne({ where: { userId } });
      if (!cp) return { success: false, message: 'Coach profile not found' };

      if (data.bio !== undefined) cp.bio = data.bio;
      if (data.specialties !== undefined) cp.specialties = data.specialties;
      if (data.sessionRateUSD !== undefined) cp.sessionRateUSD = data.sessionRateUSD;
      if (data.certifications !== undefined) cp.certifications = data.certifications;
      if (data.acceptingClients !== undefined) cp.acceptingClients = data.acceptingClients;

      const saved = await this.coachProfileRepository.save(cp);
      return { success: true, data: saved, message: 'Coach profile updated successfully' };
    } catch (error) {
      console.error('Update coach profile error:', error);
      return { success: false, message: 'Failed to update coach profile' };
    }
  }

  async getCoachClients(coachUserId: string, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      const [relationships, total] = await this.relationshipRepository.findAndCount({
        where: { coachId: coachUserId, status: RelationshipStatus.ACTIVE },
        relations: ['client'],
        skip,
        take: limit,
        order: { startedAt: 'DESC' },
      });

      const data = await Promise.all(
        relationships.map(async (rel) => {
          const profile = await this.profileRepository.findOne({ where: { userId: rel.clientId } });
          return {
            relationshipId: rel.id,
            startedAt: rel.startedAt,
            client: {
              id: rel.client.id,
              firstName: rel.client.firstName,
              lastName: rel.client.lastName,
              username: rel.client.username,
              email: rel.client.email,
              avatar: rel.client.avatar,
              profile: profile
                ? {
                    fitnessGoal: profile.fitnessGoal,
                    activityLevel: profile.activityLevel,
                    gender: profile.gender,
                    height: profile.height,
                    weight: profile.weight,
                  }
                : null,
            },
          };
        }),
      );

      return { success: true, data, total, page, limit };
    } catch (error) {
      console.error('Get coach clients error:', error);
      return { success: false, message: 'Failed to get clients' };
    }
  }

  async getCoachDashboard(coachUserId: string) {
    try {
      const [totalClients, pendingRequests, activePackagesCount] = await Promise.all([
        this.relationshipRepository.count({
          where: { coachId: coachUserId, status: RelationshipStatus.ACTIVE },
        }),
        this.relationshipRepository.count({
          where: { coachId: coachUserId, status: RelationshipStatus.PENDING },
        }),
        this.clientPackageRepository.count({
          where: { coachId: coachUserId, status: ClientPackageStatus.ACTIVE },
        }),
      ]);

      return { success: true, data: { totalClients, pendingRequests, activePackagesCount } };
    } catch (error) {
      console.error('Get coach dashboard error:', error);
      return { success: false, message: 'Failed to get dashboard data' };
    }
  }
}
