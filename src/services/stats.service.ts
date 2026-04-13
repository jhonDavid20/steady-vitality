import { AppDataSource } from '../database/data-source';
import { User } from '../database/entities/User';
import { Invite } from '../database/entities/Invite';

export class StatsService {
  private userRepository = AppDataSource.getRepository(User);
  private inviteRepository = AppDataSource.getRepository(Invite);

  async getStats() {
    const now = new Date();

    // ISO week starts on Monday
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);

    // 30 days ago at midnight UTC
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const [totalUsers, newThisWeek, byRoleRaw, inviteStats, signupsByDayRaw] =
      await Promise.all([
        // 1. Total users (all roles, including inactive)
        this.userRepository.count(),

        // 2. New this week
        this.userRepository
          .createQueryBuilder('user')
          .where('user.createdAt >= :weekStart', { weekStart })
          .getCount(),

        // 3. Users grouped by role
        this.userRepository
          .createQueryBuilder('user')
          .select('user.role', 'role')
          .addSelect('COUNT(*)', 'count')
          .groupBy('user.role')
          .getRawMany<{ role: string; count: string }>(),

        // 4. Invite summary — one pass using conditional aggregates (PostgreSQL)
        this.inviteRepository
          .createQueryBuilder('invite')
          .select('COUNT(*)', 'total')
          .addSelect(
            'COUNT(*) FILTER (WHERE invite.used = true)',
            'accepted',
          )
          .addSelect(
            'COUNT(*) FILTER (WHERE invite.used = false AND invite.expiresAt > NOW())',
            'pending',
          )
          .addSelect(
            'COUNT(*) FILTER (WHERE invite.used = false AND invite.expiresAt <= NOW())',
            'expired',
          )
          .getRawOne<{
            total: string;
            accepted: string;
            pending: string;
            expired: string;
          }>(),

        // 5. Signups per calendar day for the last 30 days
        this.userRepository
          .createQueryBuilder('user')
          .select("DATE(user.createdAt AT TIME ZONE 'UTC')", 'date')
          .addSelect('COUNT(*)', 'count')
          .where('user.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
          .groupBy("DATE(user.createdAt AT TIME ZONE 'UTC')")
          .orderBy('date', 'ASC')
          .getRawMany<{ date: string | Date; count: string }>(),
      ]);

    // Shape: byRole
    const byRole: Record<string, number> = {};
    for (const row of byRoleRaw) {
      byRole[row.role] = parseInt(row.count, 10);
    }

    // Shape: invites
    const invites = {
      total: parseInt(inviteStats?.total ?? '0', 10),
      pending: parseInt(inviteStats?.pending ?? '0', 10),
      accepted: parseInt(inviteStats?.accepted ?? '0', 10),
      expired: parseInt(inviteStats?.expired ?? '0', 10),
    };

    // Shape: signupsByDay — fill zero-count gaps
    const signupsByDay = this.fillDateGaps(thirtyDaysAgo, now, signupsByDayRaw);

    return {
      users: {
        total: totalUsers,
        newThisWeek,
        byRole,
      },
      invites,
      signupsByDay,
    };
  }

  /**
   * Fills missing dates between `from` and `to` with count: 0 so the
   * frontend always gets a contiguous 30-day array.
   */
  private fillDateGaps(
    from: Date,
    to: Date,
    raw: { date: string | Date; count: string }[],
  ): { date: string; count: number }[] {
    const map = new Map<string, number>();

    for (const row of raw) {
      // PostgreSQL DATE() returns a JS Date in some driver versions, string in others
      const key =
        row.date instanceof Date
          ? row.date.toISOString().substring(0, 10)
          : String(row.date).substring(0, 10);
      map.set(key, parseInt(row.count, 10));
    }

    const result: { date: string; count: number }[] = [];
    const cursor = new Date(from);
    cursor.setHours(0, 0, 0, 0);

    const end = new Date(to);
    end.setHours(0, 0, 0, 0);

    while (cursor <= end) {
      const key = cursor.toISOString().substring(0, 10);
      result.push({ date: key, count: map.get(key) ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    return result;
  }
}
