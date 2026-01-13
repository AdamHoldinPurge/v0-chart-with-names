"use client"

import { Poppins } from "next/font/google"
import { useSearchParams } from "next/navigation"
import type React from "react"
import { Suspense, useEffect, useState } from "react"
import { Calendar, Clock, Users } from "lucide-react"

import type { UserMetricsWithScore, CalendarEvent } from "@/lib/types/leaderboard"
import { useLeaderboard, formatTalkTimeMinutes } from "@/lib/hooks/use-leaderboard"
import { useCalendar } from "@/lib/hooks/use-calendar"
import { formatEventTime, getEventDurationMinutes, isEventOngoing } from "@/lib/services/google-calendar-service"

// Import Poppins font
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-poppins",
})

// SVG Icon component (same as sidebar)
const SvgIcon: React.FC<React.SVGProps<SVGSVGElement> & { uniqueId?: string }> = ({ uniqueId = "", ...props }) => {
  const gradientId1 = `linear-gradient${uniqueId}`
  const gradientId2 = `linear-gradient-2${uniqueId}`

  return (
    <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" {...props}>
      <defs>
        <linearGradient id={gradientId1} x1="57.58" x2="453.52" y1="255.14" y2="255.14" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ff5d00"></stop>
          <stop offset="1" stopColor="orange"></stop>
        </linearGradient>
        <linearGradient
          xlinkHref={`#${gradientId1}`}
          id={gradientId2}
          x1="67.06"
          x2="292.51"
          y1="334.52"
          y2="334.52"
        ></linearGradient>
      </defs>
      <path
        fill={`url(#${gradientId1})`}
        d="M115.27 153.94c60.54-.92 92.47-.53 139.16-.81h.15c50.76 6.38 88.96 49.76 88.93 99.86-.03 48.22-35.48 90.44-83.93 98.99-.05 0-.09.01-.14.02l-48.37 2.37c-9.06.44-17.26 5.52-21.7 13.43l-48.4 86.19c-2.84 5.05.81 11.28 6.6 11.28h110.19C369.36 455.94 454.97 361.25 453.5 252c-1.41-105.07-82.98-195.15-189.94-206.99h-.12c-66.56.1-133.12.2-199.68.29-4.66 0-7.63 4.97-5.44 9.08l51.4 96.3a6.19 6.19 0 0 0 5.54 3.27Z"
      />
      <path
        fill={`url(#${gradientId2})`}
        d="M70.5 466c-2.04.32-3.84-1.65-3.36-3.67l60.74-254.1c.07-.33.19-.65.36-.93a8.92 8.92 0 0 1 7.63-4.3h106.07c12.51 0 24.71 4.47 33.89 12.96 10.59 9.8 17 23.87 16.67 39.04-.49 22.6-15.82 42.16-37.14 48.47-3.56 1.05-7.27 1.53-10.99 1.53h-68.95c-4.29 0-8.27 2.25-10.49 5.92"
      />
    </svg>
  )
}

const LeaderboardPanel = ({ data }: { data: UserMetricsWithScore[] }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300)
    return () => clearTimeout(timer)
  }, [])

  const maxCombinedScore = Math.max(...data.map((d) => d.combinedScore), 1)

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header Section */}
      <div className="flex justify-between items-end border-b border-white/10 pb-4 mb-6">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-white uppercase mb-2">Leaderboard</h1>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-500 text-sm font-bold uppercase tracking-widest rounded-md">
              Combined Metrics
            </span>
            <span className="text-zinc-500 text-sm uppercase tracking-widest font-semibold">Daily Performance</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-8 bg-zinc-900/50 px-6 py-3 rounded-xl border border-white/5">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Metric A</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.6)]"></div>
              <span className="text-base font-bold text-zinc-300">Dials</span>
            </div>
          </div>
          <div className="w-px bg-white/10"></div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Metric B</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.6)]"></div>
              <span className="text-base font-bold text-zinc-300">Talk Time</span>
            </div>
          </div>
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-12 gap-4 px-4 mb-3 text-zinc-500 text-xs font-bold uppercase tracking-widest">
        <div className="col-span-1 text-center">Rank</div>
        <div className="col-span-2">Agent</div>
        <div className="col-span-7 pl-2">Performance Breakdown</div>
        <div className="col-span-2 text-right">Total</div>
      </div>

      {/* Rows Container */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2">
        {data.map((person, index) => {
          const isTop = index === 0
          const isStandard = person.isStandard
          const totalScore = person.combinedScore
          const talkTimeMins = formatTalkTimeMinutes(person.talkTimeSeconds)

          const dialsPercent = person.calls > 0 ? Math.max((person.calls / maxCombinedScore) * 100, 2) : 0
          const talkTimePercent = talkTimeMins > 0 ? Math.max((talkTimeMins / maxCombinedScore) * 100, 2) : 0

          return (
            <div
              key={person.userId}
              className={`
                relative grid grid-cols-12 gap-4 items-center py-3 px-4 rounded-xl
                transition-all duration-500 ease-out border
                ${
                  isTop
                    ? "bg-zinc-900/80 border-orange-500/50 shadow-[0_0_40px_-10px_rgba(249,115,22,0.3)]"
                    : isStandard
                      ? "bg-zinc-900/40 border-green-500/30"
                      : "bg-zinc-900/30 border-white/5"
                }
              `}
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(10px)",
                transition: "opacity 0.4s ease-out, transform 0.4s ease-out",
                transitionDelay: `${index * 80}ms`,
              }}
            >
              {isTop && (
                <div className="absolute inset-0 rounded-xl border-2 border-orange-500/20 animate-pulse pointer-events-none"></div>
              )}

              {/* Rank */}
              <div className="col-span-1 flex justify-center">
                <div
                  className={`
                    w-10 h-10 flex items-center justify-center rounded-full font-black text-lg
                    ${
                      isTop
                        ? "bg-orange-500 text-black shadow-[0_0_15px_rgba(249,115,22,0.5)]"
                        : isStandard
                          ? "bg-green-900/50 text-green-200 border-2 border-green-500/50"
                          : "bg-zinc-800 text-zinc-400"
                    }
                  `}
                >
                  {index + 1}
                </div>
              </div>

              {/* Name */}
              <div className="col-span-2 flex flex-col justify-center">
                <div
                  className={`font-bold text-xl truncate ${isTop ? "text-white" : isStandard ? "text-green-100" : "text-zinc-300"}`}
                >
                  {person.shortName}
                </div>
                {isStandard && (
                  <span className="w-fit text-[10px] px-1.5 py-0.5 bg-green-500/20 border border-green-500/30 text-green-300 rounded uppercase tracking-wider font-bold mt-1">
                    Target Pace
                  </span>
                )}
              </div>

              {/* Visual Bars */}
              <div className="col-span-7 h-10 flex items-center pl-2">
                <div className="w-full h-full bg-zinc-800/50 rounded-full flex overflow-hidden relative shadow-inner">
                  {/* Diagonal stripe pattern */}
                  <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_20px)]"></div>

                  {/* Dials Segment */}
                  <div
                    className={`h-full relative flex items-center justify-center overflow-hidden rounded-l-full ${
                      isStandard
                        ? "bg-gradient-to-r from-green-800 to-green-600"
                        : "bg-gradient-to-r from-orange-600 to-orange-500"
                    }`}
                    style={{
                      width: isVisible ? `${dialsPercent}%` : "0%",
                      transition: "width 0.8s ease-out",
                      transitionDelay: `${index * 80 + 200}ms`,
                    }}
                  >
                    {dialsPercent > 8 && (
                      <span className="font-black text-sm text-white/90 drop-shadow-md">{person.calls}</span>
                    )}
                  </div>

                  {/* Spacer between segments */}
                  {person.calls > 0 && talkTimeMins > 0 && <div className="w-1 h-full bg-zinc-900/80 z-10"></div>}

                  {/* Talk Time Segment */}
                  <div
                    className={`h-full relative flex items-center justify-center overflow-hidden rounded-r-full ${
                      isStandard
                        ? "bg-gradient-to-r from-green-500 to-green-400"
                        : "bg-gradient-to-r from-yellow-500 to-yellow-400"
                    }`}
                    style={{
                      width: isVisible ? `${talkTimePercent}%` : "0%",
                      transition: "width 0.8s ease-out",
                      transitionDelay: `${index * 80 + 400}ms`,
                    }}
                  >
                    {talkTimePercent > 8 && (
                      <span className="font-black text-sm text-white/90 drop-shadow-md">{talkTimeMins}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Total Score */}
              <div className="col-span-2 flex flex-col items-end justify-center border-l border-white/5 pl-4">
                <span
                  className={`text-3xl font-black tracking-tighter leading-none ${
                    isTop
                      ? "text-transparent bg-clip-text bg-gradient-to-b from-white to-orange-200"
                      : isStandard
                        ? "text-green-200"
                        : "text-zinc-200"
                  }`}
                >
                  {totalScore}
                </span>
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Total Pts</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const CalendarPanel = ({
  events,
  currentTime,
}: {
  events: CalendarEvent[]
  currentTime: Date
}) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500)
    return () => clearTimeout(timer)
  }, [])

  // Filter to only show upcoming events
  const upcomingEvents = events
    .filter((event) => event.endTime > currentTime)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

  const nextEventId = upcomingEvents.length > 0 ? upcomingEvents[0].id : null

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center gap-3 mb-4 mt-2">
        <Calendar className="w-8 h-8 text-orange-400" />
        <h2 className="text-white text-3xl font-bold tracking-wider">UP NEXT</h2>
      </div>

      <div
        className="flex-1 space-y-3 overflow-y-auto overflow-x-visible pr-2 pt-3"
        style={{ maxHeight: "calc(100vh - 280px)" }}
      >
        {upcomingEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Calendar className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-xl font-medium">No more events today</p>
            <p className="text-sm text-gray-500 mt-1">Enjoy your free time!</p>
          </div>
        ) : (
          upcomingEvents.map((event, index) => {
            const isNext = event.id === nextEventId
            const isOngoing = isEventOngoing(event, currentTime)
            const duration = getEventDurationMinutes(event)

            return (
              <div
                key={event.id}
                className={`relative rounded-xl p-4 transition-all duration-500 overflow-visible ${
                  index === 0 ? "mt-1" : ""
                } ${
                  isNext
                    ? "bg-gradient-to-r from-orange-500/20 to-yellow-500/10 border border-orange-500/40"
                    : "bg-gray-800/40 border border-gray-700/30 hover:bg-gray-800/60"
                }`}
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateX(0)" : "translateX(20px)",
                  transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
                  transitionDelay: `${index * 100 + 300}ms`,
                }}
              >
                {isNext && (
                  <div className="absolute -top-3 left-3 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg z-10">
                    {isOngoing ? "NOW" : "UP NEXT"}
                  </div>
                )}

                <div className="flex items-start gap-4">
                  {/* Time column */}
                  <div className="flex-shrink-0 text-center min-w-[80px]">
                    <div className={`text-lg font-bold ${isNext ? "text-orange-400" : "text-white"}`}>
                      {formatEventTime(event.startTime)}
                    </div>
                    <div className="text-xs text-gray-400">to {formatEventTime(event.endTime)}</div>
                  </div>

                  {/* Divider */}
                  <div className={`w-0.5 self-stretch rounded-full ${isNext ? "bg-orange-500" : "bg-gray-600"}`} />

                  {/* Event details */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-lg truncate ${isNext ? "text-orange-300" : "text-white"}`}>
                      {event.title}
                    </h3>
                    {event.description && (
                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">{event.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2">
                      {event.location && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <span className="text-orange-400">📍</span>
                          {event.location}
                        </div>
                      )}
                      {event.attendees && event.attendees.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Users className="w-3 h-3 text-orange-400" />
                          {event.attendees.join(", ")}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Duration badge */}
                  <div className="flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-md">
                      <Clock className="w-3 h-3" />
                      {duration}m
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function DashboardContent() {
  const searchParams = useSearchParams()
  const dayParam = searchParams.get("day") as "today" | "yesterday" | null

  // Use the new hooks
  const { data: leaderboardData, isLoading: leaderboardLoading } = useLeaderboard({
    dateRange: dayParam || "today",
  })

  const { upcomingEvents, currentTime, isLoading: calendarLoading } = useCalendar()

  const [currentTimeDisplay, setCurrentTimeDisplay] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setCurrentTimeDisplay(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const formattedTime = currentTimeDisplay.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })

  const formattedDate = currentTimeDisplay.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6 md:p-10 ${poppins.variable} font-sans`}
    >
      <div className="max-w-[1800px] mx-auto h-full flex flex-col">
        {/* Main Content */}
        <div className="flex-1 flex gap-8">
          {/* Left Panel - Leaderboard */}
          <div className="flex-[2]">
            {leaderboardLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
              </div>
            ) : (
              <LeaderboardPanel data={leaderboardData} />
            )}
          </div>

          {/* Divider */}
          <div className="w-px bg-gradient-to-b from-transparent via-gray-600 to-transparent"></div>

          {/* Right Panel - Calendar */}
          <div className="flex-1 min-w-[380px]">
            {calendarLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
              </div>
            ) : (
              <CalendarPanel events={upcomingEvents} currentTime={currentTime} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-between items-center text-gray-500 text-sm border-t border-gray-700/50 pt-6">
          <div className="flex items-center gap-3">
            <SvgIcon className="h-8 w-8" uniqueId="footer" />
            <span className="uppercase tracking-widest font-bold text-gray-400">Purge Digital</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">{formattedDate}</span>
            <div className="h-4 w-px bg-gray-600"></div>
            <span className="text-orange-400 font-mono font-bold">{formattedTime}</span>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs uppercase tracking-wider">Live</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EnhancedBarCharts() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}
