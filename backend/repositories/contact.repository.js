import { prisma as defaultPrisma } from '../config/prisma.js';
import { createPrismaPgAdapter } from '../config/prismaAdapter.js';

export class ContactRepository {
  /**
   * Initializes ContactRepository with Prisma Client or test adapter.
   * @param {Object} [client=defaultPrisma] - PrismaClient instance or pool adapter
   */
  constructor(client = defaultPrisma) {
    this.prisma =
      client && typeof client.query === 'function' && !client.contact_messages
        ? createPrismaPgAdapter(client)
        : client;
  }

  /**
   * Persists a validated contact inquiry message into PostgreSQL via Prisma Client.
   * @param {Object} contactData 
   * @param {string} contactData.name - Sender full name
   * @param {string} contactData.email - Sender email
   * @param {string} [contactData.phone=null] - Sender contact phone
   * @param {string} [contactData.subject=null] - Inquiry topic
   * @param {string} contactData.message - Message body
   * @returns {Promise<Object>} Created record summary ({ id, name, email, subject, status, created_at })
   */
  async create({ name, email, phone = null, subject = null, message }) {
    const record = await this.prisma.contact_messages.create({
      data: {
        name,
        email,
        phone: phone || null,
        subject: subject || null,
        message,
        status: 'NEW',
      },
      select: {
        id: true,
        name: true,
        email: true,
        subject: true,
        status: true,
        created_at: true,
      },
    });

    return record;
  }

  /**
   * Retrieves a single contact message by primary key UUID.
   * @param {string} id - Contact message UUID
   * @returns {Promise<Object|null>} Full contact record or null
   */
  async findById(id) {
    if (!id) return null;
    const record = await this.prisma.contact_messages.findUnique({
      where: { id },
    });
    return record || null;
  }

  /**
   * Retrieves contact messages for a specific email address.
   * @param {string} email - Inquirer email
   * @returns {Promise<Array<Object>>} List of contact records
   */
  async findByEmail(email) {
    if (!email) return [];
    return this.prisma.contact_messages.findMany({
      where: { email: email.toLowerCase() },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Retrieves contact messages with optional status filter and pagination.
   * @param {Object} [options={}]
   * @param {string} [options.status=null] - Filter by status (NEW, READ, RESOLVED, ARCHIVED)
   * @param {number} [options.skip=0] - Offset count
   * @param {number} [options.take=20] - Limit count
   * @returns {Promise<Array<Object>>} List of contact records
   */
  async findMany({ status = null, skip = 0, take = 20 } = {}) {
    const where = {};
    if (status) {
      where.status = status.toUpperCase();
    }

    return this.prisma.contact_messages.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take,
    });
  }

  /**
   * Counts total contact messages with optional status filter.
   * @param {Object} [options={}]
   * @param {string} [options.status=null] - Filter by status
   * @returns {Promise<number>} Count
   */
  async count({ status = null } = {}) {
    const where = {};
    if (status) {
      where.status = status.toUpperCase();
    }

    return this.prisma.contact_messages.count({ where });
  }

  /**
   * Updates status for an existing contact message.
   * @param {string} id - Contact message UUID
   * @param {string} status - New status (NEW, READ, RESOLVED, ARCHIVED)
   * @returns {Promise<Object>} Updated contact record
   */
  async updateStatus(id, status) {
    return this.prisma.contact_messages.update({
      where: { id },
      data: {
        status: status.toUpperCase(),
        updated_at: new Date(),
      },
    });
  }
}

export const contactRepository = new ContactRepository();
export default contactRepository;
