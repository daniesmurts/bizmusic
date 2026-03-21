
🛡️ Admin Dashboard Specification (Super Admin)
🤖 Role & Objective
You are building the Super Admin Dashboard for a B2B Music Licensing Platform operating in the Russian Federation.
This dashboard is INTERNAL ONLY (for the Platform Owner).
Core Mission: Manage content, oversee client compliance, handle finances (T-Bank), and ensure 152-FZ data sovereignty.
🛑 Critical Constraints
Admin Panel Access: Must be restricted (IP Whitelisting or 2FA).
Payment Processor: T-Bank (Tinkoff Acquiring).
Must support 54-FZ Fiscalization (sending receipts to tax authority).
Currency: RUB.
Language: Russian.
Business Model: Direct Licensing.
You own 100% of the music.
Admin tools must facilitate generating Legal Exemption Certificates for clients.
🎛️ Core Admin Features
1. 🎵 Content Management (CMS)
Manage the music library you create.
Track Upload:
Drag-and-drop interface (MP3/WAV).
Auto-upload to Yandex Object Storage (Private Bucket).
Metadata Form: Title, Artist, BPM, Mood (Tags), Duration, Energy Level.
Audio Visualization: Waveform display (using wavesurfer.js) to verify upload quality.
Playlist Curator:
Create/Edit/Delete Playlists (e.g., "Cafe Morning", "Gym Power").
Assign tracks to playlists.
Global Toggle: Enable/Disable specific tracks across all client playlists (e.g., if a track has a legal issue).
Library Stats: Total tracks, Total duration, Storage usage (GB).
2. 👥 Client & Subscription Management
Oversee business clients.
Client Directory:
Search by Company Name, INN, or Email.
Verification Status: Pending, Verified (INN Match), Rejected.
Details View: Legal Name, INN, KPP, Address, Contact Person.
Subscription Control:
View Plan Type (Basic, Pro, Chain).
Manual Override: Pause/Resume/Cancel subscription.
Location Limit: View current locations vs. plan limit.
Expiry Date: Clear display of next billing date.
Staff Management: View/Edit staff accounts linked to a business (reset passwords, revoke access).
3. ⚖️ Compliance & Legal Center
The core value proposition. Protect clients from RAO/VOIS.
License Certificate Generator:
Select Client → Generate PDF.
Content: Client INN, Your INN, List of Licensed Tracks, Validity Period, Digital QR Code.
Download/Send: Download PDF or Email directly to client.
Audit Log Explorer:
Searchable table of all play_logs across the platform.
Filter by: Client, Date Range, Track, Location.
Export: Download CSV/PDF for specific client (for their legal defense).
Dispute Ticket System:
View tickets from clients claiming they received a fine.
Attach legal templates (Letter of Exemption) to respond.
Status: Open, In Review, Resolved.
Contract Management:
View signed E-Agreements (Public Offer) per client.
Re-send for signature if expired.
4. 💰 Finance & Billing (T-Bank)
Manage revenue and tax compliance.
Transaction Log:
List of all payments via T-Bank.
Columns: Date, Client, Amount, Status (Success, Failed, Refunded), Transaction ID.
Webhook Debugger: View raw webhook payloads from T-Bank for troubleshooting.
Invoice & Act Generation:
Generate Act of Service (Акт выполненных работ) for B2B clients (required for accounting).
Auto-email with PDF attachment.
Revenue Dashboard:
MRR (Monthly Recurring Revenue) in RUB.
Churn Rate, ARPL (Average Revenue Per Location).
Tax Export: Export data for Tax Declaration (USN/OSNO).
Refund Handler:
Initiate refund via T-Bank API directly from the dashboard.
Log reason for refund.
5. 📊 Analytics & System Health
Monitor platform performance.
Usage Heatmap: Peak listening hours (Moscow Time).
Track Performance: Top Played vs. Top Skipped (helps you decide what music to compose next).
Offline Stats: Percentage of plays served from Cache vs. Stream (indicates internet stability).
Error Monitor: Failed streams, Payment failures, Auth errors.
Geographic Map: Client locations across Russia.
6. 🛠️ System Settings
Admin Users: Manage other admins (if you hire staff later).
2FA Enforcement: Mandatory for all admin accounts.
Role-Based Access Control (RBAC): Super Admin vs. Support Agent vs. Content Manager.
Global Announcements: Push notifications to all client PWAs (e.g., "Maintenance on Sunday").
Data Residency Check: Automated scan to ensure no PII is in Supabase/Foreign DBs.
💳 T-Bank Payment Integration Specs
