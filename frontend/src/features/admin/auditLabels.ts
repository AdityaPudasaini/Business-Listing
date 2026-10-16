// auditLabels.ts -- turns raw audit events (action codes + metadata) into plain-language
// labels for the admin audit log page. Pure functions, so they are easy to test.
import type { AuditLogEntry } from "@/services/api";

export type Tone = "good" | "info" | "warn" | "bad";

export interface EventDescription {
  label: string;
  tone: Tone;
}

const EVENTS: Record<string, EventDescription> = {
  "auth.register": { label: "Account created", tone: "info" },
  "auth.login_success": { label: "Signed in", tone: "good" },
  "auth.login_failed": { label: "Failed sign-in", tone: "warn" },
  "auth.login_blocked": { label: "Sign-in blocked (account locked)", tone: "bad" },
  "auth.account_locked": { label: "Account locked after failed sign-ins", tone: "bad" },
  "auth.password_reset_requested": { label: "Password reset requested", tone: "info" },
  "auth.password_reset": { label: "Password reset", tone: "warn" },
  "auth.logout_all": { label: "Signed out of all devices", tone: "info" },
  "account.deleted": { label: "Account deleted", tone: "bad" },
  "listing.approved": { label: "Listing approved", tone: "good" },
  "listing.rejected": { label: "Listing rejected", tone: "warn" },
  "listing.admin_updated": { label: "Listing edited by an admin", tone: "info" },
  "listing.admin_deleted": { label: "Listing deleted by an admin", tone: "bad" },
  "listing.deleted": { label: "Listing deleted", tone: "warn" },
  "category.created": { label: "Category created", tone: "info" },
  "category.updated": { label: "Category updated", tone: "info" },
  "category.deleted": { label: "Category deleted", tone: "warn" },
  "hero_image.added": { label: "Homepage image added", tone: "info" },
  "hero_image.deleted": { label: "Homepage image removed", tone: "warn" },
  "popup_ad.saved": { label: "Popup ad updated", tone: "info" },
  "popup_ad.deleted": { label: "Popup ad removed", tone: "warn" },
  "announcement.sent": { label: "Announcement emailed to customers", tone: "info" },
  "broadcast.sent": { label: "Email sent to all users", tone: "info" },
};

function capitalize(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

export function describeEvent(entry: Pick<AuditLogEntry, "action" | "metadata">): EventDescription {
  const meta = entry.metadata ?? {};

  if (entry.action === "auth.social_login") {
    const provider = typeof meta.provider === "string" ? capitalize(meta.provider) : "";
    return { label: provider ? `Signed in with ${provider}` : "Signed in with a social account", tone: "good" };
  }
  if (entry.action === "user.role_changed") {
    return meta.role === "admin"
      ? { label: "User made an admin", tone: "warn" }
      : { label: "Admin access removed", tone: "warn" };
  }
  if (entry.action === "user.ban_changed") {
    return meta.isBanned === true
      ? { label: "User banned", tone: "bad" }
      : { label: "User unbanned", tone: "info" };
  }

  const known = EVENTS[entry.action];
  if (known) return known;
  // Unknown (newer) action: show it readably instead of hiding it.
  return { label: entry.action.replace(/[._]/g, " "), tone: "info" };
}

export function describeActor(
  entry: Pick<AuditLogEntry, "userId" | "userName" | "userEmail" | "metadata">,
): { primary: string; secondary: string } {
  if (entry.userName || entry.userEmail) {
    return {
      primary: entry.userName || entry.userEmail,
      secondary: entry.userName ? entry.userEmail : "",
    };
  }
  const attempted = typeof entry.metadata?.email === "string" ? entry.metadata.email : "";
  if (attempted) return { primary: "Unknown account", secondary: `Tried ${attempted}` };
  if (entry.userId) return { primary: "Deleted account", secondary: "" };
  return { primary: "Not signed in", secondary: "" };
}

// Extra context to show when a row is expanded ("role: admin"). The attempted email is
// already shown in the Who column, so it is left out here.
export function metadataLines(entry: Pick<AuditLogEntry, "metadata">): string[] {
  return Object.entries(entry.metadata ?? {})
    .filter(([key]) => key !== "email")
    .map(([key, value]) => `${key}: ${String(value)}`);
}

export const ACTION_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "All activity" },
  { value: "auth", label: "Sign-ins and passwords" },
  { value: "listing", label: "Listings" },
  { value: "user", label: "User roles and bans" },
  { value: "account", label: "Account deletions" },
  { value: "category", label: "Categories" },
  { value: "hero_image", label: "Homepage images" },
  { value: "popup_ad", label: "Popup ad" },
  { value: "announcement", label: "Announcements" },
  { value: "broadcast", label: "Email to all users" },
];
