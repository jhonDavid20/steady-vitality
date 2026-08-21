import { AppDataSource } from '../database/data-source';
import { User } from '../database/entities/User';
import { CoachProfile } from '../database/entities/CoachProfile';
import { Package } from '../database/entities/Package';
import { ClientPackage, ClientPackageStatus } from '../database/entities/ClientPackage';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface PackageData {
  name: string;
  description?: string;
  durationWeeks: number;
  sessionsIncluded: number;
  priceUSD: number;
  isActive?: boolean;
  features?: string[];
}

export interface PackageUpdateData {
  name?: string;
  description?: string;
  durationWeeks?: number;
  sessionsIncluded?: number;
  priceUSD?: number;
  isActive?: boolean;
  features?: string[];
}

export interface AssignPackageData {
  clientId: string;
  startDate?: Date;
  notes?: string;
  goals?: string[];
}

export interface UpdateClientPackageData {
  notes?: string;
  goals?: string[];
  sessionsCompleted?: number;
}

// ── Shared serializer ─────────────────────────────────────────────────────────

/**
 * Canonical shape returned for any ClientPackage response.
 * endDate is derived from startDate + package.durationWeeks — never stored
 * for active packages (the stored endDate is only set on completion/cancellation).
 */
function serializeClientPackage(cp: ClientPackage) {
  const pkg = cp.package ?? null;

  const computedEndDate =
    cp.startDate && pkg
      ? new Date(
          new Date(cp.startDate).getTime() +
          pkg.durationWeeks * 7 * 24 * 60 * 60 * 1000,
        )
      : null;

  return {
    id:                cp.id,
    packageId:         cp.packageId,
    clientId:          cp.clientId,
    status:            cp.status,
    startDate:         cp.startDate   ?? null,
    endDate:           computedEndDate,
    sessionsCompleted: cp.sessionsCompleted ?? 0,
    notes:             cp.notes  ?? null,
    goals:             cp.goals  ?? [],
    package: pkg
      ? {
          id:               pkg.id,
          name:             pkg.name,
          description:      pkg.description      ?? null,
          durationWeeks:    pkg.durationWeeks,
          sessionsIncluded: pkg.sessionsIncluded,
          priceUSD:         pkg.priceUSD,
          features:         pkg.features         ?? [],
        }
      : null,
  };
}

// ── Service ───────────────────────────────────────────────────────────────────

export class PackagesService {
  private userRepository         = AppDataSource.getRepository(User);
  private coachProfileRepository = AppDataSource.getRepository(CoachProfile);
  private packageRepository      = AppDataSource.getRepository(Package);
  private clientPackageRepository = AppDataSource.getRepository(ClientPackage);

  // ── Package templates ─────────────────────────────────────────────────────

  /** Public: list active packages for a coach (coachUserId = users.id) */
  async listCoachPackages(coachUserId: string) {
    try {
      const coachProfile = await this.coachProfileRepository.findOne({ where: { userId: coachUserId } });
      if (!coachProfile) return { success: false, message: 'Coach not found' };

      const data = await this.packageRepository.find({
        where: { coachId: coachProfile.id, isActive: true },
        order: { createdAt: 'DESC' },
      });

      return { success: true, data };
    } catch (error) {
      console.error('List coach packages error:', error);
      return { success: false, message: 'Failed to list packages' };
    }
  }

  async createPackage(coachUserId: string, data: PackageData) {
    try {
      const coachProfile = await this.coachProfileRepository.findOne({ where: { userId: coachUserId } });
      if (!coachProfile) {
        return { success: false, message: 'Coach profile not found. Create a coach profile first.' };
      }

      const pkg = this.packageRepository.create({
        coachId:          coachProfile.id,
        name:             data.name,
        description:      data.description,
        durationWeeks:    data.durationWeeks,
        sessionsIncluded: data.sessionsIncluded,
        priceUSD:         data.priceUSD,
        isActive:         data.isActive ?? true,
        features:         data.features ?? null,
      });

      const saved = await this.packageRepository.save(pkg);
      return { success: true, data: saved, message: 'Package created successfully' };
    } catch (error) {
      console.error('Create package error:', error);
      return { success: false, message: 'Failed to create package' };
    }
  }

  async updatePackage(coachUserId: string, packageId: string, data: PackageUpdateData) {
    try {
      const coachProfile = await this.coachProfileRepository.findOne({ where: { userId: coachUserId } });
      if (!coachProfile) return { success: false, message: 'Coach profile not found' };

      const pkg = await this.packageRepository.findOne({
        where: { id: packageId, coachId: coachProfile.id },
      });
      if (!pkg) return { success: false, message: 'Package not found' };

      if (data.name             !== undefined) pkg.name             = data.name;
      if (data.description      !== undefined) pkg.description      = data.description;
      if (data.durationWeeks    !== undefined) pkg.durationWeeks    = data.durationWeeks;
      if (data.sessionsIncluded !== undefined) pkg.sessionsIncluded = data.sessionsIncluded;
      if (data.priceUSD         !== undefined) pkg.priceUSD         = data.priceUSD;
      if (data.isActive         !== undefined) pkg.isActive         = data.isActive;
      if (data.features         !== undefined) pkg.features         = data.features ?? null;

      const saved = await this.packageRepository.save(pkg);
      return { success: true, data: saved, message: 'Package updated successfully' };
    } catch (error) {
      console.error('Update package error:', error);
      return { success: false, message: 'Failed to update package' };
    }
  }

  async deletePackage(coachUserId: string, packageId: string) {
    try {
      const coachProfile = await this.coachProfileRepository.findOne({ where: { userId: coachUserId } });
      if (!coachProfile) return { success: false, message: 'Coach profile not found' };

      const pkg = await this.packageRepository.findOne({
        where: { id: packageId, coachId: coachProfile.id },
      });
      if (!pkg) return { success: false, message: 'Package not found' };

      pkg.isActive = false;
      await this.packageRepository.save(pkg);
      return { success: true, message: 'Package deactivated successfully' };
    } catch (error) {
      console.error('Delete package error:', error);
      return { success: false, message: 'Failed to deactivate package' };
    }
  }

  // ── Client assignments ────────────────────────────────────────────────────

  async assignPackage(coachUserId: string, packageId: string, data: AssignPackageData) {
    try {
      const coachProfile = await this.coachProfileRepository.findOne({ where: { userId: coachUserId } });
      if (!coachProfile) return { success: false, message: 'Coach profile not found' };

      const pkg = await this.packageRepository.findOne({
        where: { id: packageId, coachId: coachProfile.id, isActive: true },
      });
      if (!pkg) return { success: false, message: 'Active package not found' };

      const client = await this.userRepository.findOne({ where: { id: data.clientId, isActive: true } });
      if (!client) return { success: false, message: 'Client not found' };

      const existingActive = await this.clientPackageRepository.findOne({
        where: { clientId: data.clientId, packageId, status: ClientPackageStatus.ACTIVE },
      });
      if (existingActive) {
        return { success: false, message: 'Client already has an active assignment for this package' };
      }

      const clientPackage = this.clientPackageRepository.create({
        clientId:   data.clientId,
        packageId,
        coachId:    coachUserId,
        status:     ClientPackageStatus.ACTIVE,
        startDate:  data.startDate ?? new Date(),
        notes:      data.notes  ?? null,
        goals:      data.goals  ?? null,
        sessionsCompleted: 0,
      });

      const saved = await this.clientPackageRepository.save(clientPackage);

      // Re-fetch with package relation so the serializer has full data
      const full = await this.clientPackageRepository.findOne({
        where: { id: saved.id },
        relations: ['package'],
      });

      return {
        success: true,
        data: full ? serializeClientPackage(full) : saved,
        message: 'Package assigned successfully',
      };
    } catch (error) {
      console.error('Assign package error:', error);
      return { success: false, message: 'Failed to assign package' };
    }
  }

  /** Client: get their own active package with full enriched shape. */
  async getClientActivePackage(clientId: string) {
    try {
      const clientPackage = await this.clientPackageRepository.findOne({
        where: { clientId, status: ClientPackageStatus.ACTIVE },
        relations: ['package'],
        order: { startDate: 'DESC' },
      });

      if (!clientPackage) return { success: false, message: 'No active package found' };

      return { success: true, clientPackage: serializeClientPackage(clientPackage) };
    } catch (error) {
      console.error('Get client active package error:', error);
      return { success: false, message: 'Failed to get active package' };
    }
  }

  /**
   * Coach updates notes, goals, and/or sessionsCompleted on an existing assignment.
   * Only the assigned coach can update.
   */
  async updateClientPackage(
    coachUserId: string,
    clientPackageId: string,
    data: UpdateClientPackageData,
  ) {
    try {
      const clientPackage = await this.clientPackageRepository.findOne({
        where: { id: clientPackageId, coachId: coachUserId },
        relations: ['package'],
      });

      if (!clientPackage) {
        return { success: false, message: 'Client package not found or not assigned to you' };
      }

      if (data.notes             !== undefined) clientPackage.notes             = data.notes ?? null;
      if (data.goals             !== undefined) clientPackage.goals             = data.goals ?? null;
      if (data.sessionsCompleted !== undefined) clientPackage.sessionsCompleted = data.sessionsCompleted;

      await this.clientPackageRepository.save(clientPackage);

      // Re-fetch to ensure package relation is fresh after save
      const updated = await this.clientPackageRepository.findOne({
        where: { id: clientPackageId },
        relations: ['package'],
      });

      return {
        success: true,
        clientPackage: serializeClientPackage(updated!),
        message: 'Client package updated successfully',
      };
    } catch (error) {
      console.error('Update client package error:', error);
      return { success: false, message: 'Failed to update client package' };
    }
  }

  /** Coach: update the status (pending → active, active → completed/cancelled). */
  async updateClientPackageStatus(
    coachUserId: string,
    clientPackageId: string,
    status: ClientPackageStatus,
  ) {
    try {
      const clientPackage = await this.clientPackageRepository.findOne({
        where: { id: clientPackageId, coachId: coachUserId },
        relations: ['package'],
      });

      if (!clientPackage) return { success: false, message: 'Client package not found' };

      clientPackage.status = status;

      if (status === ClientPackageStatus.COMPLETED || status === ClientPackageStatus.CANCELLED) {
        clientPackage.endDate = new Date();
      }

      await this.clientPackageRepository.save(clientPackage);

      const updated = await this.clientPackageRepository.findOne({
        where: { id: clientPackageId },
        relations: ['package'],
      });

      return {
        success: true,
        data: serializeClientPackage(updated!),
        message: 'Package status updated successfully',
      };
    } catch (error) {
      console.error('Update client package status error:', error);
      return { success: false, message: 'Failed to update package status' };
    }
  }

  // ── Client package request flow ───────────────────────────────────────────

  /**
   * Client requests a package from their coach.
   * Creates a ClientPackage row with status = 'pending' for the coach to confirm.
   *
   * Ownership check path:
   *   package.coachId → CoachProfile.id → CoachProfile.userId === client.coachId (User.id)
   */
  async requestPackage(clientId: string, packageId: string) {
    try {
      const pkg = await this.packageRepository.findOne({
        where: { id: packageId, isActive: true },
      });
      if (!pkg) {
        return { success: false, status: 404, message: 'Package not found or no longer available' };
      }

      const client = await this.userRepository.findOne({
        where: { id: clientId, isActive: true },
        select: { id: true, coachId: true },
      });
      if (!client) {
        return { success: false, status: 404, message: 'Client not found' };
      }
      if (!client.coachId) {
        return { success: false, status: 403, message: 'You are not connected to any coach' };
      }

      const coachProfile = await this.coachProfileRepository.findOne({
        where: { id: pkg.coachId },
        select: { id: true, userId: true },
      });
      if (!coachProfile || coachProfile.userId !== client.coachId) {
        return { success: false, status: 403, message: 'This package does not belong to your coach' };
      }

      const alreadyActive = await this.clientPackageRepository.findOne({
        where: { clientId, coachId: client.coachId, status: ClientPackageStatus.ACTIVE },
      });
      if (alreadyActive) {
        return { success: false, status: 400, message: 'You already have an active package from this coach' };
      }

      const alreadyPending = await this.clientPackageRepository.findOne({
        where: { clientId, packageId, status: ClientPackageStatus.PENDING },
      });
      if (alreadyPending) {
        return { success: false, status: 400, message: 'You already have a pending request for this package' };
      }

      const clientPackage = this.clientPackageRepository.create({
        clientId,
        packageId,
        coachId:          client.coachId,
        status:           ClientPackageStatus.PENDING,
        sessionsCompleted: 0,
      });

      const saved = await this.clientPackageRepository.save(clientPackage);

      return {
        success: true,
        status: 201,
        message: 'Package requested successfully',
        clientPackage: {
          id:        saved.id,
          packageId: saved.packageId,
          clientId:  saved.clientId,
          status:    saved.status,
          startDate: saved.startDate ?? null,
        },
      };
    } catch (error) {
      console.error('Request package error:', error);
      return { success: false, status: 500, message: 'Failed to request package' };
    }
  }

  // ── Coach view of a client's package ─────────────────────────────────────

  /** Coach fetches the most recent ClientPackage for a given client. */
  async getClientPackage(coachUserId: string, clientId: string) {
    try {
      const client = await this.userRepository.findOne({
        where: { id: clientId, isActive: true },
        select: { id: true, coachId: true },
      });

      if (!client) return { success: false, message: 'Client not found' };
      if (client.coachId !== coachUserId) {
        return { success: false, message: 'This client is not linked to your account' };
      }

      const clientPackage = await this.clientPackageRepository.findOne({
        where: { clientId, coachId: coachUserId },
        relations: ['package'],
        order: { createdAt: 'DESC' },
      });

      if (!clientPackage) return { success: false, message: 'No package found for this client' };

      return { success: true, clientPackage: serializeClientPackage(clientPackage) };
    } catch (error) {
      console.error('Get client package error:', error);
      return { success: false, message: 'Failed to get client package' };
    }
  }
}
