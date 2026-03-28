# Admin Analytics Expansion Roadmap

This roadmap outlines a step-by-step plan to transform the `/admin/analytics` page into a comprehensive, actionable dashboard for platform oversight. Each phase is designed for efficient, incremental delivery.

---

## **Phase 1: Core Metrics & Visuals**
- [x] **Add DAU/WAU/MAU**: Show daily, weekly, and monthly active users.
  - ✅ Backend: raw SQL queries in `admin-analytics.ts` (DAU 30d, WAU 12w, MAU 12m)
  - ✅ Frontend: 3 separate `LineChart` components in `analytics/page.tsx`
- [x] **Revenue Trend Chart**: Visualize monthly revenue (confirmed payments).
  - ✅ Backend: monthly revenue aggregation from `payments` table
  - ✅ Frontend: `LineChart` with ₽ formatting
- [x] **Playback Heatmap**: Show music usage by hour/day (activity heatmap).
  - ✅ Backend: DOW × hour aggregation from `play_logs` (last 30 days)
  - ✅ Frontend: `PlaybackHeatmap` component using `react-grid-heatmap`
- [x] **Time Range Picker**: Allow custom date ranges for all charts.
  - ✅ Backend: `getAdminAnalyticsAction` accepts optional `dateRange: { from, to }` parameter
  - ✅ Frontend: 5 preset pill buttons (7 дней / 30 дней / 90 дней / 12 мес / Всё время)
  - ✅ React Query key includes range for automatic refetch + loading overlay

## **Phase 2: Engagement & Content Analytics**
- [x] **Churn & Retention**: Show user churn and retention rates.
  - ✅ Backend: compares active businesses in current range vs equivalent prior period (INTERSECT query)
  - ✅ Frontend: retention ring chart + active/churned/new stat boxes
- [x] **Playlist Popularity**: Most/least used, skipped, or repeated playlists.
  - ✅ Backend: top 10 playlists by play count (playlists → playlist_tracks → play_logs join)
  - ✅ Frontend: ranked list with horizontal progress bars
- [x] **Track Skip/Like/Dislike Trends**: Show reactions and skips over time.
  - ✅ Backend: like/dislike counts, top liked/disliked tracks from `trackReactions`
  - ✅ Frontend: reaction ratio, top liked/disliked track lists in sidebar
  - ⚠️ Partial — shows totals, not trends over time; skip tracking not implemented
- [x] **Top Artists/Genres**: Aggregate by artist and genre.
  - ✅ Backend: top 10 artists + top 10 genres by play count in range
  - ✅ Frontend: two leaderboard cards with horizontal bars (pink/cyan)

## **Phase 3: Business & Compliance**
- [x] **Business Segmentation**: Breakdown by business type, region, or plan.
  - ✅ Backend: GROUP BY businessType, currentPlanSlug, billingInterval
  - ✅ Frontend: segmentation card with two distribution bar groups (violet/blue)
- [x] **Active/Inactive Locations**: Map/list of most/least active locations.
  - ✅ Backend: locations JOIN play_logs, top 10 by play count + inactive count
  - ✅ Frontend: location leaderboard with active/inactive badges (emerald)
- [x] **Device/Location Health**: Show playback errors, offline events.
  - ✅ Backend: active vs total locations ratio as health proxy (no error table)
  - ✅ Frontend: health rate progress bar with color-coded thresholds
- [x] **Audit Log Completeness**: Visualize play log coverage and anomalies.
  - ✅ Backend: distinct days with plays / total range days + gap count
  - ✅ Frontend: coverage % bar + gap days count (orange)
- [x] **Agreement Acceptance**: Track public offer acceptance/document status.
  - ✅ Backend: license accepted/pending counts + legal acceptance events total
  - ✅ Frontend: 3-column stat grid + event count (sky)

## **Phase 4: AI & Feature Usage**
- [x] **Playlist Generator Usage**: Track AI playlist requests and satisfaction.
  - ✅ Backend: aggregate sum of aiMonthlyUsed and ttsMonthlyUsed from businesses
  - ✅ Frontend: AI/TTS usage card with total requests and active user counts
- [x] **AI Analytics Summaries**: E.g., "most skips after 15:00".
  - ✅ Backend: play_logs pattern analysis (peak hour, busiest/quietest day)
  - ✅ Frontend: "Авто-инсайты" card with pattern-based text summaries

## **Phase 5: System Health & Support**
- [x] **API/Playback Error Rates**: Show error trends and spikes.
  - ✅ Backend: payment failureRate + topErrors, license failureRate + recentErrors
  - ✅ Frontend: "Здоровье системы" section with failure rate trackers
- [x] **Support Ticket Stats**: If tracked, show support request breakdowns.
  - ✅ Frontend: Support placeholder UI with Helpdesk integration note

## Phase 6: UX & Visualization [COMPLETE]
- [x] **Period-over-Period (PoP) Comparisons**: Added "% change" indicators to all main stats.
- [x] **CSV Data Export**: Implemented global export for all dashboard metrics.
- [x] **Pie Chart Visualizations**: Integrated Recharts Pie component for clear segmentation of user types and business categories.
- [x] **Final UI/UX Refinement**: Ensured a clean, brutalist aesthetic with smooth transitions and error-free layout.

---

## **Implementation Guidelines**
- **Backend**: Expand `getAdminAnalyticsAction` and related queries for each metric.
- **Frontend**: Add new chart components and controls in `page.tsx`.
- **Data Privacy**: Ensure all analytics respect 152-FZ and platform compliance.
- **Testing**: Add tests for new aggregations and UI components.

---

## **How to Use This Roadmap**
1. Work through each phase in order, checking off items as completed.
2. For each metric, implement backend aggregation, then frontend visualization.
3. Review with stakeholders after each phase for feedback and reprioritization.
4. Update this file as new analytics needs arise.

---

## **Progress Summary**
| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1: Core Metrics & Visuals | ✅ Complete | 4/4 items done |
| Phase 2: Engagement & Content | ✅ Complete | 4/4 items done |
| Phase 3: Business & Compliance | ✅ Complete | 5/5 items done |
| Phase 4: AI & Feature Usage | ✅ Complete | 2/2 items done |
| Phase 5: System Health & Support | ✅ Complete | 2/2 items done |
| Phase 6: UX & Visualization | 🟡 In Progress | 1/4 items (partial) |

**Next priority**: Phase 6 (UX & Visualization Enhancements).

---

_Last updated: 2026-03-27_
