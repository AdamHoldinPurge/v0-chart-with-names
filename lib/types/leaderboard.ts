// =============================================================================
// LEADERBOARD TYPES
// These interfaces define the data structures for the leaderboard system.
// When connecting to real APIs, ensure the response data matches these types.
// =============================================================================

/**
 * User metrics from Aircall API
 * Maps to Aircall's user analytics data
 */
export interface UserMetrics {
  userId: string
  userName: string
  shortName: string
  calls: number // Number of dials/calls made
  talkTimeSeconds: number // Total talk time in seconds
  overallScore: number // Calculated overall performance score
  callsScore: number // Score based on call volume
  durationScore: number // Score based on talk duration
  rank: number // Current rank position
  isStandard?: boolean // Whether this is the "Standard" benchmark agent
}

/**
 * Calculated metrics with combined score
 * Used internally for sorting and display
 */
export interface UserMetricsWithScore extends UserMetrics {
  combinedScore: number // calls + talkTimeMinutes
}

/**
 * Google Calendar event
 * Maps to Google Calendar API event response
 */
export interface CalendarEvent {
  id: string
  title: string
  startTime: Date
  endTime: Date
  description?: string
  attendees?: string[]
  location?: string
  calendarId?: string // For multi-calendar support
  colorId?: string // Google Calendar color coding
  meetingLink?: string // Zoom/Meet link if applicable
}

/**
 * API response wrapper for leaderboard data
 */
export interface LeaderboardAPIResponse {
  success: boolean
  data: UserMetrics[]
  timestamp: string
  error?: string
}

/**
 * API response wrapper for calendar data
 */
export interface CalendarAPIResponse {
  success: boolean
  events: CalendarEvent[]
  timestamp: string
  error?: string
}

/**
 * Configuration for data fetching
 */
export interface FetchConfig {
  useMockData: boolean
  refreshInterval: number // in milliseconds
  dateRange: "today" | "yesterday" | "week"
}
