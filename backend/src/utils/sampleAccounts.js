import bcrypt from 'bcrypt';
import { User, Profile } from '../models/index.js';

const SAMPLE_PASSWORD = 'pwd';
const SAMPLE_USERS = [
  {
    username: 'aiko_hennyu',
    email: 'aiko_hennyu@nyacademy.dev',
    name: 'Aiko Hennyu',
    location: 'Hyogo, Japan',
    bio: 'Mechatronics student focused on math + physics for university transfer.',
    tags: ['transfer', 'math', 'physics'],
    profileImage: 'https://randomuser.me/api/portraits/women/44.jpg',
    backgroundImage: 'https://images.unsplash.com/photo-1503264116251-35a269479413',
  },
  {
    username: 'haruto_study',
    email: 'haruto_study@nyacademy.dev',
    name: 'Haruto Sakamoto',
    location: 'Tokyo, Japan',
    bio: 'Preparing for the Tokyo Tech transfer exam. Linear algebra grind!',
    tags: ['tokyo-tech', 'linear-algebra', 'focus'],
    profileImage: 'https://randomuser.me/api/portraits/men/32.jpg',
    backgroundImage: 'https://images.unsplash.com/photo-1526378722484-cc5c5101e8f1',
  },
  {
    username: 'miyu_gakushu',
    email: 'miyu_gakushu@nyacademy.dev',
    name: 'Miyu Nishida',
    location: 'Kobe, Japan',
    bio: 'Future social science major. Writing practice every day.',
    tags: ['writing', 'essays', 'self-discipline'],
    profileImage: 'https://randomuser.me/api/portraits/women/28.jpg',
    backgroundImage: 'https://images.unsplash.com/photo-1486308510493-aa64833634ef',
  },
  {
    username: 'ren_math',
    email: 'ren_math@nyacademy.dev',
    name: 'Ren Kobayashi',
    location: 'Aichi, Japan',
    bio: 'Electrical engineering hopeful. Loves calculus problem sets.',
    tags: ['engineering', 'calculus', 'consistency'],
    profileImage: 'https://randomuser.me/api/portraits/men/21.jpg',
    backgroundImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
  },
  {
    username: 'sora_english',
    email: 'sora_english@nyacademy.dev',
    name: 'Sora Fujimoto',
    location: 'Mie, Japan',
    bio: 'Daily English reading streak. Sharing study tips for language exams.',
    tags: ['english', 'reading', 'streak'],
    profileImage: 'https://randomuser.me/api/portraits/women/56.jpg',
    backgroundImage: 'https://images.unsplash.com/photo-1519999482648-25049ddd37b1',
  },
];

async function ensureProfile(userDoc, sample) {
  const existingProfile = await Profile.findOne({ userId: userDoc._id });
  if (existingProfile) {
    return existingProfile;
  }

  const profile = new Profile({
    userId: userDoc._id,
    name: sample.name,
    username: sample.username,
    bio: sample.bio,
    profileImage: sample.profileImage,
    backgroundImage: sample.backgroundImage,
    location: sample.location,
    tags: sample.tags,
    followers: [],
    following: [],
    posts: 0,
    stats: {
      booksRead: 0,
      studyStreak: 0,
      totalStudyHours: 0,
    },
  });
  await profile.save();
  return profile;
}

export async function ensureSampleAccounts() {
  try {
    const passwordHash = await bcrypt.hash(SAMPLE_PASSWORD, 10);

    for (const sample of SAMPLE_USERS) {
      let user = await User.findOne({
        $or: [{ email: sample.email }, { username: sample.username }],
      });

      if (!user) {
        user = new User({
          username: sample.username,
          email: sample.email,
          passwordHash,
          preferences: {
            language: 'en',
            theme: 'light',
            timezone: 'Asia/Tokyo',
          },
        });
        await user.save();
      } else {
        const updates = {};
        if (user.email !== sample.email) {
          updates.email = sample.email;
        }
        const hasSamplePassword = await bcrypt.compare(SAMPLE_PASSWORD, user.passwordHash);
        if (!hasSamplePassword) {
          updates.passwordHash = passwordHash;
        }
        if (Object.keys(updates).length > 0) {
          user = await User.findByIdAndUpdate(user._id, updates, { new: true });
        }
      }

      await ensureProfile(user, sample);
    }

    console.log('[seed] Sample login accounts are ready.');
  } catch (error) {
    console.error('[seed] Failed to prepare sample accounts:', error);
  }
}

export default ensureSampleAccounts;
