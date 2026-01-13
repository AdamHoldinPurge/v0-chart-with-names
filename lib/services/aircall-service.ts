// =============================================================================
// AIRCALL SERVICE
// Handles all data fetching from Aircall API.
// Currently uses mock data - flip USE_MOCK_DATA in api-config.ts to use real API.
// =============================================================================

import { API_CONFIG } from "@/lib/config/api-config"
import type { UserMetrics, LeaderboardAPIResponse } from "@/lib/types/leaderboard"

// -----------------------------------------------------------------------------
// MOCK DATA
// Realistic test data for development. Remove when API is connected.
// -----------------------------------------------------------------------------
const MOCK_USERS: UserMetrics[] = [
  {
    userId: "1",
    userName: "Marcus Johnson",
    shortName: "Marcus",
    calls: 87,
    talkTimeSeconds: 14400, // 240 mins
    overallScore: 95,
    callsScore: 92,
    durationScore: 88,
    rank: 1,
  },
  {
    userId: "2",
    userName: "Sarah Williams",
    shortName: "Sarah",
    calls: 72,
    talkTimeSeconds: 12600, // 210 mins
    overallScore: 89,
    callsScore: 85,
    durationScore: 82,
    rank: 2,
  },
  {
    userId: "3",
    userName: "James Chen",
    shortName: "James",
    calls: 65,
    talkTimeSeconds: 10800, // 180 mins
    overallScore: 84,
    callsScore: 80,
    durationScore: 78,
    rank: 3,
  },
  {
    userId: "4",
    userName: "Emily Davis",
    shortName: "Emily",
    calls: 58,
    talkTimeSeconds: 9000, // 150 mins
    overallScore: 79,
    callsScore: 75,
    durationScore: 72,
    rank: 4,
  },
  {
    userId: "5",
    userName: "Michael Brown",
    shortName: "Michael",
    calls: 52,
    talkTimeSeconds: 7200, // 120 mins
    overallScore: 74,
    callsScore: 70,
    durationScore: 68,
    rank: 5,
  },
  {
    userId: "6",
    userName: "Jessica Taylor",
    shortName: "Jessica",
    calls: 45,
    talkTimeSeconds: 5400, // 90 mins
    overallScore: 68,
    callsScore: 64,
    durationScore: 62,
    rank: 6,
  },
  {
    userId: "7",
    userName: "David Wilson",
    shortName: "David",
    calls: 38,
    talkTimeSeconds: 4200, // 70 mins
    overallScore: 62,
    callsScore: 58,
    durationScore: 55,
    rank: 7,
  },
  {
    userId: "8",
    userName: "Amanda Martinez",
    shortName: "Amanda",
    calls: 31,
    talkTimeSeconds: 3000, // 50 mins
    overallScore: 55,
    callsScore: 52,
    durationScore: 48,
    rank: 8,
  },
]

// -----------------------------------------------------------------------------
// SERVICE FUNCTIONS
// -----------------------------------------------------------------------------

/**
 * Fetch leaderboard data from Aircall API or mock data
 * @param dateRange - 'today' | 'yesterday' | 'week'
 */
export async function fetchLeaderboardData(
  dateRange: "today" | "yesterday" | "week" = "today",
): Promise<LeaderboardAPIResponse> {
  // Return mock data if configured
  if (API_CONFIG.USE_MOCK_DATA) {
    return getMockLeaderboardData()
  }

  // ---------------------------------------------------------------------------
  // REAL API IMPLEMENTATION
  // Uncomment and modify when ready to connect to Aircall
  // ---------------------------------------------------------------------------
  try {
    const response = await fetch(`${API_CONFIG.INTERNAL.LEADERBOARD}?day=${dateRange}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return {
      success: true,
      data: data.users || [],
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("[Aircall Service] Error fetching leaderboard:", error)
    return {
      success: false,
      data: [],
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Get mock leaderboard data for development
 */
function getMockLeaderboardData(): LeaderboardAPIResponse {
  // Simulate slight variations in data for realism
  const dataWithVariation = MOCK_USERS.map((user) => ({
    ...user,
    // Add small random variation to simulate real-time updates
    calls: user.calls + Math.floor(Math.random() * 3),
    talkTimeSeconds: user.talkTimeSeconds + Math.floor(Math.random() * 120),
  }))

  return {
    success: true,
    data: dataWithVariation,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Calculate the "Standard" agent metrics based on current time
 * This represents the target pace for the day
 */
export function calculateStandardAgentMetrics(currentTime: Date): UserMetrics {
  const { START_HOUR, START_MINUTE, END_HOUR, END_MINUTE, DAILY_TARGET_POINTS } = API_CONFIG.WORKDAY

  const start = new Date(currentTime)
  start.setHours(START_HOUR, START_MINUTE, 0, 0)

  const end = new Date(currentTime)
  end.setHours(END_HOUR, END_MINUTE, 0, 0)

  const now = currentTime.getTime()
  const startTime = start.getTime()
  const endTime = end.getTime()
  const totalDuration = endTime - startTime

  let targetTotal = 0

  if (now <= startTime) {
    targetTotal = 0
  } else if (now >= endTime) {
    targetTotal = DAILY_TARGET_POINTS
  } else {
    const elapsed = now - startTime
    const progress = elapsed / totalDuration
    targetTotal = Math.floor(progress * DAILY_TARGET_POINTS)
  }

  // Split roughly 50/50 between dials and talk time
  const dials = Math.floor(targetTotal / 2)
  const talkTimeMinutes = targetTotal - dials

  return {
    userId: "standard",
    userName: "Standard",
    shortName: "Standard",
    calls: dials,
    talkTimeSeconds: talkTimeMinutes * 60,
    overallScore: 0,
    callsScore: 0,
    durationScore: 0,
    rank: 0,
    isStandard: true,
  }
}

/**
 * Get refresh interval for polling
 */
export function getLeaderboardRefreshInterval(): number {
  return API_CONFIG.AIRCALL.REFRESH_INTERVAL
}
