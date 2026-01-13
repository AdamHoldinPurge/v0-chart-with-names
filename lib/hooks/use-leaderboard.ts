// =============================================================================
// USE LEADERBOARD HOOK
// Custom hook for fetching and managing leaderboard data.
// Handles polling, error states, and data transformation.
// =============================================================================

"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import type { UserMetrics, UserMetricsWithScore } from "@/lib/types/leaderboard"
import {
  fetchLeaderboardData,
  calculateStandardAgentMetrics,
  getLeaderboardRefreshInterval,
} from "@/lib/services/aircall-service"

interface UseLeaderboardOptions {
  dateRange?: "today" | "yesterday" | "week"
  autoRefresh?: boolean
}

interface UseLeaderboardReturn {
  data: UserMetricsWithScore[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  lastUpdated: Date | null
}

/**
 * Convert talk time seconds to minutes
 */
export function formatTalkTimeMinutes(seconds: number): number {
  return Math.round(seconds / 60)
}

/**
 * Hook for fetching and managing leaderboard data
 */
export function useLeaderboard(options: UseLeaderboardOptions = {}): UseLeaderboardReturn {
  const { dateRange = "today", autoRefresh = true } = options

  const [rawData, setRawData] = useState<UserMetrics[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Fetch data function
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetchLeaderboardData(dateRange)

      if (response.success) {
        setRawData(response.data)
        setLastUpdated(new Date(response.timestamp))
      } else {
        setError(response.error || "Failed to fetch leaderboard data")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }, [dateRange])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh polling
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchData()
      setCurrentTime(new Date())
    }, getLeaderboardRefreshInterval())

    return () => clearInterval(interval)
  }, [autoRefresh, fetchData])

  // Update current time every second for accurate Standard agent calculation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Compute sorted data with Standard agent included
  const data = useMemo((): UserMetricsWithScore[] => {
    const standardAgent = calculateStandardAgentMetrics(currentTime)
    const allData = [...rawData, standardAgent]

    return allData
      .map((item) => ({
        ...item,
        combinedScore: item.calls + formatTalkTimeMinutes(item.talkTimeSeconds),
      }))
      .sort((a, b) => b.combinedScore - a.combinedScore)
  }, [rawData, currentTime])

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    lastUpdated,
  }
}
