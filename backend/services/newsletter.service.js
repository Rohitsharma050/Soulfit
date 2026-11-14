import crypto from 'crypto';
import { newsletterRepository } from '../repositories/newsletter.repository.js';
import { ApiError } from '../utils/ApiError.js';

export class NewsletterService {
  constructor(repo = newsletterRepository) {
    this.repo = repo;
  }

  /**
   * Generates a cryptographic token and its SHA-256 hash.
   */
  _generateToken() {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    return { rawToken, tokenHash };
  }

  /**
   * Hashes a raw token for database lookup.
   */
  _hashToken(rawToken) {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  /**
   * Subscribes an email to the Cosmic & Wellness Digest.
   * Handles new subscriptions, duplicate attempts, and re-activations idempotently.
   */
  async subscribe({ email, consent }) {
    if (!consent) {
      throw ApiError.badRequest('Consent is required to subscribe to the newsletter');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await this.repo.findByEmail(normalizedEmail);

    const { tokenHash } = this._generateToken();

    // 1. Case: Existing active subscriber
    if (existing && !existing.unsubscribed_at) {
      return {
        alreadySubscribed: true,
        email: existing.email,
        subscribedAt: existing.subscribed_at,
        message: 'This email is already part of our Cosmic & Wellness Digest circle.',
      };
    }

    // 2. Case: Existing but previously unsubscribed subscriber (reactivation)
    if (existing && existing.unsubscribed_at) {
      const updated = await this.repo.resubscribe({
        email: normalizedEmail,
        consent: true,
        unsubscribeTokenHash: tokenHash,
      });

      return {
        alreadySubscribed: false,
        resubscribed: true,
        email: updated.email,
        subscribedAt: updated.subscribed_at,
        message: 'Welcome back! Your subscription to the Cosmic & Wellness Digest has been restored.',
      };
    }

    // 3. Case: Brand new subscriber
    const created = await this.repo.createSubscriber({
      email: normalizedEmail,
      consent: true,
      unsubscribeTokenHash: tokenHash,
    });

    return {
      alreadySubscribed: false,
      resubscribed: false,
      email: created.email,
      subscribedAt: created.subscribed_at,
      message: 'Thank you for joining our circle. Your subscription has been confirmed.',
    };
  }

  /**
   * Unsubscribes an email using a verified token.
   */
  async unsubscribe(rawToken) {
    if (!rawToken || rawToken.trim() === '') {
      throw ApiError.badRequest('Unsubscribe token is required');
    }

    const tokenHash = this._hashToken(rawToken.trim());
    const unsubscribed = await this.repo.unsubscribeByTokenHash(tokenHash);

    if (!unsubscribed) {
      throw ApiError.badRequest('Invalid, expired, or already processed unsubscribe token');
    }

    return {
      email: unsubscribed.email,
      unsubscribedAt: unsubscribed.unsubscribed_at,
      message: 'You have been successfully unsubscribed from the Cosmic & Wellness Digest.',
    };
  }
}

export const newsletterService = new NewsletterService();
export default newsletterService;
