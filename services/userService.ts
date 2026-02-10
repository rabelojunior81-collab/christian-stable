import { db } from '../db';
import { UserProfile, UserStats } from '../types';

export class UserService {
  
  // --- Identity ---

  async getUser(): Promise<UserProfile | undefined> {
    return await db.userProfile.orderBy('id').first();
  }

  async setUser(name: string): Promise<void> {
    const existing = await this.getUser();
    if (existing && existing.id) {
      await db.userProfile.update(existing.id, { name });
    } else {
      await db.userProfile.add({ name, joinedAt: Date.now() });
    }
  }

  async clearUser(): Promise<void> {
    await db.userProfile.clear();
    await db.userStats.clear();
  }

  // --- Gamification (Perseverance) ---

  async getStats(): Promise<UserStats> {
    let stats = await db.userStats.orderBy('id').first();
    if (!stats) {
       const initialStats: UserStats = {
         currentStreak: 1,
         maxStreak: 1,
         lastVisitDate: new Date().toISOString().split('T')[0]
       };
       await db.userStats.add(initialStats);
       return initialStats;
    }
    return stats;
  }

  async updateStreak(): Promise<UserStats> {
    const stats = await this.getStats();
    if (!stats || !stats.id) throw new Error("Stats not initialized");

    const today = new Date().toISOString().split('T')[0];
    const lastVisit = stats.lastVisitDate;

    // If already visited today, do nothing
    if (lastVisit === today) {
        return stats;
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    let newCurrent = stats.currentStreak;
    let newMax = stats.maxStreak;

    if (lastVisit === yesterday) {
        // Continued streak
        newCurrent += 1;
        if (newCurrent > newMax) newMax = newCurrent;
    } else {
        // Broken streak
        newCurrent = 1;
    }

    await db.userStats.update(stats.id, {
        currentStreak: newCurrent,
        maxStreak: newMax,
        lastVisitDate: today
    });

    return { ...stats, currentStreak: newCurrent, maxStreak: newMax, lastVisitDate: today };
  }
}

export const userService = new UserService();