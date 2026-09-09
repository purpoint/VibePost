/**
 * Up to two initials for the fallback avatar.
 */
export function initialsFrom(name = '', username = '') {
  const source = name.trim() || username.trim();
  if (!source) return '?';

  const words = source.split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? words[0][0] + words[words.length - 1][0] : source.slice(0, 2);

  return letters.toUpperCase();
}

/**
 * Picks a stable hue from the username, so a given user always gets the same
 * fallback colour across sessions and devices.
 */
export function avatarHue(username = '') {
  let hash = 0;
  for (let i = 0; i < username.length; i += 1) {
    hash = (hash * 31 + username.charCodeAt(i)) % 360;
  }
  return hash;
}
