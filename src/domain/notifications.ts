export function badgeCount(count: number) {
  return count <= 0 ? "" : count > 99 ? "99+" : String(Math.floor(count));
}
export function notificationGroup(kind: string) {
  return kind === "ACHIEVEMENT"
    ? "conquistas"
    : ["SUBSCRIPTION", "SECURITY", "SYSTEM"].includes(kind)
      ? "conta"
      : "estudos";
}
