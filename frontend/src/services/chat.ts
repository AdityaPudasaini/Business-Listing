
import { Business } from "@/types";
import { VerticalConfig } from "@/features/verticals";
// import { apiPost } from "@/services/api"; // uncomment when wiring a real backend

export interface ChatContext {
  vertical: VerticalConfig;
  business: Business | null;
}

export async function getChatReply(
  message: string,
  context: ChatContext,
): Promise<string> {
  const { vertical, business } = context;
  const lower = message.toLowerCase();

  // Listing-specific mode — a business is actively being viewed.
  if (business) {
    if (lower.includes("book")) {
      return `You can book directly with ${business.name} — I can open the booking form for you.`;
    }

    if (lower.includes("service")) {
      const serviceNames = business.services
        ?.flatMap((group) => group.items)
        .slice(0, 6)
        .join(", ");
      return serviceNames
        ? `${business.name} offers: ${serviceNames}.`
        : `${business.name} hasn't listed specific services yet — try contacting them directly for details.`;
    }

    if (
      lower.includes("locat") ||
      lower.includes("where") ||
      lower.includes("address") ||
      lower.includes("direction")
    ) {
      return `${business.name} is located at ${business.location}.`;
    }

    if (
      lower.includes("contact") ||
      lower.includes("phone") ||
      lower.includes("call") ||
      lower.includes("whatsapp")
    ) {
      return business.phone
        ? `You can reach ${business.name} at ${business.phone}${
            business.whatsapp ? ` (WhatsApp: ${business.whatsapp})` : ""
          }.`
        : `Contact details for ${business.name} are listed further up this page.`;
    }

    return `I'm not able to answer that in detail yet, but you can find more about ${business.name} further up this page, or ask me about booking, services, location, or contact info.`;
  }

  // General, site-wide mode — no specific business in view.
  if (
    lower.includes("find") ||
    lower.includes("browse") ||
    lower.includes("search")
  ) {
    return `You can browse every listed ${vertical.labels.business} on our Listings page — use the search bar or filter by category to narrow it down.`;
  }

  if (
    lower.includes("list") ||
    lower.includes("regist") ||
    lower.includes("add")
  ) {
    return `Great! Head to "${vertical.labels.addListing}" from the homepage or navbar to register your ${vertical.labels.business} — it only takes a few minutes.`;
  }

  return `I'm not able to answer that in detail yet, but you can reach a real person through the contact page, or ask me about finding or listing a ${vertical.labels.business}.`;
}