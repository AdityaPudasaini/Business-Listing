// listing-validators.ts — validation helpers shared by CreateBusinessDto and UpdateBusinessDto,
// so the two can't drift apart (create used to be stricter than update).

// Optional field: skip validation when missing or blank, otherwise run the validators.
export const isProvided = (_: unknown, value: unknown) =>
  value !== undefined && value !== null && value !== '';

// Website / social links: a full http(s) URL (blocks javascript:, data:, etc.).
export const httpUrlOptions = { protocols: ['http', 'https'], require_protocol: true };

// Image URLs: same, but in development they look like http://localhost:3001/files/x.jpg,
// which has no TLD, so don't require one.
export const imageUrlOptions = { protocols: ['http', 'https'], require_protocol: true, require_tld: false };
