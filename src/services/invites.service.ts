import { AppDataSource } from '../database/data-source';
import { Invite, InviteType } from '../database/entities/Invite';
import { User } from '../database/entities/User';
import { sendCoachInviteEmail, sendClientInviteEmail } from '../utils/mailer';

export class InvitesService {
  private inviteRepository = AppDataSource.getRepository(Invite);
  private userRepository  = AppDataSource.getRepository(User);

  async create(email: string, admin: User): Promise<{ success: boolean; data?: Invite; message?: string }> {
    try {
      // Guard: reject if the email is already a registered user in the system
      const existingUser = await this.userRepository.findOne({ where: { email } });
      if (existingUser) {
        return { success: false, message: 'A user with this email address is already registered' };
      }

      const existing = await this.inviteRepository.findOne({ where: { email } });

      if (existing) {
        if (existing.used) {
          return { success: false, message: 'An invite for this email has already been accepted' };
        }
        if (!existing.isExpired) {
          return { success: false, message: 'An active invite already exists for this email' };
        }
        // Previous invite expired — remove it so a fresh one can be issued
        await this.inviteRepository.delete(existing.id);
      }

      const invite = this.inviteRepository.create({ email, invitedById: admin.id });
      const saved = await this.inviteRepository.save(invite); // @BeforeInsert fires here

      // Fire-and-forget — email failure must never fail the endpoint
      const inviteUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/en/invite/${saved.token}`;
      sendCoachInviteEmail(email, inviteUrl);

      return { success: true, data: saved, message: 'Invite created successfully' };
    } catch (error) {
      console.error('Create invite error:', error);
      return { success: false, message: 'Failed to create invite' };
    }
  }

  /** Validate a token during coach registration — does NOT mark it used yet */
  async validate(token: string): Promise<{ success: boolean; data?: Invite; message?: string }> {
    try {
      const invite = await this.inviteRepository.findOne({ where: { token } });

      if (!invite) {
        return { success: false, message: 'Invalid invite token' };
      }
      if (invite.used) {
        return { success: false, message: 'This invite has already been used' };
      }
      if (invite.isExpired) {
        return { success: false, message: 'This invite has expired. Ask an admin for a new one' };
      }

      return { success: true, data: invite };
    } catch (error) {
      console.error('Validate invite error:', error);
      return { success: false, message: 'Failed to validate invite' };
    }
  }

  /** Mark an invite as used — call this after the coach account is successfully created */
  async redeem(token: string): Promise<{ success: boolean; message?: string }> {
    try {
      const invite = await this.inviteRepository.findOne({ where: { token } });

      if (!invite || !invite.isValid) {
        return { success: false, message: 'Invite is no longer valid' };
      }

      invite.used = true;
      await this.inviteRepository.save(invite);

      return { success: true, message: 'Invite redeemed' };
    } catch (error) {
      console.error('Redeem invite error:', error);
      return { success: false, message: 'Failed to redeem invite' };
    }
  }

  /** Revoke a pending invite — hard-deletes it so the email can be re-invited. */
  async revoke(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const invite = await this.inviteRepository.findOne({ where: { id } });

      if (!invite) {
        return { success: false, message: 'Invite not found' };
      }
      if (invite.used) {
        return { success: false, message: 'Cannot revoke an invite that has already been accepted' };
      }

      await this.inviteRepository.delete(id);
      return { success: true, message: 'Invite revoked' };
    } catch (error) {
      console.error('Revoke invite error:', error);
      return { success: false, message: 'Failed to revoke invite' };
    }
  }

  // ── Client invite flow ────────────────────────────────────────────────────

  /** Coach creates an invite for a specific client email. */
  async createClientInvite(
    email: string,
    coach: User,
  ): Promise<{ success: boolean; data?: Invite; message?: string }> {
    try {
      // Reject if this email is already a registered user
      const existingUser = await this.userRepository.findOne({ where: { email } });
      if (existingUser) {
        return { success: false, message: 'A user with this email address is already registered' };
      }

      // Reject if a pending client invite already exists for this email
      const existing = await this.inviteRepository.findOne({
        where: { email, type: InviteType.CLIENT },
      });

      if (existing) {
        if (existing.used) {
          return { success: false, message: 'This client has already accepted an invite' };
        }
        if (!existing.isExpired) {
          return { success: false, message: 'A pending invite already exists for this email' };
        }
        // Expired — replace it
        await this.inviteRepository.delete(existing.id);
      }

      const invite = this.inviteRepository.create({
        email,
        type: InviteType.CLIENT,
        invitedById: coach.id,
        coachId: coach.id,
      });
      const saved = await this.inviteRepository.save(invite);

      // Fire-and-forget — email failure must never fail the endpoint
      const inviteUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/en/invite/client/${saved.token}`;
      const coachName = `${coach.firstName} ${coach.lastName}`;
      sendClientInviteEmail(email, inviteUrl, coachName);

      return { success: true, data: saved, message: 'Client invite created' };
    } catch (error) {
      console.error('Create client invite error:', error);
      return { success: false, message: 'Failed to create client invite' };
    }
  }

  /** Public — validate a client invite token (called before registration form). */
  async validateClientInvite(
    token: string,
  ): Promise<{ valid: boolean; email?: string; coachName?: string; coachId?: string; message?: string }> {
    try {
      const invite = await this.inviteRepository.findOne({
        where: { token, type: InviteType.CLIENT },
        relations: ['coach'],
      });

      if (!invite || invite.isExpired || invite.used) {
        return { valid: false, message: 'Invite not found or expired' };
      }

      return {
        valid: true,
        email: invite.email,
        coachId: invite.coachId ?? undefined,
        coachName: invite.coach
          ? `${invite.coach.firstName} ${invite.coach.lastName}`
          : undefined,
      };
    } catch (error) {
      console.error('Validate client invite error:', error);
      return { valid: false, message: 'Failed to validate invite' };
    }
  }

  /**
   * Hard-delete any invite regardless of status (pending, used, expired).
   * Use this when you want to permanently purge a record from the DB.
   */
  async deleteInvite(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const invite = await this.inviteRepository.findOne({ where: { id } });

      if (!invite) {
        return { success: false, message: 'Invite not found' };
      }

      await this.inviteRepository.delete(id);
      return { success: true, message: 'Invite deleted' };
    } catch (error) {
      console.error('Delete invite error:', error);
      return { success: false, message: 'Failed to delete invite' };
    }
  }

  async listAll(page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      const [data, total] = await this.inviteRepository.findAndCount({
        relations: ['invitedBy'],
        skip,
        take: limit,
        order: { createdAt: 'DESC' },
      });

      return { success: true, data, total, page, limit };
    } catch (error) {
      console.error('List invites error:', error);
      return { success: false, message: 'Failed to list invites' };
    }
  }
}
