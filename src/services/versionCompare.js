/**
 * Aura Island - Version Comparison Utilities
 * Pure semver-like version comparator handling numbers, build tags, and pre-release identifiers
 */

export function parseVersion(vStr) {
  if (typeof vStr !== "string") return { major: 0, minor: 0, patch: 0, pre: "" };
  const cleaned = vStr.trim().replace(/^[vV]/, "");
  const [main, pre = ""] = cleaned.split("-");
  const parts = main.split(".").map((p) => parseInt(p, 10) || 0);

  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0,
    pre: pre.toLowerCase(),
  };
}

export function compareVersions(v1, v2) {
  const p1 = parseVersion(v1);
  const p2 = parseVersion(v2);

  if (p1.major !== p2.major) return p1.major > p2.major ? 1 : -1;
  if (p1.minor !== p2.minor) return p1.minor > p2.minor ? 1 : -1;
  if (p1.patch !== p2.patch) return p1.patch > p2.patch ? 1 : -1;

  // Handle pre-releases: a version without pre-release is newer than one with pre-release (1.0.0 > 1.0.0-beta)
  if (!p1.pre && p2.pre) return 1;
  if (p1.pre && !p2.pre) return -1;
  if (p1.pre && p2.pre) {
    if (p1.pre > p2.pre) return 1;
    if (p1.pre < p2.pre) return -1;
  }

  return 0;
}

export function isNewerVersion(currentVersion, remoteVersion) {
  return compareVersions(remoteVersion, currentVersion) > 0;
}
