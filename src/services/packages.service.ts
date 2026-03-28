import { AppDataSource } from '../database/data-source';
import { User } from '../database/entities/User';
import { CoachProfile } from '../database/entities/CoachProfile';
import { Package } from '../database/entities/Package';
import { ClientPackage, ClientPackageStatus } from '../database/entities/ClientPackage';

export interface PackageData {
  name: string;
  description?: string;
  durationWeeks: number;
  sessionsIncluded: number;
  priceUSD: number;
  isActive?: boolean;
}

export interface PackageUpdateData {
  name?: string;
  description?: string;
  durationWeeks?: number;
  sessionsIncluded?: number;
  priceUSD?: number;
  isActive?: boolean;
}

export class PackagesService {
  private userRepository = AppDataSource.getRepository(User);
  private coachProfileRepository = AppDataSource.getRepository(CoachProfile);
  private packageRepository = AppDataSource.getRepository(Package);
  private clientPackageRepository = AppDataSource.getRepository(ClientPackage);

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
        coachId: coachProfile.id,
        name: data.name,
        description: data.description,
        durationWeeks: data.durationWeeks,
        sessionsIncluded: data.sessionsIncluded,
        priceUSD: data.priceUSD,
        isActive: data.isActive ?? true,
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

      if (data.name !== undefined) pkg.name = data.name;
      if (data.description !== undefined) pkg.description = data.description;
      if (data.durationWeeks !== undefined) pkg.durationWeeks = data.durationWeeks;
      if (data.sessionsIncluded !== undefined) pkg.sessionsIncluded = data.sessionsIncluded;
      if (data.priceUSD !== undefined) pkg.priceUSD = data.priceUSD;
      if (data.isActive !== undefined) pkg.isActive = data.isActive;

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

  async assignPackage(coachUserId: string, packageId: string, clientId: string, startDate?: Date) {
    try {
      const coachProfile = await this.coachProfileRepository.findOne({ where: { userId: coachUserId } });
      if (!coachProfile) return { success: false, message: 'Coach profile not found' };

      const pkg = await this.packageRepository.findOne({
        where: { id: packageId, coachId: coachProfile.id, isActive: true },
      });

      if (!pkg) return { success: false, message: 'Active package not found' };

      const client = await this.userRepository.findOne({ where: { id: clientId, isActive: true } });
      if (!client) return { success: false, message: 'Client not found' };

      const existingActive = await this.clientPackageRepository.findOne({
        where: { clientId, packageId, status: ClientPackageStatus.ACTIVE },
      });

      if (existingActive) {
        return { success: false, message: 'Client already has an active assignment for this package' };
      }

      const clientPackage = this.clientPackageRepository.create({
        clientId,
        packageId,
        coachId: coachUserId,
        status: ClientPackageStatus.ACTIVE,
        startDate: startDate ?? new Date(),
      });

      const saved = await this.clientPackageRepository.save(clientPackage);
      return { success: true, data: saved, message: 'Package assigned successfully' };
    } catch (error) {
      console.error('Assign package error:', error);
      return { success: false, message: 'Failed to assign package' };
    }
  }

  async getClientActivePackage(clientId: string) {
    try {
      const clientPackage = await this.clientPackageRepository.findOne({
        where: { clientId, status: ClientPackageStatus.ACTIVE },
        relations: ['package'],
        order: { startDate: 'DESC' },
      });

      if (!clientPackage) return { success: false, message: 'No active package found' };

      return { success: true, data: clientPackage };
    } catch (error) {
      console.error('Get client active package error:', error);
      return { success: false, message: 'Failed to get active package' };
    }
  }

  async updateClientPackageStatus(coachUserId: string, clientPackageId: string, status: ClientPackageStatus) {
    try {
      const clientPackage = await this.clientPackageRepository.findOne({
        where: { id: clientPackageId, coachId: coachUserId },
      });

      if (!clientPackage) return { success: false, message: 'Client package not found' };

      clientPackage.status = status;

      if (status === ClientPackageStatus.COMPLETED || status === ClientPackageStatus.CANCELLED) {
        clientPackage.endDate = new Date();
      }

      const saved = await this.clientPackageRepository.save(clientPackage);
      return { success: true, data: saved, message: 'Package status updated successfully' };
    } catch (error) {
      console.error('Update client package status error:', error);
      return { success: false, message: 'Failed to update package status' };
    }
  }
}
