#Technical Specification: "Business Wave" (Бизнес-Волна)
#Adaptive Music Streaming

Concept & Value Proposition
Problem: Yandex's "My Wave" is built for individual taste. Business owners need music that fits their brand atmosphere and customer flow, not just their personal preferences. They also lack time to manage playlists daily.
Solution: Business Wave — A rule-based adaptive stream that balances Compliance, Atmosphere, and Simplicity.
we use a Weighted Scoring System.
Step 1: Candidate Filtering (SQL Query)
Reduce 10,000 tracks to 500 eligible tracks based on hard constraints.
Step 2: Scoring Logic (Node.js Function)
Each track gets a score (0-100). Top 20 are queued.
Step 3: Diversity Check
Ensure no more than 2 tracks from the same artist in a 1-hour window.
4. Database Schema (PostgreSQL)
Extensions to existing schema to support Wave.
5. 📱 User Interface (Steerable Control)
Business owners don't want "AI Black Box". They want controls.
Dashboard Widgets:
Energy Slider: 🌡️ Calm ← → 🔥 Energetic
Vocal Toggle: 🎤 Vocals On / Off (Instrumental only)
Focus Mode: ☕ "Morning Coffee" vs. 🍸 "Evening Lounge" (Pre-set profiles)
Skip Button: ⏭️ "Don't play this again today" (Updates negative score)
"Wave Status" Indicator:
"Currently optimizing for: Lunch Rush (High Energy)"
"Next adjustment: 15:00 (Afternoon Chill)"
7. 📉 Cost Optimization Strategies
Pre-Computed Queues:
Instead of generating the queue in real-time (expensive), generate 4 hours of music once every 4 hours via Cron.
Store in Redis. Player just pulls from the list.
Savings: Reduces Cloud Function invocations by 90%.
Client-Side Caching (Offline):
PWA downloads the next 10 tracks to IndexedDB.
If internet drops, Player continues the Wave locally.
Logs are stored locally and synced when online (compliant with §5.6 as long as timestamp is preserved).
Metadata vs. Audio Analysis:
Do not analyze audio waveforms in real-time.
Analyze once during upload (BPM, Energy) and store in DB.
Savings: Saves CPU cycles on every request.
