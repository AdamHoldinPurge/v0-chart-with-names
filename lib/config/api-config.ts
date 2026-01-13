// =============================================================================
// API CONFIGURATION
// Central configuration for all API endpoints and settings.
// Update these values when connecting to real APIs.
// =============================================================================

export const API_CONFIG = {
  // -------------------------------------------------------------------------
  // MOCK DATA MODE
  // Set to false when ready to use real APIs
  // -------------------------------------------------------------------------
  USE_MOCK_DATA: true,

  // -------------------------------------------------------------------------
  // AIRCALL CONFIGURATION
  // Documentation: https://developer.aircall.io/api-references/
  // -------------------------------------------------------------------------
  AIRCALL: {
    BASE_URL: process.env.NEXT_PUBLIC_AIRCALL_API_URL || "https://api.aircall.io/v1",
    API_KEY: process.env.AIRCALL_API_KEY || "",
    API_SECRET: process.env.AIRCALL_API_SECRET || "",

    // Endpoints
    ENDPOINTS: {
      USERS: "/users",
      CALLS: "/calls",
      ANALYTICS: "/analytics",
      TEAMS: "/teams",
    },

    // Refresh interval in milliseconds (30 seconds)
    REFRESH_INTERVAL: 30000,
  },

  // -------------------------------------------------------------------------
  // GOOGLE CALENDAR CONFIGURATION
  // Documentation: https://developers.google.com/calendar/api
  // -------------------------------------------------------------------------
  GOOGLE_CALENDAR: {
    BASE_URL: "https://www.googleapis.com/calendar/v3",
    CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
    API_KEY: process.env.GOOGLE_CALENDAR_API_KEY || "",

    // Endpoints
    ENDPOINTS: {
      CALENDARS: "/calendars",
      EVENTS: "/events",
      CALENDAR_LIST: "/users/me/calendarList",
    },

    // Scopes needed for calendar access
    SCOPES: [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/calendar.events.readonly",
    ],

    // Refresh interval in milliseconds (60 seconds)
    REFRESH_INTERVAL: 60000,
  },

  // -------------------------------------------------------------------------
  // INTERNAL API ROUTES
  // These are the Next.js API routes that proxy requests to external APIs
  // -------------------------------------------------------------------------
  INTERNAL: {
    LEADERBOARD: "/api/leaderboard",
    CALENDAR: "/api/calendar",
  },

  // -------------------------------------------------------------------------
  // WORKDAY CONFIGURATION
  // Used for calculating "Standard" agent pace
  // -------------------------------------------------------------------------
  WORKDAY: {
    START_HOUR: 8,
    START_MINUTE: 30,
    END_HOUR: 16, // End at 4:30 PM for Standard calculation
    END_MINUTE: 30,
    DAILY_TARGET_POINTS: 300, // Target is 300 points by 4:30 PM
  },
} as const

// Type for the config
export type ApiConfig = typeof API_CONFIG
