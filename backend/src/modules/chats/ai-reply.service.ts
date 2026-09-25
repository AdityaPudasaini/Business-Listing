// ai-reply.service.ts — optional AI fallback for chats.service.ts.
// Used only when the keyword rules in ChatsService.generateReply() don't
// match anything. Returns null (never throws) whenever AI is off, not
// configured, or the call fails, so the caller can fall back to the
// existing generic message.
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Business } from '@prisma/client';

export interface AiChatMessage {
  from: string; // 'bot' | 'user' | 'owner' | 'admin'
  text: string;
}

const MAX_HISTORY_MESSAGES = 8; // keep the prompt small and cheap
const MAX_USER_TEXT_LENGTH = 800; // guard against pasted essays / abuse
const REQUEST_TIMEOUT_MS = 8000;

@Injectable()
export class AiReplyService {
  private readonly logger = new Logger(AiReplyService.name);

  constructor(private readonly config: ConfigService) {}

  async generateReply(
    business: Business,
    history: AiChatMessage[],
    userText: string,
  ): Promise<string | null> {
    const provider = (this.config.get<string>('AI_PROVIDER') ?? 'none').toLowerCase();
    if (provider === 'none') return null;

    const trimmedText = userText.slice(0, MAX_USER_TEXT_LENGTH);
    const systemPrompt = this.buildSystemPrompt(business);
    const recentHistory = history.slice(-MAX_HISTORY_MESSAGES);

    try {
      switch (provider) {
        case 'anthropic':
          return await this.callAnthropic(systemPrompt, recentHistory, trimmedText);
        case 'openai':
          return await this.callOpenAi(systemPrompt, recentHistory, trimmedText);
        case 'groq':
          return await this.callGroq(systemPrompt, recentHistory, trimmedText);
        default:
          this.logger.warn(`Unknown AI_PROVIDER: ${provider}`);
          return null;
      }
    } catch (err) {
      this.logger.error('AI reply failed', err as Error);
      return null;
    }
  }

  // Site-wide assistant used by the chat widget when no listing is open.
  // Stateless, no DB access — nothing to guard here beyond what generateReply
  // already does for the per-listing case.
  async generateGeneralReply(
    userText: string,
    history: AiChatMessage[] = [],
  ): Promise<string | null> {
    const provider = (this.config.get<string>('AI_PROVIDER') ?? 'none').toLowerCase();
    if (provider === 'none') return null;

    const trimmedText = userText.slice(0, MAX_USER_TEXT_LENGTH);
    const recentHistory = history.slice(-MAX_HISTORY_MESSAGES);

    const systemPrompt = [
      'You are the AI assistant for Localist, a directory where people find and book local businesses and business owners list their own.',
      'You help visitors:',
      '- find businesses (point them to the Listings page, where they can search and filter by category)',
      '- understand categories, bookings, reviews and listings',
      "- list their own business (point them to the add/register listing option in the navbar or on the homepage)",
      'You may also answer general conversational questions naturally.',
      "Do not invent facts about specific businesses (hours, prices, availability). If asked about a specific business, tell the user to open that business's listing page, where its chat can answer in detail.",
      'Keep answers friendly and concise (a few sentences).',
    ].join('\n');

    try {
      switch (provider) {
        case 'anthropic':
          return await this.callAnthropic(systemPrompt, recentHistory, trimmedText);
        case 'openai':
          return await this.callOpenAi(systemPrompt, recentHistory, trimmedText);
        case 'groq':
          return await this.callGroq(systemPrompt, recentHistory, trimmedText);
        default:
          return null;
      }
    } catch (err) {
      this.logger.error('General AI reply failed', err as Error);
      return null;
    }
  }

  // Only real business data goes in here — nothing invented — so the model
  // can't state prices, hours, or policies it was never given.
  private buildSystemPrompt(business: Business): string {
    const lines = [
      `You are the AI assistant for "${business.name}".`,
      `You are a helpful assistant for this business listing.`,
      `Use the business information below when available.`,
      `You may answer general conversational questions naturally.`,
      `Do not invent business-specific facts that are not provided.`,
      `If asked about unavailable business information, say you don't know and suggest contacting ${business.name} directly.`,
      `Be friendly, concise, and helpful.`,
      `Location: ${business.location ?? 'not listed'}`,
      business.services?.length ? `Services: ${business.services.join(', ')}` : null,
      business.paymentMethods?.length ? `Payment methods: ${business.paymentMethods.join(', ')}` : null,
      business.amenities?.length ? `Amenities: ${business.amenities.join(', ')}` : null,
      business.phone ? `Phone: ${business.phone}` : null,
      business.whatsapp ? `WhatsApp: ${business.whatsapp}` : null,
      business.email ? `Email: ${business.email}` : null,
      business.website ? `Website: ${business.website}` : null,
    ].filter(Boolean);

    return lines.join('\n');
  }

  private toProviderMessages(history: AiChatMessage[], userText: string) {
    const roleFor = (from: string) => (from === 'user' ? 'user' : 'assistant');
    const mapped = history.map((m) => ({ role: roleFor(m.from), content: m.text }));
    // The widget's greeting is a bot message, so history often starts with an
    // assistant turn — Anthropic rejects that. Drop leading assistant turns.
    while (mapped.length && mapped[0].role !== 'user') mapped.shift();
    return [...mapped, { role: 'user' as const, content: userText }];
  }

  private async callAnthropic(
    systemPrompt: string,
    history: AiChatMessage[],
    userText: string,
  ): Promise<string | null> {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      this.logger.warn('AI_PROVIDER=anthropic but ANTHROPIC_API_KEY is not set');
      return null;
    }
    const model = this.config.get<string>('AI_MODEL') ?? 'claude-sonnet-5';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 300,
          system: systemPrompt,
          messages: this.toProviderMessages(history, userText),
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        this.logger.error(`Anthropic API error ${res.status}: ${await res.text()}`);
        return null;
      }
      const data = await res.json();
      const text = data?.content
        ?.filter((block: { type: string }) => block.type === 'text')
        ?.map((block: { text: string }) => block.text)
        ?.join('')
        ?.trim();
      return text || null;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async callOpenAi(
    systemPrompt: string,
    history: AiChatMessage[],
    userText: string,
  ): Promise<string | null> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('AI_PROVIDER=openai but OPENAI_API_KEY is not set');
      return null;
    }
    const model = this.config.get<string>('AI_MODEL') ?? 'gpt-4o-mini';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: 300,
          messages: [{ role: 'system', content: systemPrompt }, ...this.toProviderMessages(history, userText)],
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        this.logger.error(`OpenAI API error ${res.status}: ${await res.text()}`);
        return null;
      }
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content?.trim();
      return text || null;
    } finally {
      clearTimeout(timeout);
    }
  }

  // Groq's API is OpenAI-compatible (same request/response shape), just a
  // different host and free/fast open models — good default for dev.
  private async callGroq(
    systemPrompt: string,
    history: AiChatMessage[],
    userText: string,
  ): Promise<string | null> {
    const apiKey = this.config.get<string>('GROQ_API_KEY');
    if (!apiKey) {
      this.logger.warn('AI_PROVIDER=groq but GROQ_API_KEY is not set');
      return null;
    }
    const model = this.config.get<string>('AI_MODEL') ?? 'llama-3.3-70b-versatile';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          // gpt-oss models "think" first and that counts against max_tokens,
          // so 300 could be used up before any answer is written (empty reply).
          max_tokens: 800,
          ...(model.includes('gpt-oss') ? { reasoning_effort: 'low' } : {}),
          messages: [{ role: 'system', content: systemPrompt }, ...this.toProviderMessages(history, userText)],
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        this.logger.error(`Groq API error ${res.status}: ${await res.text()}`);
        return null;
      }
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content?.trim();
      return text || null;
    } catch (err) {
      this.logger.error('Groq request failed', err as Error);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}