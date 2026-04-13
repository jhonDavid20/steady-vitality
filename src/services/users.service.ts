import fs from 'fs';
import { AppDataSource } from '../database/data-source';
import { User } from '../database/entities/User';
import { UserProfile, ActivityLevel, FitnessGoal, Gender } from '../database/entities/UserProfile';
import { PasswordService } from '../utils/password';

export interface OnboardingRequest {
  // Step 1 - Goal
  fitnessGoal: FitnessGoal;
  activityLevel: ActivityLevel;

  // Step 2 - Physical data
  dateOfBirth: string;
  gender: Gender;
  height: number;
  weight: number;
  targetWeight?: number;

  // Step 3 - Health
  medicalConditions?: string[];
  injuries?: string[];
  medications?: string[];
  allergies?: string[];

  // Step 4 - Preferences
  preferredWorkoutTime?: string;
  gymLocation?: string;
  timezone?: string;
  phone?: string;
}

export interface OnboardingResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
    isEmailVerified: boolean;
    hasCompletedOnboarding: boolean;
    updatedAt: Date;
  };
  profile?: Partial<UserProfile>;
}

export class UsersService {
  private userRepository = AppDataSource.getRepository(User);
  private profileRepository = AppDataSource.getRepository(UserProfile);

  async getProfile(userId: string): Promise<{ success: boolean; message?: string; user?: Partial<User> }> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId, isActive: true },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
          coachId: true,
          isEmailVerified: true,
          hasCompletedOnboarding: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true
        },
        relations: ['profile']
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      return { success: true, user };
    } catch (error) {
      console.error('Get profile error:', error);
      return { success: false, message: 'Failed to retrieve profile' };
    }
  }

  async updateProfile(userId: string, data: Partial<OnboardingRequest>): Promise<OnboardingResponse> {
    try {
      let profile = await this.profileRepository.findOne({ where: { userId } });

      if (!profile) {
        profile = this.profileRepository.create({ userId });
      }

      const fields: (keyof OnboardingRequest)[] = [
        'fitnessGoal', 'activityLevel', 'gender', 'height', 'weight',
        'targetWeight', 'medicalConditions', 'injuries', 'medications',
        'allergies', 'preferredWorkoutTime', 'gymLocation', 'timezone', 'phone'
      ];

      for (const field of fields) {
        if (data[field] !== undefined) {
          (profile as any)[field] = data[field];
        }
      }

      if (data.dateOfBirth !== undefined) {
        profile.dateOfBirth = data.dateOfBirth;
      }

      const savedProfile = await this.profileRepository.save(profile);

      return {
        success: true,
        message: 'Profile updated successfully',
        profile: savedProfile
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, message: 'Profile update failed' };
    }
  }

  async getUserProfileOnly(userId: string): Promise<{ success: boolean; profile?: UserProfile; message?: string }> {
    try {
      const profile = await this.profileRepository.findOne({ where: { userId } });
      if (!profile) return { success: false, message: 'Profile not found' };
      return { success: true, profile };
    } catch (error) {
      console.error('Get user profile error:', error);
      return { success: false, message: 'Failed to retrieve profile' };
    }
  }

  async updateUser(
    userId: string,
    data: { firstName?: string; lastName?: string; avatar?: string; timezone?: string },
  ): Promise<{ success: boolean; user?: Partial<User>; message?: string }> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId, isActive: true } });
      if (!user) return { success: false, message: 'User not found' };

      if (data.firstName !== undefined) user.firstName = data.firstName;
      if (data.lastName !== undefined) user.lastName = data.lastName;
      if (data.avatar !== undefined) user.avatar = data.avatar;

      const savedUser = await this.userRepository.save(user);

      if (data.timezone !== undefined) {
        let profile = await this.profileRepository.findOne({ where: { userId } });
        if (!profile) profile = this.profileRepository.create({ userId });
        profile.timezone = data.timezone;
        await this.profileRepository.save(profile);
      }

      return {
        success: true,
        message: 'User updated successfully',
        user: {
          id: savedUser.id,
          email: savedUser.email,
          username: savedUser.username,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          avatar: savedUser.avatar,
          role: savedUser.role,
          updatedAt: savedUser.updatedAt,
        },
      };
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, message: 'Failed to update user' };
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId, isActive: true } });
      if (!user) return { success: false, message: 'User not found' };

      const isValid = await user.validatePassword(currentPassword);
      if (!isValid) return { success: false, message: 'Current password is incorrect' };

      const validation = PasswordService.validatePassword(newPassword);
      if (!validation.isValid) return { success: false, message: validation.errors.join(', ') };

      user.setPassword(newPassword);
      await this.userRepository.save(user);

      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, message: 'Failed to change password' };
    }
  }

  /** Lightweight fetch of just the avatar field — used in the upload route. */
  async getUserAvatarPath(userId: string): Promise<{ avatar: string | null } | null> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: { avatar: true },
      });
      return user ? { avatar: user.avatar ?? null } : null;
    } catch {
      return null;
    }
  }

  /**
   * Save a new avatar file path to users.avatar and delete the old local file if present.
   * @param userId  Owner of the avatar
   * @param newPath Absolute disk path of the newly saved file
   * @param url     Public URL to store in the database
   */
  async updateAvatar(
    userId: string,
    newPath: string,
    url: string,
  ): Promise<{ success: boolean; url?: string; message: string }> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId, isActive: true },
        select: { id: true, avatar: true },
      });

      if (!user) return { success: false, message: 'User not found' };

      // Delete the old local file if it exists and points to /uploads/
      if (user.avatar && user.avatar.includes('/uploads/avatars/')) {
        try {
          const oldPath = newPath.replace(
            /\/uploads\/avatars\/.+$/,
            user.avatar.replace(/^https?:\/\/[^/]+/, ''),
          );
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        } catch {
          // Non-fatal — the new file is already saved
        }
      }

      await this.userRepository.update({ id: userId }, { avatar: url });

      return { success: true, url, message: 'Avatar updated' };
    } catch (error) {
      console.error('Update avatar error:', error);
      return { success: false, message: 'Failed to update avatar' };
    }
  }

  /**
   * Remove the user's avatar: delete the local file and set users.avatar = null.
   */
  async deleteAvatar(
    userId: string,
    uploadsRoot: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId, isActive: true },
        select: { id: true, avatar: true },
      });

      if (!user) return { success: false, message: 'User not found' };

      if (user.avatar && user.avatar.includes('/uploads/avatars/')) {
        try {
          const filename = user.avatar.split('/uploads/avatars/')[1];
          const filePath = `${uploadsRoot}/avatars/${filename}`;
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch {
          // Non-fatal
        }
      }

      await this.userRepository.update({ id: userId }, { avatar: null as any });

      return { success: true, message: 'Avatar removed' };
    } catch (error) {
      console.error('Delete avatar error:', error);
      return { success: false, message: 'Failed to remove avatar' };
    }
  }

  async softDelete(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId, isActive: true } });
      if (!user) return { success: false, message: 'User not found' };

      user.isActive = false;
      await this.userRepository.save(user);

      return { success: true, message: 'Account deactivated successfully' };
    } catch (error) {
      console.error('Soft delete error:', error);
      return { success: false, message: 'Failed to deactivate account' };
    }
  }

  async completeOnboarding(userId: string, data: OnboardingRequest): Promise<OnboardingResponse> {
    try {
      return await AppDataSource.transaction(async (manager) => {
        // Upsert UserProfile
        let profile = await manager.findOne(UserProfile, { where: { userId } });

        if (!profile) {
          profile = manager.create(UserProfile, { userId });
        }

        profile.fitnessGoal = data.fitnessGoal;
        profile.activityLevel = data.activityLevel;
        profile.dateOfBirth = data.dateOfBirth;
        profile.gender = data.gender;
        profile.height = data.height;
        profile.weight = data.weight;
        if (data.targetWeight !== undefined) profile.targetWeight = data.targetWeight;
        if (data.medicalConditions !== undefined) profile.medicalConditions = data.medicalConditions;
        if (data.injuries !== undefined) profile.injuries = data.injuries;
        if (data.medications !== undefined) profile.medications = data.medications;
        if (data.allergies !== undefined) profile.allergies = data.allergies;
        if (data.preferredWorkoutTime !== undefined) profile.preferredWorkoutTime = data.preferredWorkoutTime;
        if (data.gymLocation !== undefined) profile.gymLocation = data.gymLocation;
        if (data.timezone !== undefined) profile.timezone = data.timezone;
        if (data.phone !== undefined) profile.phone = data.phone;

        const savedProfile = await manager.save(UserProfile, profile);

        // Set hasCompletedOnboarding = true on user
        await manager.update(User, { id: userId }, { hasCompletedOnboarding: true });

        const updatedUser = await manager.findOne(User, {
          where: { id: userId },
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
            isEmailVerified: true,
            hasCompletedOnboarding: true,
            updatedAt: true
          }
        });

        return {
          success: true,
          message: 'Onboarding completed successfully',
          user: updatedUser!,
          profile: savedProfile
        };
      });
    } catch (error) {
      console.error('Complete onboarding error:', error);
      return {
        success: false,
        message: 'Onboarding failed. Please try again.'
      };
    }
  }
}
