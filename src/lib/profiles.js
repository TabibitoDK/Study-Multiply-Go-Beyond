export const profiles = [
  {
    id: 1,
    name: "Aiko Tanaka",
    username: "aiko_t",
    bio: "Third year student at Akashi Kosen. Loves math, manga, and morning runs.",
    profileImage: "https://randomuser.me/api/portraits/women/44.jpg",
    backgroundImage: "https://images.unsplash.com/photo-1503264116251-35a269479413",
    location: "Kobe, Japan",
    joined: "2023-09-10",
    followers: 204,
    following: 186,
    posts: 12,
    tags: ["#study", "#motivation", "#morningroutine"],
  },
  {
    id: 2,
    name: "Haruto Sakamoto",
    username: "haruto.dev",
    bio: "Building small web tools and AI bots. Keep learning, keep coding.",
    profileImage: "https://randomuser.me/api/portraits/men/32.jpg",
    backgroundImage: "https://images.unsplash.com/photo-1526378722484-cc5c5101e8f1",
    location: "Tokyo, Japan",
    joined: "2024-02-01",
    followers: 315,
    following: 220,
    posts: 25,
    tags: ["#coding", "#ai", "#javascript"],
  },
  {
    id: 3,
    name: "Miyu Nishimura",
    username: "miyu_draws",
    bio: "Illustrator who sketches between study sessions. Caffeine powered dreamer.",
    profileImage: "https://randomuser.me/api/portraits/women/28.jpg",
    backgroundImage: "https://images.unsplash.com/photo-1486308510493-aa64833634ef",
    location: "Osaka, Japan",
    joined: "2024-05-12",
    followers: 487,
    following: 308,
    posts: 40,
    tags: ["#art", "#studybreak", "#illustration"],
  },
  {
    id: 4,
    name: "Ren Kobayashi",
    username: "ren.kb",
    bio: "Electrical engineering major and IoT hobbyist. Automating dorm life one sensor at a time.",
    profileImage: "https://randomuser.me/api/portraits/men/21.jpg",
    backgroundImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
    location: "Nagoya, Japan",
    joined: "2023-12-22",
    followers: 289,
    following: 250,
    posts: 17,
    tags: ["#engineering", "#iot", "#innovation"],
  },
  {
    id: 5,
    name: "Sora Fujimoto",
    username: "sora_fm",
    bio: "Loves languages and traveling. Currently studying Japanese, English, and Malay.",
    profileImage: "https://randomuser.me/api/portraits/women/56.jpg",
    backgroundImage: "https://images.unsplash.com/photo-1519999482648-25049ddd37b1",
    location: "Himeji, Japan",
    joined: "2024-07-03",
    followers: 133,
    following: 144,
    posts: 9,
    tags: ["#languagelearning", "#culture", "#travel"],
  },
];

const profileMap = new Map(profiles.map(profile => [profile.id, profile]));

export function getProfileById(id) {
  return profileMap.get(id) ?? null;
}

export function getProfilesExcept(id) {
  return profiles.filter(profile => profile.id !== id);
}
