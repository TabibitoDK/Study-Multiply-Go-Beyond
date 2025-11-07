import profilesData from '../data/profiles.json'

export const profiles = profilesData;

const profileMap = new Map(profiles.map(profile => [profile.id, profile]));

export function getProfileById(id) {
  return profileMap.get(id) ?? null;
}

export function getProfilesExcept(id) {
  return profiles.filter(profile => profile.id !== id);
}
