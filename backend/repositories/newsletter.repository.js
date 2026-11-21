import { prisma } from '../config/prisma.js';
import { createPrismaPgAdapter } from '../config/prismaAdapter.js';

export class NewsletterRepository {
  /**
   * Initializes the repository with Prisma Client.
   * If a custom client is supplied (e.g. pg-mem pool during automated tests),
   * it adapts it to provide Prisma model delegates.
   * @param {Object} [client=prisma] - PrismaClient instance or test adapter
   */
  constructor(client = prisma) {
    this.prisma =
      client && typeof client.query === 'function' && !client.subscribers
        ? createPrismaPgAdapter(client)
        : client;
  }

  /**
   * Finds subscriber record by email (case-insensitive).
   * @param {string} email 
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    if (!email) return null;

    const subscriber = await this.prisma.subscribers.findFirst({
      where: {
        email: {
          equals: email.trim().toLowerCase(),
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        email: true,
        consent: true,
        subscribed_at: true,
        unsubscribed_at: true,
        unsubscribe_token_hash: true,
      },
    });

    return subscriber || null;
  }

  /**
   * Inserts a new newsletter subscriber.
   * @param {Object} subscriberData 
   * @returns {Promise<Object>}
   */
  async createSubscriber({ email, consent = true, unsubscribeTokenHash = null }) {
    const isConsentGiven =
      typeof consent === 'string'
        ? consent.toLowerCase() === 'true'
        : Boolean(consent);

    return await this.prisma.subscribers.create({
      data: {
        email: email.trim().toLowerCase(),
        consent: isConsentGiven,
        unsubscribe_token_hash: unsubscribeTokenHash,
        unsubscribed_at: null,
      },
      select: {
        id: true,
        email: true,
        consent: true,
        subscribed_at: true,
      },
    });
  }

  /**
   * Reactivates a previously unsubscribed email.
   * @param {Object} param0 
   * @returns {Promise<Object>}
   */
  async resubscribe({ email, consent = true, unsubscribeTokenHash = null }) {
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await this.prisma.subscribers.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
      },
      select: { id: true },
    });

    if (!existing) return null;

    const isConsentGiven =
      typeof consent === 'string'
        ? consent.toLowerCase() === 'true'
        : Boolean(consent);

    const updateData = {
      consent: isConsentGiven,
      subscribed_at: new Date(),
      unsubscribed_at: null,
      updated_at: new Date(),
    };

    if (unsubscribeTokenHash) {
      updateData.unsubscribe_token_hash = unsubscribeTokenHash;
    }

    return await this.prisma.subscribers.update({
      where: { id: existing.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        consent: true,
        subscribed_at: true,
      },
    });
  }

  /**
   * Finds subscriber by unsubscribe token hash.
   * @param {string} tokenHash 
   * @returns {Promise<Object|null>}
   */
  async findByTokenHash(tokenHash) {
    if (!tokenHash) return null;

    const subscriber = await this.prisma.subscribers.findFirst({
      where: {
        unsubscribe_token_hash: tokenHash,
      },
      select: {
        id: true,
        email: true,
        consent: true,
        subscribed_at: true,
        unsubscribed_at: true,
      },
    });

    return subscriber || null;
  }

  /**
   * Marks a subscriber as unsubscribed by token hash atomically.
   * Uses updateMany with a conditional predicate to prevent race conditions.
   * Returns null if token is not found or is already unsubscribed.
   * @param {string} tokenHash 
   * @returns {Promise<Object|null>}
   */
  async unsubscribeByTokenHash(tokenHash) {
    if (!tokenHash) return null;

    const now = new Date();

    // Perform atomic conditional update: must match token hash AND be currently active
    const result = await this.prisma.subscribers.updateMany({
      where: {
        unsubscribe_token_hash: tokenHash,
        unsubscribed_at: null,
      },
      data: {
        unsubscribed_at: now,
        consent: false,
        updated_at: now,
      },
    });

    // If 0 rows were updated, the token is invalid or was already processed concurrently
    if (result.count === 0) {
      return null;
    }

    // Exactly 1 row was updated by this call; fetch the updated fields
    const subscriber = await this.prisma.subscribers.findFirst({
      where: {
        unsubscribe_token_hash: tokenHash,
      },
      select: {
        id: true,
        email: true,
        unsubscribed_at: true,
      },
    });

    return subscriber || null;
  }
}

export const newsletterRepository = new NewsletterRepository();
export default newsletterRepository;
