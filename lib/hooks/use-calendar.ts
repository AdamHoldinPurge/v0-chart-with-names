// =============================================================================
// USE CALENDAR HOOK
// Custom hook for fetching and managing calendar data.
// Handles polling, filtering, and event status detection.
// =============================================================================

"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import type { CalendarEvent } from "@/lib/types/leaderboard"
import {
  fetchCalendarEvents,
  filterUpcomingEvents,
  getCalendarRefreshInterval,
} from "@/lib/services/google-calendar-service"

interface UseCalendarOptions {
  calendarId?: string
  maxResults?: number
  autoRefresh?: boolean
}

interface UseCalendarReturn {
  events: CalendarEvent[]
  upcomingEvents: CalendarEvent[]
  nextEvent: CalendarEvent | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  lastUpdated: Date | null
  currentTime: Date
}

/**
 * Hook for fetching and managing calendar data
 */
export function useCalendar(options: UseCalendarOptions = {}): UseCalendarReturn {
  const { calendarId = "primary", maxResults = 10, autoRefresh = true } = options

  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Fetch data function
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetchCalendarEvents(calendarId, maxResults)

      if (response.success) {
        setEvents(response.events)
        setLastUpdated(new Date(response.timestamp))
      } else {
        setError(response.error || "Failed to fetch calendar events")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }, [calendarId, maxResults])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh polling
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchData()
    }, getCalendarRefreshInterval())

    return () => clearInterval(interval)
  }, [autoRefresh, fetchData])

  // Update current time every second for accurate "NOW" detection
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Filter to upcoming events
  const upcomingEvents = useMemo(() => {
    return filterUpcomingEvents(events, currentTime)
  }, [events, currentTime])

  // Get next event
  const nextEvent = useMemo(() => {
    return upcomingEvents.length > 0 ? upcomingEvents[0] : null
  }, [upcomingEvents])

  return {
    events,
    upcomingEvents,
    nextEvent,
    isLoading,
    error,
    refetch: fetchData,
    lastUpdated,
    currentTime,
  }
}
