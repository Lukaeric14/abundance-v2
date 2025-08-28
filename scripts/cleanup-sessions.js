#!/usr/bin/env node

/**
 * Session Cleanup Script
 * 
 * This script can be run periodically (via cron job) to clean up expired sessions.
 * 
 * Usage:
 *   node scripts/cleanup-sessions.js
 * 
 * Environment variables:
 *   CLEANUP_TOKEN - Token for authenticating cleanup requests
 *   NEXT_PUBLIC_BASE_URL - Base URL of the application (defaults to http://localhost:3000)
 */

const fetch = require('node-fetch')

async function cleanupSessions() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const token = process.env.CLEANUP_TOKEN || 'default-cleanup-token'

  try {
    console.log('Starting session cleanup...')
    
    const response = await fetch(`${baseUrl}/api/cleanup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    
    console.log('Cleanup completed successfully:')
    console.log(`- Deleted sessions: ${result.deletedSessions}`)
    console.log(`- Timestamp: ${result.timestamp}`)
    
    process.exit(0)
  } catch (error) {
    console.error('Cleanup failed:', error.message)
    process.exit(1)
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupSessions()
}

module.exports = { cleanupSessions }