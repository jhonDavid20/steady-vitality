import { AppDataSource } from '../database/data-source';
import { User, UserRole } from '../database/entities/User';
import { CoachProfile, CoachingType } from '../database/entities/CoachProfile';
import { ClientCoachRelationship, RelationshipStatus } from '../database/entities/ClientCoachRelationship';
import { ClientPackage, ClientPackageStatus } from '../database/entities/ClientPackage';
import { UserProfile } from '../database/entities/UserProfile';
import { ConnectionRequest, ConnectionRequestStatus } from '../database/entities/ConnectionRequest';

export interface CoachProfileData {
  // ── Original fields ───────────────────────────────────────────────────────
  bio?: string;
  specialties?: string[];
  sessionRateUSD?: number;
  certifications?: string[];
  acceptingClients?: boolean;

  // ── Professional identity ─────────────────────────────────────────────────
  profileHeadline?: string;
  yearsOfExperience?: number;
  coachingType?: CoachingType;
  trainingModalities?: string[];
  targetClientTypes?: string[];
  languagesSpoken?: string[];

  // ── Scheduling & availability ─────────────────────────────────────────────
  timezone?: string;
  sessionDurationMinutes?: number;
  maxClientCapacity?: number;
  trialSessionAvailable?: boolean;
  trialSessionRateUSD?: number;

  // ── Media & social proof ──────────────────────────────────────────────────
  videoIntroUrl?: string;
  websiteUrl?: string;
  instagramHandle?: string;

  // ── Business ─────────────────────────────────────────────────────────────
  totalClientsTrained?: number;
}

/** Fields returned on every public-facing coach card / profile page. */
function serializePublicProfile(cp: CoachProfile, activeClientsCount?: number) {
  return {
    id: cp.userId,
    coachProfileId: cp.id,
    firstName: cp.user.firstName,
    lastName: cp.user.lastName,
    username: cp.user.username,
    avatar: cp.user.avatar,
    // core
    bio: cp.bio,
    specialties: cp.specialties,
    certifications: cp.certifications,
    sessionRateUSD: cp.sessionRateUSD,
    acceptingClients: cp.acceptingClients,
    // identity
    profileHeadline: cp.profileHeadline,
    yearsOfExperience: cp.yearsOfExperience,
    coachingType: cp.coachingType,
    trainingModalities: cp.trainingModalities,
    targetClientTypes: cp.targetClientTypes,
    languagesSpoken: cp.languagesSpoken,
    // scheduling
    timezone: cp.timezone,
    sessionDurationMinutes: cp.sessionDurationMinutes,
    maxClientCapacity: cp.maxClientCapacity,
    trialSessionAvailable: cp.trialSessionAvailable,
    trialSessionRateUSD: cp.trialSessionRateUSD,
    // media
    videoIntroUrl: cp.videoIntroUrl,
    websiteUrl: cp.websiteUrl,
    instagramHandle: cp.instagramHandle,
    // real linked-client count (only included when explicitly fetched)
    ...(activeClientsCount !== undefined && { activeClientsCount }),
  };
}

export class CoachesService {
  private userRepository              = AppDataSource.getRepository(User);
  private coachProfileRepository      = AppDataSource.getRepository(CoachProfile);
  private relationshipRepository      = AppDataSource.getRepository(ClientCoachRelationship);
  private clientPackageRepository     = AppDataSource.getRepository(ClientPackage);
  private profileRepository           = AppDataSource.getRepository(UserProfile);
  private connectionRequestRepository = AppDataSource.getRepository(ConnectionRequest);

  // ── Public browsing ───────────────────────────────────────────────────────

  async listCoaches(
    page = 1,
    limit = 20,
    filters: { coachingType?: CoachingType; trialOnly?: boolean; search?: string } = {},
  ) {
    try {
      const skip = (page - 1) * limit;

      const qb = this.coachProfileRepository
        .createQueryBuilder('cp')
        .innerJoinAndSelect('cp.user', 'u')
        .where('cp.acceptingClients = true')
        .skip(skip)
        .take(limit)
        .orderBy('cp.createdAt', 'DESC');

      if (filters.coachingType) {
        qb.andWhere('cp.coachingType = :coachingType', { coachingType: filters.coachingType });
      }
      if (filters.trialOnly) {
        qb.andWhere('cp.trialSessionAvailable = true');
      }
      if (filters.search) {
        const s = `%${filters.search}%`;
        qb.andWhere(
          `(cp.profileHeadline ILIKE :s
            OR cp.bio ILIKE :s
            OR array_to_string(cp.specialties, ',') ILIKE :s
            OR u.firstName ILIKE :s
            OR u.lastName ILIKE :s)`,
          { s },
        );
      }

      const [coaches, total] = await qb.getManyAndCount();

      // Batch-fetch real client counts for all coaches in one query (no N+1).
      // users.coachId is the User.id of the coach (not CoachProfile.id).
      const coachUserIds = coaches.map((c) => c.userId);
      const clientCountMap = new Map<string, number>();

      if (coachUserIds.length > 0) {
        const countRows = await this.userRepository
          .createQueryBuilder('u')
          .select('u.coachId', 'coachId')
          .addSelect('COUNT(u.id)::int', 'count')
          .where('u.coachId IN (:...ids)', { ids: coachUserIds })
          .andWhere('u.isActive = true')
          .andWhere('u.role = :role', { role: UserRole.CLIENT })
          .groupBy('u.coachId')
          .getRawMany<{ coachId: string; count: string }>();

        // PostgreSQL COUNT returns a string — parse to int
        for (const row of countRows) {
          clientCountMap.set(row.coachId, parseInt(row.count, 10));
        }
      }

      const serialized = coaches.map((cp) =>
        serializePublicProfile(cp, clientCountMap.get(cp.userId) ?? 0),
      );
      return { success: true, data: serialized, coaches: serialized, total, page, limit };
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
      return { success: true, data: serializePublicProfile(cp) };
    } catch (error) {
      console.error('Get coach by userId error:', error);
      return { success: false, message: 'Failed to get coach profile' };
    }
  }

  // ── Coach-private ─────────────────────────────────────────────────────────

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

      const cp = this.coachProfileRepository.create({ userId });
      this.applyProfileData(cp, data);

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

      this.applyProfileData(cp, data);

      const saved = await this.coachProfileRepository.save(cp);
      return { success: true, data: saved, message: 'Coach profile updated successfully' };
    } catch (error) {
      console.error('Update coach profile error:', error);
      return { success: false, message: 'Failed to update coach profile' };
    }
  }

  /**
   * Upserts the CoachProfile and flips `users.hasCompletedOnboarding = true`
   * in a single transaction.  Called by POST /api/auth/coach/onboarding.
   */
  async completeOnboarding(userId: string, data: CoachProfileData) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Upsert profile
      let cp = await queryRunner.manager.findOne(CoachProfile, { where: { userId } });
      if (!cp) {
        cp = queryRunner.manager.create(CoachProfile, { userId });
      }
      this.applyProfileData(cp, data);
      await queryRunner.manager.save(CoachProfile, cp);

      // Flip flag
      await queryRunner.manager.update(User, { id: userId }, { hasCompletedOnboarding: true });

      await queryRunner.commitTransaction();

      // Re-fetch clean user (no password)
      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          avatar: true,
          isEmailVerified: true,
          hasCompletedOnboarding: true,
        },
      });

      return { success: true, message: 'Onboarding complete!', user, profile: cp };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Complete onboarding error:', error);
      return { success: false, message: 'Failed to complete onboarding' };
    } finally {
      await queryRunner.release();
    }
  }

  // ── Client management ─────────────────────────────────────────────────────

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

  // ── Connection-request flow (marketplace) ────────────────────────────────

  /** Client sends a connection request to a coach. */
  async sendConnectionRequest(clientId: string, coachId: string) {
    try {
      // Guard: one coach per client — reject if the client is already linked to any coach
      const client = await this.userRepository.findOne({
        where: { id: clientId },
        select: { id: true, coachId: true },
      });
      if (client?.coachId) {
        return {
          success: false,
          errorCode: 'ALREADY_HAS_COACH',
          message: "You're already connected to a coach. Disconnect from your current coach before requesting a new one.",
        };
      }

      // Verify target is a coach
      const coach = await this.userRepository.findOne({
        where: { id: coachId, role: UserRole.COACH, isActive: true },
      });
      if (!coach) {
        return { success: false, message: 'Coach not found' };
      }

      // Guard duplicate
      const existing = await this.connectionRequestRepository.findOne({
        where: { clientId, coachId },
      });
      if (existing) {
        if (existing.status === ConnectionRequestStatus.PENDING) {
          return { success: false, message: 'A request already exists for this coach' };
        }
        if (existing.status === ConnectionRequestStatus.ACCEPTED) {
          return { success: false, message: 'You are already connected to this coach' };
        }
        // Previously declined — allow re-request by removing old record
        await this.connectionRequestRepository.delete(existing.id);
      }

      const req = this.connectionRequestRepository.create({ clientId, coachId });
      await this.connectionRequestRepository.save(req);

      return { success: true, message: 'Connection request sent' };
    } catch (error) {
      console.error('Send connection request error:', error);
      return { success: false, message: 'Failed to send connection request' };
    }
  }

  /** Coach retrieves their pending (and recent) connection requests. */
  async getConnectionRequests(coachId: string) {
    try {
      const requests = await this.connectionRequestRepository.find({
        where: { coachId },
        relations: ['client'],
        order: { createdAt: 'DESC' },
      });

      const data = await Promise.all(
        requests.map(async (r) => {
          const profile = await this.profileRepository.findOne({
            where: { userId: r.clientId },
          });
          return {
            id: r.id,
            clientId: r.clientId,
            clientName: `${r.client.firstName} ${r.client.lastName}`,
            clientEmail: r.client.email,
            requestedAt: r.createdAt,
            status: r.status,
            clientProfile: profile
              ? {
                  fitnessGoal: profile.fitnessGoal,
                  weight: profile.weight,
                  height: profile.height,
                  activityLevel: profile.activityLevel,
                }
              : null,
          };
        }),
      );

      return { success: true, requests: data };
    } catch (error) {
      console.error('Get connection requests error:', error);
      return { success: false, message: 'Failed to get connection requests' };
    }
  }

  /** Coach accepts or declines a connection request. */
  async respondToConnectionRequest(
    coachId: string,
    requestId: string,
    action: 'accept' | 'decline',
  ) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const request = await queryRunner.manager.findOne(ConnectionRequest, {
        where: { id: requestId, coachId },
      });

      if (!request) {
        await queryRunner.rollbackTransaction();
        return { success: false, message: 'Connection request not found' };
      }
      if (request.status !== ConnectionRequestStatus.PENDING) {
        await queryRunner.rollbackTransaction();
        return { success: false, message: 'This request has already been resolved' };
      }

      if (action === 'accept') {
        request.status = ConnectionRequestStatus.ACCEPTED;
        await queryRunner.manager.save(ConnectionRequest, request);
        // Link the client directly to this coach
        await queryRunner.manager.update(User, { id: request.clientId }, { coachId });
        await queryRunner.commitTransaction();
        return { success: true, message: 'Request accepted' };
      } else {
        request.status = ConnectionRequestStatus.DECLINED;
        await queryRunner.manager.save(ConnectionRequest, request);
        await queryRunner.commitTransaction();
        return { success: true, message: 'Request declined' };
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Respond to connection request error:', error);
      return { success: false, message: 'Failed to respond to connection request' };
    } finally {
      await queryRunner.release();
    }
  }

  /** Coach gets a flat list of all clients assigned to them (via coachId on User). */
  async getLinkedClients(coachUserId: string, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      const [clients, total] = await this.userRepository.findAndCount({
        where: { coachId: coachUserId, isActive: true, role: UserRole.CLIENT },
        skip,
        take: limit,
        order: { createdAt: 'DESC' },
      });

      const data = await Promise.all(
        clients.map(async (client) => {
          const profile = await this.profileRepository.findOne({
            where: { userId: client.id },
          });
          return {
            id: client.id,
            firstName: client.firstName,
            lastName: client.lastName,
            email: client.email,
            username: client.username,
            avatar: client.avatar ?? null,
            joinedAt: client.createdAt,
            profile: profile
              ? {
                  fitnessGoal: profile.fitnessGoal,
                  weight: profile.weight,
                  targetWeight: profile.targetWeight,
                  height: profile.height,
                  activityLevel: profile.activityLevel,
                  medicalConditions: profile.medicalConditions,
                  injuries: profile.injuries,
                  allergies: profile.allergies,
                }
              : null,
          };
        }),
      );

      return { success: true, clients: data, total, page, limit };
    } catch (error) {
      console.error('Get linked clients error:', error);
      return { success: false, message: 'Failed to get clients' };
    }
  }

  /** Coach fetches a single client's full profile. Client must be linked to this coach. */
  async getLinkedClient(coachUserId: string, clientId: string) {
    try {
      const client = await this.userRepository.findOne({
        where: { id: clientId, coachId: coachUserId, isActive: true, role: UserRole.CLIENT },
      });

      if (!client) {
        return { success: false, message: 'Client not found or not linked to your account' };
      }

      const profile = await this.profileRepository.findOne({ where: { userId: clientId } });

      return {
        success: true,
        client: {
          id:                     client.id,
          firstName:              client.firstName,
          lastName:               client.lastName,
          email:                  client.email,
          username:               client.username,
          avatar:                 client.avatar ?? null,
          role:                   client.role,
          hasCompletedOnboarding: client.hasCompletedOnboarding,
          joinedAt:               client.createdAt,
          profile: profile
            ? {
                fitnessGoal:          profile.fitnessGoal,
                activityLevel:        profile.activityLevel,
                gender:               profile.gender,
                dateOfBirth:          profile.dateOfBirth ?? null,
                height:               profile.height,
                weight:               profile.weight,
                targetWeight:         profile.targetWeight ?? null,
                medicalConditions:    profile.medicalConditions ?? [],
                injuries:             profile.injuries      ?? [],
                medications:          profile.medications   ?? [],
                allergies:            profile.allergies     ?? [],
                preferredWorkoutTime: profile.preferredWorkoutTime ?? null,
                gymLocation:          profile.gymLocation   ?? null,
                timezone:             profile.timezone      ?? null,
                phone:                profile.phone         ?? null,
              }
            : null,
        },
      };
    } catch (error) {
      console.error('Get linked client error:', error);
      return { success: false, message: 'Failed to get client' };
    }
  }

  /** Coach stats — counts derived from DB. Sessions feature is not yet implemented. */
  async getCoachStats(coachUserId: string) {
    try {
      const [activeClients, pendingRequests] = await Promise.all([
        this.userRepository.count({
          where: { coachId: coachUserId, isActive: true, role: UserRole.CLIENT },
        }),
        this.connectionRequestRepository.count({
          where: { coachId: coachUserId, status: ConnectionRequestStatus.PENDING },
        }),
      ]);

      return {
        success: true,
        stats: {
          activeClients,
          pendingRequests,
          // Sessions-based stats will be populated once the sessions feature is built
          sessionsThisMonth: 0,
          revenueThisMonth: 0,
          upcomingSessions: [],
        },
      };
    } catch (error) {
      console.error('Get coach stats error:', error);
      return { success: false, message: 'Failed to get coach stats' };
    }
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Applies every meaningful field from `data` onto a CoachProfile instance.
   *
   * Rules to prevent empty form fields from overwriting real data:
   *  - Text fields: skip "" (empty string) — it means the field was blank in the
   *    form, not that the coach wants to erase the value. Pass null to explicitly clear.
   *  - Array fields: skip [] only when the existing value already has entries — an
   *    empty array from an unsubmitted multi-select should not wipe saved data.
   *    If the existing array is already empty, [] is fine to write.
   *  - Boolean / number fields: always write when defined (these have no ambiguity).
   */
  private applyProfileData(cp: CoachProfile, data: CoachProfileData): void {
    // ── Helpers ─────────────────────────────────────────────────────────────
    // Write a nullable text field: skip empty string, accept null to clear.
    const setText = (val: string | null | undefined, setter: (v: string | undefined) => void) => {
      if (val === undefined) return;           // not sent — leave as-is
      if (val === '') return;                  // blank form field — leave as-is
      setter(val === null ? undefined : val);  // null → clear; string → set
    };

    // Write an array field: skip an empty array only if current value already has items.
    // Guard current with ?? [] because a brand-new (unsaved) entity has undefined arrays.
    const setArr = (val: string[] | undefined, current: string[] | undefined, setter: (v: string[]) => void) => {
      if (val === undefined) return;
      if (val.length === 0 && (current ?? []).length > 0) return; // blank multi-select — leave as-is
      setter(val);
    };

    // ── Core ────────────────────────────────────────────────────────────────
    setText(data.bio,            (v) => { cp.bio = v; });
    setArr(data.specialties,     cp.specialties,    (v) => { cp.specialties = v; });
    setArr(data.certifications,  cp.certifications, (v) => { cp.certifications = v; });
    if (data.sessionRateUSD   !== undefined) cp.sessionRateUSD   = data.sessionRateUSD;
    if (data.acceptingClients !== undefined) cp.acceptingClients = data.acceptingClients;

    // ── Professional identity ────────────────────────────────────────────────
    setText(data.profileHeadline, (v) => { cp.profileHeadline = v; });
    if (data.yearsOfExperience !== undefined) cp.yearsOfExperience = data.yearsOfExperience;
    if (data.coachingType      !== undefined) cp.coachingType      = data.coachingType;
    setArr(data.trainingModalities, cp.trainingModalities, (v) => { cp.trainingModalities = v; });
    setArr(data.targetClientTypes,  cp.targetClientTypes,  (v) => { cp.targetClientTypes = v; });
    setArr(data.languagesSpoken,    cp.languagesSpoken,    (v) => { cp.languagesSpoken = v; });

    // ── Scheduling ───────────────────────────────────────────────────────────
    setText(data.timezone, (v) => { cp.timezone = v; });
    if (data.sessionDurationMinutes !== undefined) cp.sessionDurationMinutes = data.sessionDurationMinutes;
    if (data.maxClientCapacity      !== undefined) cp.maxClientCapacity      = data.maxClientCapacity;
    if (data.trialSessionAvailable  !== undefined) cp.trialSessionAvailable  = data.trialSessionAvailable;
    if (data.trialSessionRateUSD    !== undefined) cp.trialSessionRateUSD    = data.trialSessionRateUSD;

    // ── Media ────────────────────────────────────────────────────────────────
    setText(data.videoIntroUrl,   (v) => { cp.videoIntroUrl   = v; });
    setText(data.websiteUrl,      (v) => { cp.websiteUrl      = v; });
    setText(data.instagramHandle, (v) => { cp.instagramHandle = v; });

    // ── Business ─────────────────────────────────────────────────────────────
    if (data.totalClientsTrained !== undefined) cp.totalClientsTrained = data.totalClientsTrained;
  }
}
