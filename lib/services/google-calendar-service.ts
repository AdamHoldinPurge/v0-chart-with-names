// =============================================================================
// GOOGLE CALENDAR SERVICE
// Handles all data fetching from Google Calendar API.
// Currently uses mock data - flip USE_MOCK_DATA in api-config.ts to use real API.
// =============================================================================

import { API_CONFIG } from "@/lib/config/api-config"
import type { CalendarEvent, CalendarAPIResponse } from "@/lib/types/leaderboard"

// -----------------------------------------------------------------------------
// MOCK DATA
// Realistic test data for development. Remove when API is connected.
// -----------------------------------------------------------------------------
function generateMockEvents(): CalendarEvent[] {
  const now = new Date()
  const currentHour = now.getHours()

  // Generate events starting from current hour
  const events: CalendarEvent[] = [
    {
      id: "1",
      title: "Team Standup",
      startTime: new Date(new Date().setHours(currentHour, 0, 0, 0)),
      endTime: new Date(new Date().setHours(currentHour, 30, 0, 0)),
      description: "Daily team sync",
      attendees: ["Marcus", "Sarah", "James"],
    },
    {
      id: "2",
      title: "Client Call - Acme Corp",
      startTime: new Date(new Date().setHours(currentHour + 1, 0, 0, 0)),
      endTime: new Date(new Date().setHours(currentHour + 1, 45, 0, 0)),
      description: "Quarterly review meeting",
      location: "Zoom",
      meetingLink: "https://zoom.us/j/123456789",
    },
    {
      id: "3",
      title: "Sales Training",
      startTime: new Date(new Date().setHours(currentHour + 2, 0, 0, 0)),
      endTime: new Date(new Date().setHours(currentHour + 3, 0, 0, 0)),
      description: "New product features walkthrough",
    },
    {
      id: "4",
      title: "Pipeline Review",
      startTime: new Date(new Date().setHours(currentHour + 3, 30, 0, 0)),
      endTime: new Date(new Date().setHours(currentHour + 4, 0, 0, 0)),
      attendees: ["Emily", "Michael"],
    },
    {
      id: "5",
      title: "End of Day Wrap-up",
      startTime: new Date(new Date().setHours(currentHour + 4, 0, 0, 0)),
      endTime: new Date(new Date().setHours(currentHour + 4, 15, 0, 0)),
    },
  ]

  return events
}

// -----------------------------------------------------------------------------
// SERVICE FUNCTIONS
// -----------------------------------------------------------------------------

/**
 * Fetch calendar events from Google Calendar API or mock data
 * @param calendarId - Google Calendar ID (default: 'primary')
 * @param maxResults - Maximum number of events to return
 */
export async function fetchCalendarEvents(calendarId = "primary", maxResults = 10): Promise<CalendarAPIResponse> {
  // Return mock data if configured
  if (API_CONFIG.USE_MOCK_DATA) {
    return getMockCalendarData()
  }

  // ---------------------------------------------------------------------------
  // REAL API IMPLEMENTATION
  // Uncomment and modify when ready to connect to Google Calendar
  // ---------------------------------------------------------------------------
  try {
    const response = await fetch(`${API_CONFIG.INTERNAL.CALENDAR}?calendarId=${calendarId}&maxResults=${maxResults}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()

    // Transform Google Calendar response to our CalendarEvent type
    const events: CalendarEvent[] = (data.items || []).map((item: any) => ({
      id: item.id,
      title: item.summary || "Untitled Event",
      startTime: new Date(item.start?.dateTime || item.start?.date),
      endTime: new Date(item.end?.dateTime || item.end?.date),
      description: item.description,
      attendees: item.attendees?.map((a: any) => a.displayName || a.email),
      location: item.location,
      calendarId: calendarId,
      colorId: item.colorId,
      meetingLink: item.hangoutLink || item.conferenceData?.entryPoints?.[0]?.uri,
    }))

    return {
      success: true,
      events,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("[Google Calendar Service] Error fetching events:", error)
    return {
      success: false,
      events: [],
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Get mock calendar data for development
 */
function getMockCalendarData(): CalendarAPIResponse {
  return {
    success: true,
    events: generateMockEvents(),
    timestamp: new Date().toISOString(),
  }
}

/**
 * Filter events to show only upcoming (not yet ended)
 */
export function filterUpcomingEvents(events: CalendarEvent[], currentTime: Date): CalendarEvent[] {
  return events
    .filter((event) => event.endTime > currentTime)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
}

/**
 * Check if an event is currently happening
 */
export function isEventOngoing(event: CalendarEvent, currentTime: Date): boolean {
  return event.startTime <= currentTime && event.endTime > currentTime
}

/**
 * Get refresh interval for polling
 */
export function getCalendarRefreshInterval(): number {
  return API_CONFIG.GOOGLE_CALENDAR.REFRESH_INTERVAL
}

/**
 * Format event time for display
 */
export function formatEventTime(date: Date): string {
  const hours = date.getHours()
  const minutes = date.getMinutes().toString().padStart(2, "0")
  const period = hours >= 12 ? "PM" : "AM"
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes} ${period}`
}

/**
 * Calculate event duration in minutes
 */
export function getEventDurationMinutes(event: CalendarEvent): number {
  return Math.round((event.endTime.getTime() - event.startTime.getTime()) / 60000)
}
