const { knex } = require("../config/database")

class WaitlistService {
  
  /**
   * Add a new waitlist entry
   */
  async addEntry(data) {
    const { email, username, description, ip_address, user_agent, referrer } = data

    try {
      console.log('Adding waitlist entry:', { email, username, description })

      // Check if email or username already exists
      const existing = await knex('waitlist')
        .where('email', email)
        .orWhere('username', username)
        .first()

      if (existing) {
        if (existing.email === email) {
          throw new Error('Email already registered on waitlist')
        }
        if (existing.username === username) {
          throw new Error('Username already taken')
        }
      }

      // Insert new entry
      const [entry] = await knex('waitlist')
        .insert({
          email,
          username,
          description: description || null,
          ip_address,
          user_agent,
          referrer,
          status: 'pending',
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*')

      console.log('Successfully added waitlist entry:', entry)
      return entry
    } catch (error) {
      console.error('Error adding waitlist entry:', error)
      throw error
    }
  }
  
  /**
   * Get all waitlist entries with pagination
   */
  async getEntries(page = 1, limit = 50, status = null) {
    try {
      console.log('Getting waitlist entries - page:', page, 'limit:', limit, 'status:', status)
      let query = knex('waitlist')

      if (status) {
        query = query.where('status', status)
      }

      const offset = (page - 1) * limit

      const [entries, totalCount] = await Promise.all([
        query.clone()
          .orderBy('created_at', 'desc')
          .limit(limit)
          .offset(offset),
        query.clone().count('* as count').first()
      ])

      console.log('Found entries:', entries.length, 'total count:', totalCount.count)

      return {
        entries,
        pagination: {
          page,
          limit,
          total: parseInt(totalCount.count),
          pages: Math.ceil(totalCount.count / limit)
        }
      }
    } catch (error) {
      console.error('Error in getEntries:', error)
      throw error
    }
  }
  
  /**
   * Get waitlist statistics
   */
  async getStats() {
    try {
      const [total, pending, approved, rejected, recent] = await Promise.all([
        knex('waitlist').count('* as count').first(),
        knex('waitlist').where('status', 'pending').count('* as count').first(),
        knex('waitlist').where('status', 'approved').count('* as count').first(),
        knex('waitlist').where('status', 'rejected').count('* as count').first(),
        knex('waitlist')
          .where('created_at', '>=', knex.raw("NOW() - INTERVAL '7 days'"))
          .count('* as count')
          .first()
      ])
      
      // Get daily signups for the last 30 days
      const dailySignups = await knex('waitlist')
        .select(knex.raw('DATE(created_at) as date'))
        .count('* as count')
        .where('created_at', '>=', knex.raw("NOW() - INTERVAL '30 days'"))
        .groupBy(knex.raw('DATE(created_at)'))
        .orderBy('date', 'desc')
      
      return {
        total: parseInt(total.count),
        pending: parseInt(pending.count),
        approved: parseInt(approved.count),
        rejected: parseInt(rejected.count),
        recent: parseInt(recent.count),
        daily_signups: dailySignups
      }
    } catch (error) {
      throw error
    }
  }
  
  /**
   * Update entry status
   */
  async updateStatus(id, status, adminNotes = null) {
    try {
      const [entry] = await knex('waitlist')
        .where('id', id)
        .update({
          status,
          admin_notes: adminNotes,
          updated_at: new Date()
        })
        .returning('*')
      
      return entry
    } catch (error) {
      throw error
    }
  }
  
  /**
   * Get entry by ID
   */
  async getEntry(id) {
    try {
      return await knex('waitlist').where('id', id).first()
    } catch (error) {
      throw error
    }
  }
  
  /**
   * Export waitlist data
   */
  async exportData(format = 'json') {
    try {
      const entries = await knex('waitlist')
        .select('email', 'username', 'description', 'status', 'created_at')
        .orderBy('created_at', 'desc')
      
      if (format === 'csv') {
        // Convert to CSV format
        const headers = ['Email', 'Username', 'Description', 'Status', 'Created At']
        const csvRows = [
          headers.join(','),
          ...entries.map(entry => [
            `"${entry.email}"`,
            `"${entry.username}"`,
            `"${(entry.description || '').replace(/"/g, '""')}"`,
            entry.status,
            entry.created_at
          ].join(','))
        ]
        return csvRows.join('\n')
      }
      
      return entries
    } catch (error) {
      throw error
    }
  }
}

module.exports = new WaitlistService()
