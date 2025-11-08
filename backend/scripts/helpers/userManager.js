import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import User from '../../src/models/User.js';
import Profile from '../../src/models/Profile.js';

/**
 * Manage user creation and assignment during migration
 */
export class UserManager {
  constructor() {
    this.userMap = new Map(); // Maps old user IDs to new MongoDB ObjectIds
    this.createdUsers = []; // Track created users for rollback
  }

  /**
   * Generate a secure password hash for migration users
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  async generatePasswordHash(password = 'Migration123!') {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Create users from profile data
   * @param {Array} profiles - Array of profile data from frontend
   * @returns {Promise<Map>} Map of old user IDs to new ObjectIds
   */
  async createUsersFromProfiles(profiles) {
    console.log(`Creating users from ${profiles.length} profiles...`);
    
    for (const profile of profiles) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ 
          $or: [
            { username: profile.username },
            { email: `${profile.username.toLowerCase()}@example.com` }
          ]
        });

        if (existingUser) {
          console.log(`User ${profile.username} already exists, using existing user`);
          this.userMap.set(profile.id.toString(), existingUser._id.toString());
          continue;
        }

        // Generate password hash
        const passwordHash = await this.generatePasswordHash();

        // Create user data
        const userData = {
          username: profile.username,
          email: `${profile.username.toLowerCase()}@example.com`,
          passwordHash: passwordHash,
          preferences: {
            language: 'ja', // Default to Japanese based on profile data
            theme: 'light',
            timezone: 'Asia/Tokyo'
          },
          isActive: true
        };

        // Create user
        const user = new User(userData);
        await user.save();

        // Create profile for the user
        const profileData = {
          userId: user._id,
          name: profile.name,
          username: profile.username,
          bio: profile.bio,
          profileImage: profile.profileImage,
          backgroundImage: profile.backgroundImage,
          location: profile.location,
          joined: profile.joined ? new Date(profile.joined) : new Date(),
          followers: [],
          following: [],
          posts: profile.posts || 0,
          tags: profile.tags || [],
          stats: {
            booksRead: 0,
            studyStreak: 0,
            totalStudyHours: 0
          },
          privacy: {
            showEmail: false,
            showLocation: true,
            allowFollowers: true
          }
        };

        const userProfile = new Profile(profileData);
        await userProfile.save();

        // Store mapping
        this.userMap.set(profile.id.toString(), user._id.toString());
        this.createdUsers.push({
          userId: user._id,
          profileId: userProfile._id,
          username: profile.username
        });

        console.log(`Created user: ${profile.username} (${user._id})`);

      } catch (error) {
        console.error(`Error creating user for profile ${profile.username}:`, error.message);
        throw error;
      }
    }

    console.log(`Successfully created ${this.createdUsers.length} users`);
    return this.userMap;
  }

  /**
   * Create a default admin user if it doesn't exist
   * @returns {Promise<string>} ObjectId of the admin user
   */
  async createDefaultAdmin() {
    const adminUsername = 'admin';
    const adminEmail = 'admin@example.com';

    try {
      // Check if admin user already exists
      const existingAdmin = await User.findOne({ 
        $or: [
          { username: adminUsername },
          { email: adminEmail }
        ]
      });

      if (existingAdmin) {
        console.log('Admin user already exists');
        return existingAdmin._id.toString();
      }

      // Generate password hash for admin
      const passwordHash = await this.generatePasswordHash('Admin123!');

      // Create admin user
      const adminUser = new User({
        username: adminUsername,
        email: adminEmail,
        passwordHash: passwordHash,
        preferences: {
          language: 'en',
          theme: 'light',
          timezone: 'UTC'
        },
        isActive: true
      });

      await adminUser.save();

      // Create admin profile
      const adminProfile = new Profile({
        userId: adminUser._id,
        name: 'System Administrator',
        username: adminUsername,
        bio: 'Default admin user for the system',
        profileImage: '',
        backgroundImage: '',
        location: 'System',
        joined: new Date(),
        followers: [],
        following: [],
        posts: 0,
        tags: [],
        stats: {
          booksRead: 0,
          studyStreak: 0,
          totalStudyHours: 0
        },
        privacy: {
          showEmail: false,
          showLocation: false,
          allowFollowers: false
        }
      });

      await adminProfile.save();

      this.createdUsers.push({
        userId: adminUser._id,
        profileId: adminProfile._id,
        username: adminUsername
      });

      console.log(`Created admin user: ${adminUsername} (${adminUser._id})`);
      return adminUser._id.toString();

    } catch (error) {
      console.error('Error creating admin user:', error.message);
      throw error;
    }
  }

  /**
   * Get the ObjectId for a user by their old ID
   * @param {string|number} oldUserId - The old user ID from frontend
   * @returns {string|null} MongoDB ObjectId or null if not found
   */
  getUserId(oldUserId) {
    return this.userMap.get(oldUserId.toString()) || null;
  }

  /**
   * Get all user mappings
   * @returns {Map} Map of old user IDs to new ObjectIds
   */
  getUserMap() {
    return this.userMap;
  }

  /**
   * Get a list of all created users
   * @returns {Array} Array of created user info
   */
  getCreatedUsers() {
    return this.createdUsers;
  }

  /**
   * Rollback all created users and profiles
   * @returns {Promise<void>}
   */
  async rollback() {
    console.log('Rolling back created users...');
    
    for (const userInfo of this.createdUsers) {
      try {
        // Delete profile first (due to reference)
        await Profile.deleteOne({ userId: userInfo.userId });
        
        // Delete user
        await User.deleteOne({ _id: userInfo.userId });
        
        console.log(`Deleted user: ${userInfo.username}`);
      } catch (error) {
        console.error(`Error deleting user ${userInfo.username}:`, error.message);
      }
    }

    // Clear mappings
    this.userMap.clear();
    this.createdUsers = [];

    console.log('User rollback completed');
  }

  /**
   * Assign data to users based on a round-robin strategy
   * @param {Array} dataArray - Array of data to assign
   * @param {Array} userIds - Array of user ObjectIds to assign to
   * @returns {Array} Array of data with userId assignments
   */
  assignDataToUsersRoundRobin(dataArray, userIds) {
    if (!userIds || userIds.length === 0) {
      throw new Error('No users available for assignment');
    }

    return dataArray.map((item, index) => {
      const userId = userIds[index % userIds.length];
      return {
        ...item,
        userId: new mongoose.Types.ObjectId(userId)
      };
    });
  }

  /**
   * Assign data to users randomly
   * @param {Array} dataArray - Array of data to assign
   * @param {Array} userIds - Array of user ObjectIds to assign to
   * @returns {Array} Array of data with userId assignments
   */
  assignDataToUsersRandomly(dataArray, userIds) {
    if (!userIds || userIds.length === 0) {
      throw new Error('No users available for assignment');
    }

    return dataArray.map(item => {
      const randomIndex = Math.floor(Math.random() * userIds.length);
      const userId = userIds[randomIndex];
      return {
        ...item,
        userId: new mongoose.Types.ObjectId(userId)
      };
    });
  }

  /**
   * Get statistics about created users
   * @returns {Object} User statistics
   */
  getUserStats() {
    return {
      totalUsers: this.createdUsers.length,
      userMappings: this.userMap.size,
      usernames: this.createdUsers.map(u => u.username)
    };
  }
}

export default UserManager;