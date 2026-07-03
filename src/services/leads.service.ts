import { AppDataSource } from '../database/data-source';
import { Lead, LeadStatus } from '../database/entities/Lead';

export interface CreateLeadInput {
  name: string;
  email: string;
  age?: string | null;
  gender?: string | null;
  height?: number | string | null;
  weight?: number | string | null;
  activityLevel?: string | null;
  goal?: string | null;
  experience?: string | null;
  bmi?: number | string | null;
  locale?: string | null;
}

export class LeadsService {
  private leadRepository = AppDataSource.getRepository(Lead);

  /** Parse a numeric-ish value into a number, or null when absent/invalid. */
  private toNumber(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') return null;
    const n = typeof value === 'number' ? value : Number.parseFloat(value);
    return Number.isFinite(n) ? n : null;
  }

  /** BMI = weight(kg) / height(m)^2, rounded to one decimal. */
  private computeBmi(height: number | null, weight: number | null): number | null {
    if (!height || !weight || height <= 0 || weight <= 0) return null;
    const meters = height / 100;
    return Math.round((weight / (meters * meters)) * 10) / 10;
  }

  async createLead(input: CreateLeadInput) {
    try {
      const height = this.toNumber(input.height);
      const weight = this.toNumber(input.weight);
      const bmi = this.toNumber(input.bmi) ?? this.computeBmi(height, weight);

      const lead = this.leadRepository.create({
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        age: input.age ?? null,
        gender: input.gender ?? null,
        height,
        weight,
        activityLevel: input.activityLevel ?? null,
        goal: input.goal ?? null,
        experience: input.experience ?? null,
        bmi,
        locale: input.locale ?? null,
        status: LeadStatus.NEW,
      });

      const saved = await this.leadRepository.save(lead);
      return { success: true, data: saved, message: 'Assessment submitted successfully' };
    } catch (error) {
      console.error('Create lead error:', error);
      return { success: false, message: 'Failed to submit assessment' };
    }
  }

  async listLeads(page = 1, limit = 20, status?: LeadStatus) {
    try {
      const [items, total] = await this.leadRepository.findAndCount({
        where: status ? { status } : {},
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        success: true,
        data: items,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      console.error('List leads error:', error);
      return { success: false, message: 'Failed to list leads' };
    }
  }

  async updateLeadStatus(id: string, status: LeadStatus) {
    try {
      const lead = await this.leadRepository.findOne({ where: { id } });
      if (!lead) return { success: false, message: 'Lead not found' };

      lead.status = status;
      const saved = await this.leadRepository.save(lead);
      return { success: true, data: saved, message: 'Lead status updated' };
    } catch (error) {
      console.error('Update lead status error:', error);
      return { success: false, message: 'Failed to update lead status' };
    }
  }
}
