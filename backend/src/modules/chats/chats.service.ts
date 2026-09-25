// chats.service.ts — visitor chat sessions per listing. Replies are generated
// entirely from data already in the database — no external API involved.
// An owner or admin can take over a session (their replies stop the bot) and
// either side can end it.
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Business } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StartChatDto } from './dto/start-chat.dto';
import { SendChatMessageDto } from './dto/send-chat-message.dto';

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

@Injectable()
export class ChatsService {
  constructor(private prisma: PrismaService) {}

  async start(userId: string | undefined, dto: StartChatDto) {
    const business = await this.prisma.business.findUnique({
      where: { id: dto.businessId },
    });
    // Only approved listings are public, so only they can be chatted with —
    // same rule GET /businesses/:id uses, and it stops chats being opened
    // on pending/rejected listings by anyone who knows the id.
    if (!business || business.status !== 'approved') {
      throw new NotFoundException('Business not found');
    }

    let visitorName = dto.visitorName?.trim() || undefined;
    if (userId && !visitorName) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      visitorName = user?.name;
    }

    const session = await this.prisma.chatSession.create({
      data: { businessId: dto.businessId, userId: userId ?? null, visitorName },
      include: { business: { select: { id: true, name: true, slug: true } } },
    });

    const greeting = `Hi${visitorName ? ' ' + visitorName : ''} 👋 I can help with questions about ${business.name}.`;
    await this.prisma.chatMessage.create({
      data: { sessionId: session.id, from: 'bot', text: greeting },
    });

    return { ...session, greeting };
  }

  async sendMessage(sessionId: string, dto: SendChatMessageDto) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { business: true },
    });
    // A listing that has since gone back to pending (an owner edit does this)
    // is no longer public, so its chats stop answering too.
    if (!session || session.business.status !== 'approved') {
      throw new NotFoundException('Chat session not found');
    }
    if (session.endedAt) throw new BadRequestException('This chat has ended');

    const text = dto.text?.trim();
    if (!text) throw new BadRequestException('Message cannot be empty');

    await this.prisma.chatMessage.create({
      data: { sessionId, from: 'user', text },
    });

    // A human (owner/admin) has joined this chat — save the visitor's message
    // but don't let the auto-reply bot talk over them.
    if (session.takenOver) {
      await this.prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      });
      return { takenOver: true, reply: null };
    }

    const replyText = await this.generateReply(session.business, text);

    const botMessage = await this.prisma.chatMessage.create({
      data: { sessionId, from: 'bot', text: replyText },
    });

    await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    return { takenOver: false, reply: botMessage };
  }

  // Visitor ends their chat from the widget. Idempotent. Like sendMessage, the
  // unguessable session id is the credential (guests have no JWT).
  async end(sessionId: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: { endedAt: true },
    });
    if (!session) throw new NotFoundException('Chat session not found');
    if (!session.endedAt) {
      await this.prisma.chatSession.update({
        where: { id: sessionId },
        data: { endedAt: new Date() },
      });
    }
    return { ended: true };
  }

  // Owner or admin closes a chat from the dashboard / admin panel. Leaves a
  // closing message in the thread so the visitor's widget (which polls) shows
  // who ended it, then flips endedAt so nobody can add more messages.
  async close(sessionId: string, actor: { userId: string; role: string }) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { business: { select: { ownerId: true } } },
    });
    if (!session) throw new NotFoundException('Chat session not found');

    const isOwner = session.business.ownerId === actor.userId;
    if (!isOwner && actor.role !== 'admin') {
      throw new ForbiddenException('You can only end chats on your own listings');
    }
    if (session.endedAt) return { ended: true, message: null };

    const [message] = await this.prisma.$transaction([
      this.prisma.chatMessage.create({
        data: {
          sessionId,
          from: isOwner ? 'owner' : 'admin',
          text: isOwner
            ? 'This chat was ended by the owner.'
            : 'This chat was ended by the support team.',
        },
      }),
      this.prisma.chatSession.update({
        where: { id: sessionId },
        data: { endedAt: new Date(), takenOver: true },
      }),
    ]);
    return { ended: true, message };
  }

  // Visitor-side polling: the widget calls this every few seconds so replies
  // from the owner/admin show up without a page refresh. Guests have no JWT,
  // so (like sendMessage) the unguessable session id is the access token.
  async getMessages(sessionId: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: {
        takenOver: true,
        endedAt: true,
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!session) throw new NotFoundException('Chat session not found');
    return {
      takenOver: session.takenOver,
      endedAt: session.endedAt,
      messages: session.messages,
    };
  }

  // Owner or admin replies into a visitor's chat. The sender label is derived
  // from who they are, never from the request body, so it can't be spoofed.
  async reply(sessionId: string, actor: { userId: string; role: string }, dto: SendChatMessageDto) {
    const text = dto.text?.trim();
    if (!text) throw new BadRequestException('Message cannot be empty');

    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { business: { select: { ownerId: true } } },
    });
    if (!session) throw new NotFoundException('Chat session not found');
    if (session.endedAt) {
      throw new BadRequestException('The visitor has ended this chat');
    }

    const isOwner = session.business.ownerId === actor.userId;
    const isAdmin = actor.role === 'admin';
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You can only reply to chats on your own listings');
    }

    const [message] = await this.prisma.$transaction([
      this.prisma.chatMessage.create({
        data: { sessionId, from: isOwner ? 'owner' : 'admin', text },
      }),
      this.prisma.chatSession.update({
        where: { id: sessionId },
        data: { takenOver: true }, // @updatedAt bumps automatically
      }),
    ]);
    return message;
  }

  private async generateReply(business: Business, userText: string): Promise<string> {
    const lower = userText.toLowerCase();

    if (/\bbook/.test(lower)) {
      return `You can book directly with ${business.name} — use the "Book here" option or the booking form on this page.`;
    }

    if (
      lower.includes('product') ||
      lower.includes('price') ||
      lower.includes('cost') ||
      lower.includes('menu')
    ) {
      const products = await this.prisma.product.findMany({
        where: { businessId: business.id, isAvailable: true },
        take: 6,
        orderBy: { createdAt: 'desc' },
      });
      if (products.length) {
        const list = products
          .map((p) => (p.price ? `${p.name} (Rs ${p.price})` : p.name))
          .join(', ');
        return `${business.name} currently lists: ${list}.`;
      }
      return `${business.name} hasn't added specific products or prices yet — best to ask them directly.`;
    }

    if (lower.includes('service')) {
      return business.services?.length
        ? `${business.name} offers: ${business.services.slice(0, 6).join(', ')}.`
        : `${business.name} hasn't listed specific services yet — try contacting them directly.`;
    }

    if (
      lower.includes('locat') ||
      lower.includes('where') ||
      lower.includes('address') ||
      lower.includes('direction')
    ) {
      return `${business.name} is located at ${business.location}.`;
    }

    if (
      lower.includes('hour') ||
      lower.includes('open') ||
      lower.includes('close') ||
      lower.includes('time')
    ) {
      const formatted = this.formatHours(business.hours);
      return formatted
        ? `${business.name}'s hours — ${formatted}.`
        : `${business.name} hasn't listed specific hours yet — best to call ahead.`;
    }

    if (lower.includes('rating') || lower.includes('review')) {
      const reviewCount = await this.prisma.review.count({
        where: { businessId: business.id },
      });
      return reviewCount
        ? `${business.name} has a ${business.rating.toFixed(1)}★ rating from ${reviewCount} review${reviewCount === 1 ? '' : 's'}.`
        : `${business.name} doesn't have any reviews yet.`;
    }

    if (lower.includes('payment') || lower.includes('pay')) {
      return business.paymentMethods?.length
        ? `${business.name} accepts: ${business.paymentMethods.join(', ')}.`
        : `${business.name} hasn't listed accepted payment methods — best to ask them directly.`;
    }

    if (lower.includes('amenit') || lower.includes('parking') || lower.includes('wifi')) {
      return business.amenities?.length
        ? `${business.name} offers: ${business.amenities.join(', ')}.`
        : `${business.name} hasn't listed amenities yet.`;
    }

    if (
      lower.includes('contact') ||
      lower.includes('phone') ||
      lower.includes('call') ||
      lower.includes('whatsapp')
    ) {
      const parts: string[] = [];
      if (business.phone) parts.push(`call ${business.phone}`);
      if (business.whatsapp) parts.push(`WhatsApp ${business.whatsapp}`);
      if (business.email) parts.push(`email ${business.email}`);
      return parts.length
        ? `You can reach ${business.name} — ${parts.join(', or ')}.`
        : `Contact details for ${business.name} are listed further up this page.`;
    }

    if (lower.includes('website')) {
      return business.website
        ? `${business.name}'s website: ${business.website}`
        : `${business.name} doesn't have a website listed yet.`;
    }

    return `I'm not able to answer that in detail yet, but you can find more about ${business.name} further up this page, or ask me about booking, services, products/prices, hours, location, ratings, or contact info.`;
  }

  // Business.hours is stored by the create/update DTOs as an object keyed by day,
  // e.g. { monday: { open: "09:00", close: "18:00" }, sunday: null } (null = closed).
  // An array of { day, hours } is also accepted so older/other shapes still work.
  private formatHours(raw: unknown): string | null {
    const rows: { day: string; hours: string }[] = [];

    if (Array.isArray(raw)) {
      for (const entry of raw) {
        const e = entry as { day?: unknown; hours?: unknown } | null;
        if (typeof e?.day === 'string' && typeof e?.hours === 'string') {
          rows.push({ day: e.day, hours: e.hours });
        }
      }
    } else if (raw && typeof raw === 'object') {
      const obj = raw as Record<string, unknown>;
      const rank = (key: string) => {
        const i = DAY_ORDER.indexOf(key.toLowerCase());
        return i === -1 ? 99 : i;
      };
      for (const key of Object.keys(obj).sort((a, b) => rank(a) - rank(b))) {
        const slot = obj[key] as { open?: unknown; close?: unknown } | null;
        const day = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
        rows.push({
          day,
          hours:
            slot && typeof slot.open === 'string' && typeof slot.close === 'string'
              ? `${slot.open} - ${slot.close}`
              : 'Closed',
        });
      }
    }

    return rows.length ? rows.map((r) => `${r.day}: ${r.hours}`).join(', ') : null;
  }

  private readonly sessionInclude = {
    business: { select: { id: true, name: true, slug: true } },
    user: { select: { id: true, name: true, email: true } },
    messages: { orderBy: { createdAt: 'asc' as const } },
  };

  async findForOwner(ownerId: string) {
    return this.prisma.chatSession.findMany({
      where: { business: { ownerId } },
      orderBy: { updatedAt: 'desc' },
      take: 100, // newest 100 sessions; the log page has no pagination yet
      include: this.sessionInclude,
    });
  }

  // Admin: every chat on every listing, newest activity first.
  async findAllForAdmin() {
    return this.prisma.chatSession.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 200,
      include: this.sessionInclude,
    });
  }
}