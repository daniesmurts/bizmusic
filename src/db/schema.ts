import { pgTable, text, integer, boolean, timestamp, jsonb, pgEnum, uniqueIndex, index, doublePrecision, serial, varchar } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// DB Types
export interface ScheduleTimeSlot {
  start: string;
  end: string;
}

export interface ScheduleConfig {
  monday?: ScheduleTimeSlot[];
  tuesday?: ScheduleTimeSlot[];
  wednesday?: ScheduleTimeSlot[];
  thursday?: ScheduleTimeSlot[];
  friday?: ScheduleTimeSlot[];
  saturday?: ScheduleTimeSlot[];
  sunday?: ScheduleTimeSlot[];
}

// Announcement Scheduling Types
export interface AnnouncementTimeRule {
  time: string; // "HH:mm"
  announcementId: string;
  days: ("mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun")[];
}

export interface AnnouncementScheduleConfig {
  frequency: number; // Play an announcement every N tracks (0 = disabled)
  mode: "sequential" | "random" | "weighted";
  timeRules: AnnouncementTimeRule[];
  weights: Record<string, number>; // announcementId -> weight (1-10)
}

// Enums - keep them as lowercase for DB if they were created that way, but Prisma usually keeps them as defined
export const roleEnum = pgEnum("role", ["ADMIN", "BUSINESS_OWNER", "STAFF"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["INACTIVE", "ACTIVE", "EXPIRED"]);
export const billingIntervalEnum = pgEnum("billing_interval", ["monthly", "yearly"]);
export const userTypeEnum = pgEnum("user_type", ["BUSINESS", "CREATOR"]);
export const documentStatusEnum = pgEnum("document_status", ["GENERATING", "READY", "FAILED"]);
export const platformAnnouncementAccessEnum = pgEnum("platform_announcement_access", ["FREE", "PAID"]);
export const platformAnnouncementSourceEnum = pgEnum("platform_announcement_source", ["UPLOAD", "TTS"]);
export const trackReactionTypeEnum = pgEnum("track_reaction_type", ["LIKE", "DISLIKE"]);
export const demoRequestStatusEnum = pgEnum("demo_request_status", ["PENDING", "CONTACTED", "COMPLETED", "CANCELLED"]);
export const supportConversationStatusEnum = pgEnum("support_conversation_status", ["OPEN", "PENDING", "CLOSED"]);
export const supportPriorityEnum = pgEnum("support_priority", ["LOW", "NORMAL", "HIGH", "URGENT"]);
export const supportCategoryEnum = pgEnum("support_category", ["GENERAL", "TECHNICAL", "BILLING", "LEGAL"]);
export const supportMessageDirectionEnum = pgEnum("support_message_direction", ["USER", "SUPPORT", "SYSTEM"]);
export const supportMessageSourceEnum = pgEnum("support_message_source", ["PUBLIC_WIDGET", "DASHBOARD", "ADMIN"]);
export const supportDeliveryProviderEnum = pgEnum("support_delivery_provider", ["TELEGRAM", "BITRIX24"]);
export const supportDeliveryStatusEnum = pgEnum("support_delivery_status", ["PENDING", "SENT", "FAILED"]);

// Users Table
export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()), 
  email: text("email").notNull().unique(),
  passwordHash: text("passwordHash").default("SUPABASE_AUTH"),
  role: roleEnum("role").default("BUSINESS_OWNER").notNull(),
  userType: userTypeEnum("userType").default("BUSINESS").notNull(),
  phone: text("phone"),
  assignedLocationId: text("assignedLocationId"),
  termsAccepted: boolean("termsAccepted").default(false).notNull(),
  termsAcceptedAt: timestamp("termsAcceptedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
});

export const legalAcceptanceEvents = pgTable("legal_acceptance_events", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  acceptedAt: timestamp("acceptedAt").defaultNow().notNull(),
  source: text("source").default("unknown").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  termsVersion: text("termsVersion"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Businesses Table
export const businesses = pgTable("businesses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").references(() => users.id).notNull(),
  inn: text("inn").notNull().unique(),
  ogrn: text("ogrn"),
  kpp: text("kpp"),
  legalName: text("legalName").notNull(),
  address: text("address").notNull(),
  phone: text("phone"),
  contactPerson: text("contactPerson"),
  businessType: text("businessType"),
  businessCategory: text("businessCategory"),
  bankName: text("bankName"),
  bik: text("bik"),
  settlementAccount: text("settlementAccount"),
  corrAccount: text("corrAccount"),
  subscriptionStatus: subscriptionStatusEnum("subscriptionStatus").default("INACTIVE").notNull(),
  subscriptionExpiresAt: timestamp("subscriptionExpiresAt"),
  trialEndsAt: timestamp("trialEndsAt"),
  rebillId: text("rebillId"),
  cardMask: text("cardMask"),
  cardExpiry: text("cardExpiry"),
  currentPlanSlug: text("currentPlanSlug"),
  billingInterval: billingIntervalEnum("billingInterval").default("monthly").notNull(),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false).notNull(),
  ttsMonthlyUsed: integer("ttsMonthlyUsed").default(0).notNull(),
  ttsMonthlyPeriodStart: timestamp("ttsMonthlyPeriodStart"),
  ttsMonthlyPeriodEnd: timestamp("ttsMonthlyPeriodEnd"),
  aiMonthlyUsed: integer("aiMonthlyUsed").default(0).notNull(),
  aiMonthlyPeriodStart: timestamp("aiMonthlyPeriodStart"),
  aiMonthlyPeriodEnd: timestamp("aiMonthlyPeriodEnd"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
});

// Locations Table
export const locations = pgTable("locations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("businessId").references(() => businesses.id).notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  deviceId: text("deviceId").unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
});

// Wave Settings Table
export const waveSettings = pgTable("wave_settings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("businessId").references(() => businesses.id, { onDelete: "cascade" }).notNull().unique(),
  energyPreference: integer("energyPreference").default(5).notNull(),
  vocalPreference: text("vocalPreference").default('both').notNull(),
  focusProfile: text("focusProfile").default('none').notNull(),
  // Announcement auto-scheduling
  announcementScheduleEnabled: boolean("announcementScheduleEnabled").default(false).notNull(),
  announcementScheduleConfig: jsonb("announcementScheduleConfig").$type<AnnouncementScheduleConfig>().default({
    frequency: 0,
    mode: "sequential",
    timeRules: [],
    weights: {},
  }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
});

// Tracks Table
export const tracks = pgTable("tracks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  fileUrl: text("fileUrl").notNull(),
  duration: integer("duration").notNull(),
  bpm: integer("bpm"),
  genre: text("genre").default("Unknown"),
  moodTags: text("moodTags").array().$defaultFn(() => ([] as string[])).notNull(),
  isExplicit: boolean("isExplicit").default(false).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  isAnnouncement: boolean("isAnnouncement").default(false).notNull(),
  rightsStatus: text("rightsStatus").default("Direct Owner"),
  territoryRestriction: text("territoryRestriction").array(),
  vocalType: text("vocalType").default("Instrumental"),
  language: text("language").default("Russian"),
  timeSuitability: text("timeSuitability").array(),
  businessId: text("businessId").references(() => businesses.id, { onDelete: "cascade" }),
  energyLevel: integer("energyLevel"),
  downloadsCount: integer("downloadsCount").default(0).notNull(),
  sharesCount: integer("sharesCount").default(0).notNull(),
  artistId: text("artistId").references(() => artists.id),
  albumId: text("albumId").references(() => albums.id),
  trackNumber: integer("trackNumber"),
  coverUrl: text("coverUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
});

// Albums Table
export const albums = pgTable("albums", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  artistId: text("artistId").references(() => artists.id),
  coverUrl: text("coverUrl"),
  description: text("description"),
  releaseDate: timestamp("releaseDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
});

// Artists Table
export const artists = pgTable("artists", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  imageUrl: text("imageUrl"),
  bio: text("bio"),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  externalLinks: jsonb("externalLinks").$type<{
    spotify?: string;
    vk?: string;
    appleMusic?: string;
    website?: string;
  }>().default({}).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
});

// Playlists Table
export const playlists = pgTable("playlists", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("businessId").references(() => businesses.id),
  name: text("name").notNull(),
  scheduleConfig: jsonb("scheduleConfig").$type<ScheduleConfig>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
});

// PlaylistTracks Join Table
export const playlistTracks = pgTable("playlist_tracks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  playlistId: text("playlistId").references(() => playlists.id, { onDelete: "cascade" }).notNull(),
  trackId: text("trackId").references(() => tracks.id, { onDelete: "cascade" }).notNull(),
  position: integer("position").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
}, (t) => ({
  playlistTrackUnique: uniqueIndex("playlist_track_unique").on(t.playlistId, t.trackId),
  playlistPositionIndex: index("playlist_position_idx").on(t.playlistId, t.position),
}));

// Location -> active playlist assignment for rollout and playback targeting
export const locationPlaylistAssignments = pgTable("location_playlist_assignments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("businessId").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  locationId: text("locationId").references(() => locations.id, { onDelete: "cascade" }).notNull().unique(),
  playlistId: text("playlistId").references(() => playlists.id, { onDelete: "cascade" }).notNull(),
  updatedByUserId: text("updatedByUserId").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
}, (t) => ({
  businessLocationIdx: index("location_playlist_assignments_business_location_idx").on(t.businessId, t.locationId),
  playlistIdx: index("location_playlist_assignments_playlist_idx").on(t.playlistId),
}));

// PlayLogs Table
export const playLogs = pgTable("play_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  locationId: text("locationId").references(() => locations.id),
  businessId: text("businessId").references(() => businesses.id),
  trackId: text("trackId").references(() => tracks.id).notNull(),
  playedAt: timestamp("playedAt").defaultNow().notNull(),
});

// Song of the Week Table
export const songOfTheWeek = pgTable("song_of_the_week", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  trackId: text("trackId").references(() => tracks.id, { onDelete: "cascade" }).notNull(),
  postedAt: timestamp("postedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  activeIdx: uniqueIndex("idx_song_of_week_active").on(t.isActive).where(sql`${t.isActive} = true`),
  expiresAtIdx: index("idx_song_of_week_expires_at").on(t.expiresAt),
  postedAtIdx: index("idx_song_of_week_posted_at").on(t.postedAt),
}));

export const trackDownloadEvents = pgTable("track_download_events", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  trackId: text("trackId").references(() => tracks.id, { onDelete: "cascade" }).notNull(),
  songOfWeekId: text("songOfWeekId").references(() => songOfTheWeek.id, { onDelete: "set null" }),
  source: text("source").default("unknown").notNull(),
  ipHash: text("ipHash"),
  userAgent: text("userAgent"),
  referer: text("referer"),
  downloadedAt: timestamp("downloadedAt").defaultNow().notNull(),
}, (t) => ({
  trackDownloadedIdx: index("track_download_events_track_downloaded_idx").on(t.trackId, t.downloadedAt),
  downloadedAtIdx: index("track_download_events_downloaded_at_idx").on(t.downloadedAt),
  sourceIdx: index("track_download_events_source_idx").on(t.source),
  songOfWeekIdx: index("track_download_events_song_of_week_idx").on(t.songOfWeekId),
}));

export const trackReactions = pgTable("track_reactions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  trackId: text("trackId").references(() => tracks.id, { onDelete: "cascade" }).notNull(),
  reactionType: trackReactionTypeEnum("reactionType").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
}, (t) => ({
  userTrackUnique: uniqueIndex("track_reactions_user_track_unique").on(t.userId, t.trackId),
  trackReactionTypeIdx: index("track_reactions_track_type_idx").on(t.trackId, t.reactionType),
  trackReactionCreatedAtIdx: index("track_reactions_created_at_idx").on(t.createdAt),
}));

// Licenses Table
export const licenses = pgTable("licenses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("businessId").references(() => businesses.id).notNull(),
  licenseNumber: text("licenseNumber").notNull().unique(),
  signingName: text("signingName").notNull(),
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  validFrom: timestamp("validFrom").notNull(),
  validTo: timestamp("validTo").notNull(),
  totalCost: doublePrecision("totalCost").default(0).notNull(),
  pdfUrl: text("pdfUrl").notNull(),
  documentStatus: documentStatusEnum("documentStatus").default("READY").notNull(),
  generationError: text("generationError"),
  agreementAcceptedAt: timestamp("agreementAcceptedAt"),
  agreementAcceptedIp: text("agreementAcceptedIp"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// VoiceAnnouncements Table
export const voiceAnnouncements = pgTable("voice_announcements", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("businessId").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  trackId: text("trackId").references(() => tracks.id, { onDelete: "cascade" }).notNull(),
  platformAnnouncementId: text("platformAnnouncementId").references(() => platformAnnouncementProducts.id, { onDelete: "set null" }),
  text: text("text").notNull(),
  languageCode: text("languageCode").default("ru-RU").notNull(),
  provider: text("provider").default("google").notNull(),
  voiceName: text("voiceName").notNull(),
  speakingRate: doublePrecision("speakingRate").default(1.0).notNull(),
  pitch: doublePrecision("pitch").default(0.0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
});

export const announcementTemplates = pgTable("announcement_templates", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  title: text("title").notNull(),
  text: text("text").notNull(),
  pack: text("pack").default("base").notNull(),
  packLabel: text("packLabel").default("Базовые").notNull(),
  provider: text("provider").default("sberbank").notNull(),
  isSeasonal: boolean("isSeasonal").default(false).notNull(),
  seasonCode: text("seasonCode"),
  isPublished: boolean("isPublished").default(true).notNull(),
  sortOrder: integer("sortOrder").default(0).notNull(),
  createdByUserId: text("createdByUserId").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
}, (t) => ({
  publishedSortIdx: index("announcement_templates_published_sort_idx").on(t.isPublished, t.sortOrder, t.createdAt),
  packIdx: index("announcement_templates_pack_idx").on(t.pack, t.isPublished),
}));

export const announcementJingles = pgTable("announcement_jingles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  fileUrl: text("fileUrl").notNull(),
  duration: integer("duration").default(0).notNull(),
  position: text("position").default("intro").notNull(), // intro | outro
  volumeDb: integer("volumeDb").default(-6).notNull(),
  isPublished: boolean("isPublished").default(true).notNull(),
  sortOrder: integer("sortOrder").default(0).notNull(),
  createdByUserId: text("createdByUserId").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
}, (t) => ({
  publishedSortIdx: index("announcement_jingles_published_sort_idx").on(t.isPublished, t.sortOrder, t.createdAt),
  positionPublishedIdx: index("announcement_jingles_position_published_idx").on(t.position, t.isPublished),
}));

export const announcementBulkJobs = pgTable("announcement_bulk_jobs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("businessId").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  createdByUserId: text("createdByUserId").references(() => users.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  text: text("text").notNull(),
  ssmlText: text("ssmlText"),
  provider: text("provider").default("sberbank").notNull(),
  voiceName: text("voiceName").notNull(),
  speakingRate: doublePrecision("speakingRate").default(1.0).notNull(),
  pitch: doublePrecision("pitch").default(0.0).notNull(),
  jingleId: text("jingleId").references(() => announcementJingles.id, { onDelete: "set null" }),
  status: text("status").default("PENDING").notNull(),
  totalTargets: integer("totalTargets").default(0).notNull(),
  successTargets: integer("successTargets").default(0).notNull(),
  failedTargets: integer("failedTargets").default(0).notNull(),
  generatedAnnouncementId: text("generatedAnnouncementId").references(() => voiceAnnouncements.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
}, (t) => ({
  businessCreatedIdx: index("announcement_bulk_jobs_business_created_idx").on(t.businessId, t.createdAt),
  statusCreatedIdx: index("announcement_bulk_jobs_status_created_idx").on(t.status, t.createdAt),
}));

export const announcementBulkJobTargets = pgTable("announcement_bulk_job_targets", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  jobId: text("jobId").references(() => announcementBulkJobs.id, { onDelete: "cascade" }).notNull(),
  locationId: text("locationId").references(() => locations.id, { onDelete: "set null" }),
  playlistId: text("playlistId").references(() => playlists.id, { onDelete: "set null" }),
  announcementId: text("announcementId").references(() => voiceAnnouncements.id, { onDelete: "set null" }),
  trackId: text("trackId").references(() => tracks.id, { onDelete: "set null" }),
  status: text("status").default("PENDING").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
}, (t) => ({
  jobStatusIdx: index("announcement_bulk_job_targets_job_status_idx").on(t.jobId, t.status),
  playlistIdx: index("announcement_bulk_job_targets_playlist_idx").on(t.playlistId),
  locationIdx: index("announcement_bulk_job_targets_location_idx").on(t.locationId),
}));

export const platformAnnouncementProducts = pgTable("platform_announcement_products", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  trackId: text("trackId").references(() => tracks.id, { onDelete: "cascade" }).notNull().unique(),
  createdByUserId: text("createdByUserId").references(() => users.id, { onDelete: "set null" }),
  description: text("description"),
  transcript: text("transcript"),
  languageCode: text("languageCode").default("ru-RU").notNull(),
  provider: text("provider").default("uploaded").notNull(),
  voiceName: text("voiceName").default("uploaded").notNull(),
  speakingRate: doublePrecision("speakingRate").default(1.0).notNull(),
  pitch: doublePrecision("pitch").default(0.0).notNull(),
  accessModel: platformAnnouncementAccessEnum("accessModel").default("FREE").notNull(),
  priceKopeks: integer("priceKopeks").default(0).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  isPublished: boolean("isPublished").default(true).notNull(),
  sourceType: platformAnnouncementSourceEnum("sourceType").notNull(),
  sortOrder: integer("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
}, (t) => ({
  featuredPublishedIdx: index("platform_announcement_featured_published_idx").on(t.isFeatured, t.isPublished, t.sortOrder),
  accessModelIdx: index("platform_announcement_access_model_idx").on(t.accessModel),
}));

export const ttsCreditLots = pgTable("tts_credit_lots", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("businessId").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  creditsTotal: integer("creditsTotal").notNull(),
  creditsRemaining: integer("creditsRemaining").notNull(),
  purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  paymentId: text("paymentId").references(() => payments.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
}, (t) => ({
  businessExpiryIdx: index("tts_credit_lots_business_expiry_idx").on(t.businessId, t.expiresAt),
  paymentUniqueIdx: uniqueIndex("tts_credit_lots_payment_unique").on(t.paymentId),
}));

export const ttsUsageEvents = pgTable("tts_usage_events", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("businessId").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  announcementId: text("announcementId").references(() => voiceAnnouncements.id, { onDelete: "set null" }),
  provider: text("provider").notNull(),
  sourceType: text("sourceType").notNull(),
  consumedCredits: integer("consumedCredits").notNull().default(1),
  charsCount: integer("charsCount").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  businessCreatedIdx: index("tts_usage_events_business_created_idx").on(t.businessId, t.createdAt),
}));

export const aiUsageEvents = pgTable("ai_usage_events", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("businessId").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  provider: text("provider").notNull(),
  sourceType: text("sourceType").notNull(),
  charsCount: integer("charsCount").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  businessCreatedIdx: index("ai_usage_events_business_created_idx").on(t.businessId, t.createdAt),
}));

// Blog Related Tables
export const blogCategories = pgTable("blog_categories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
});

export const blogPosts = pgTable("blog_posts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  categoryId: text("categoryId").references(() => blogCategories.id).notNull(),
  authorId: text("authorId").references(() => users.id).notNull(),
  imageUrl: text("imageUrl").notNull(),
  published: boolean("published").default(false).notNull(),
  featured: boolean("featured").default(false).notNull(),
  views: integer("views").default(0).notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
}, (t) => ({
  slugIdx: index("blog_post_slug_idx").on(t.slug),
  categoryIdx: index("blog_post_category_idx").on(t.categoryId),
  publishedIdx: index("blog_post_published_idx").on(t.published),
}));

export const blogPostTags = pgTable("blog_post_tags", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  postId: text("postId").references(() => blogPosts.id, { onDelete: "cascade" }).notNull(),
  tagName: text("tagName").notNull(),
}, (t) => ({
  postIdx: index("blog_post_tags_post_idx").on(t.postId),
  tagIdx: index("blog_post_tags_tag_idx").on(t.tagName),
}));

// Payments Table
export const payments = pgTable("payments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("businessId").references(() => businesses.id).notNull(),
  amount: integer("amount").notNull(),
  status: text("status").notNull(),
  tbankPaymentId: text("tbankPaymentId").unique(),
  orderId: text("orderId").notNull().unique(),
  paymentType: text("paymentType").default("subscription").notNull(),
  metadata: jsonb("metadata").$type<Record<string, string | number | boolean | null>>().default({}).notNull(),
  recurrent: boolean("recurrent").default(false).notNull(),
  rebillId: text("rebillId"),
  errorCode: text("errorCode"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
});

export const businessAnnouncementAcquisitions = pgTable("business_announcement_acquisitions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  businessId: text("businessId").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  platformAnnouncementId: text("platformAnnouncementId").references(() => platformAnnouncementProducts.id, { onDelete: "cascade" }).notNull(),
  paymentId: text("paymentId").references(() => payments.id, { onDelete: "set null" }),
  importedAnnouncementId: text("importedAnnouncementId").references(() => voiceAnnouncements.id, { onDelete: "set null" }),
  pricePaidKopeks: integer("pricePaidKopeks").default(0).notNull(),
  claimedAt: timestamp("claimedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
}, (t) => ({
  businessPlatformUniqueIdx: uniqueIndex("business_announcement_acquisition_unique").on(t.businessId, t.platformAnnouncementId),
  paymentUniqueIdx: uniqueIndex("business_announcement_acquisition_payment_unique").on(t.paymentId),
  businessClaimedIdx: index("business_announcement_acquisition_business_claimed_idx").on(t.businessId, t.claimedAt),
}));

export const supportConversations = pgTable("support_conversations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  publicSessionKey: text("publicSessionKey"),
  userId: text("userId").references(() => users.id, { onDelete: "set null" }),
  businessId: text("businessId").references(() => businesses.id, { onDelete: "set null" }),
  assignedToUserId: text("assignedToUserId").references(() => users.id, { onDelete: "set null" }),
  visitorName: text("visitorName"),
  visitorEmail: text("visitorEmail"),
  visitorPhone: text("visitorPhone"),
  subject: text("subject"),
  category: supportCategoryEnum("category").default("GENERAL").notNull(),
  priority: supportPriorityEnum("priority").default("NORMAL").notNull(),
  status: supportConversationStatusEnum("status").default("OPEN").notNull(),
  bitrixTaskId: text("bitrixTaskId"),
  lastMessageAt: timestamp("lastMessageAt").defaultNow().notNull(),
  closedAt: timestamp("closedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
}, (t) => ({
  statusLastMessageIdx: index("idx_support_conversations_status_last_message").on(t.status, t.lastMessageAt),
  userCreatedIdx: index("idx_support_conversations_user_created").on(t.userId, t.createdAt),
  businessCreatedIdx: index("idx_support_conversations_business_created").on(t.businessId, t.createdAt),
  publicSessionKeyIdx: index("idx_support_conversations_public_session_key").on(t.publicSessionKey),
}));

export const supportMessages = pgTable("support_messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  conversationId: text("conversationId").references(() => supportConversations.id, { onDelete: "cascade" }).notNull(),
  senderUserId: text("senderUserId").references(() => users.id, { onDelete: "set null" }),
  direction: supportMessageDirectionEnum("direction").notNull(),
  source: supportMessageSourceEnum("source").notNull(),
  body: text("body").notNull(),
  isInternal: boolean("isInternal").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  conversationCreatedIdx: index("idx_support_messages_conversation_created").on(t.conversationId, t.createdAt),
  senderCreatedIdx: index("idx_support_messages_sender_created").on(t.senderUserId, t.createdAt),
}));

export const supportMessageDeliveries = pgTable("support_message_deliveries", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  messageId: text("messageId").references(() => supportMessages.id, { onDelete: "cascade" }).notNull(),
  provider: supportDeliveryProviderEnum("provider").notNull(),
  status: supportDeliveryStatusEnum("status").default("PENDING").notNull(),
  target: text("target").notNull(),
  externalId: text("externalId"),
  attemptCount: integer("attemptCount").default(0).notNull(),
  lastError: text("lastError"),
  lastAttemptAt: timestamp("lastAttemptAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
}, (t) => ({
  messageProviderTargetUnique: uniqueIndex("support_message_delivery_unique_target").on(t.messageId, t.provider, t.target),
  statusUpdatedIdx: index("idx_support_message_deliveries_status_updated").on(t.status, t.updatedAt),
}));

// RELATIONS
export const usersRelations = relations(users, ({ one, many }) => ({
  businesses: many(businesses),
  assignedLocation: one(locations, { fields: [users.assignedLocationId], references: [locations.id] }),
  blogPosts: many(blogPosts),
  legalAcceptanceEvents: many(legalAcceptanceEvents),
  platformAnnouncementProducts: many(platformAnnouncementProducts),
  announcementTemplates: many(announcementTemplates),
  announcementJingles: many(announcementJingles),
  announcementBulkJobs: many(announcementBulkJobs),
  locationPlaylistAssignments: many(locationPlaylistAssignments),
  trackReactions: many(trackReactions),
  supportConversations: many(supportConversations, { relationName: "support_conversation_owner" }),
  supportMessages: many(supportMessages),
  assignedSupportConversations: many(supportConversations, { relationName: "support_conversation_assignee" }),
}));

export const businessesRelations = relations(businesses, ({ one, many }) => ({
  user: one(users, { fields: [businesses.userId], references: [users.id] }),
  locations: many(locations),
  playlists: many(playlists),
  licenses: many(licenses),
  playLogs: many(playLogs),
  payments: many(payments),
  ttsCreditLots: many(ttsCreditLots),
  ttsUsageEvents: many(ttsUsageEvents),
  aiUsageEvents: many(aiUsageEvents),
  announcementAcquisitions: many(businessAnnouncementAcquisitions),
  announcementBulkJobs: many(announcementBulkJobs),
  locationPlaylistAssignments: many(locationPlaylistAssignments),
  waveSettings: one(waveSettings),
  supportConversations: many(supportConversations),
}));

export const locationsRelations = relations(locations, ({ one, many }) => ({
  business: one(businesses, { fields: [locations.businessId], references: [businesses.id] }),
  assignedUsers: many(users),
  bulkTargets: many(announcementBulkJobTargets),
  playlistAssignment: one(locationPlaylistAssignments, { fields: [locations.id], references: [locationPlaylistAssignments.locationId] }),
  playLogs: many(playLogs),
}));

export const tracksRelations = relations(tracks, ({ one, many }) => ({
  artist: one(artists, { fields: [tracks.artistId], references: [artists.id] }),
  album: one(albums, { fields: [tracks.albumId], references: [albums.id] }),
  business: one(businesses, { fields: [tracks.businessId], references: [businesses.id] }),
  playLogs: many(playLogs),
  reactions: many(trackReactions),
  playlistTracks: many(playlistTracks),
  bulkTargets: many(announcementBulkJobTargets),
  voiceAnnouncement: one(voiceAnnouncements, { fields: [tracks.id], references: [voiceAnnouncements.trackId] }),
  platformAnnouncementProduct: one(platformAnnouncementProducts, { fields: [tracks.id], references: [platformAnnouncementProducts.trackId] }),
  songOfTheWeek: one(songOfTheWeek, { fields: [tracks.id], references: [songOfTheWeek.trackId] }),
  downloadEvents: many(trackDownloadEvents),
}));

export const albumsRelations = relations(albums, ({ one, many }) => ({
  artist: one(artists, { fields: [albums.artistId], references: [artists.id] }),
  tracks: many(tracks),
}));

export const artistsRelations = relations(artists, ({ many }) => ({
  tracks: many(tracks),
  albums: many(albums),
}));

export const playlistsRelations = relations(playlists, ({ one, many }) => ({
  business: one(businesses, { fields: [playlists.businessId], references: [businesses.id] }),
  tracks: many(playlistTracks),
  bulkTargets: many(announcementBulkJobTargets),
  locationAssignments: many(locationPlaylistAssignments),
}));

export const playlistTracksRelations = relations(playlistTracks, ({ one }) => ({
  playlist: one(playlists, { fields: [playlistTracks.playlistId], references: [playlists.id] }),
  track: one(tracks, { fields: [playlistTracks.trackId], references: [tracks.id] }),
}));

export const playLogsRelations = relations(playLogs, ({ one }) => ({
  location: one(locations, { fields: [playLogs.locationId], references: [locations.id] }),
  business: one(businesses, { fields: [playLogs.businessId], references: [businesses.id] }),
  track: one(tracks, { fields: [playLogs.trackId], references: [tracks.id] }),
}));

export const songOfTheWeekRelations = relations(songOfTheWeek, ({ one, many }) => ({
  track: one(tracks, { fields: [songOfTheWeek.trackId], references: [tracks.id] }),
  downloadEvents: many(trackDownloadEvents),
}));

export const trackDownloadEventsRelations = relations(trackDownloadEvents, ({ one }) => ({
  track: one(tracks, { fields: [trackDownloadEvents.trackId], references: [tracks.id] }),
  songOfWeek: one(songOfTheWeek, { fields: [trackDownloadEvents.songOfWeekId], references: [songOfTheWeek.id] }),
}));

export const waveSettingsRelations = relations(waveSettings, ({ one }) => ({
  business: one(businesses, { fields: [waveSettings.businessId], references: [businesses.id] }),
}));

// Track Skips Table for Analytics
export const trackSkips = pgTable("track_skips", {
  id: serial("id").primaryKey(),
  trackId: text("trackId").references(() => tracks.id, { onDelete: "cascade" }).notNull(),
  userId: text("userId").references(() => users.id, { onDelete: "set null" }),
  businessId: text("businessId").references(() => businesses.id, { onDelete: "set null" }),
  locationId: text("locationId").references(() => locations.id, { onDelete: "set null" }),
  skippedAt: timestamp("skippedAt").defaultNow().notNull(),
  playedAt: timestamp("playedAt"),
  device: varchar("device", { length: 64 }),
  reason: varchar("reason", { length: 128 }),
}, (t) => ({
  skippedAtIdx: index("idx_track_skips_skipped_at").on(t.skippedAt),
  trackIdIdx: index("idx_track_skips_track_id").on(t.trackId),
  businessIdIdx: index("idx_track_skips_business_id").on(t.businessId),
  locationIdIdx: index("idx_track_skips_location_id").on(t.locationId),
}));

// Demo Requests Table
export const demoRequests = pgTable("demo_requests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  interest: text("interest").notNull(), // Announcements, Music, Workflow, etc.
  message: text("message"),
  status: demoRequestStatusEnum("status").default("PENDING").notNull(),
  consentAccepted: boolean("consentAccepted").default(false).notNull(),
  consentAcceptedAt: timestamp("consentAcceptedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
}, (t) => ({
  emailIdx: index("idx_demo_requests_email").on(t.email),
  statusIdx: index("idx_demo_requests_status").on(t.status),
}));

// Announcement Play Logs Table
export const announcementPlayLogs = pgTable("announcement_play_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  announcementId: text("announcementId").references(() => voiceAnnouncements.id, { onDelete: "cascade" }).notNull(),
  trackId: text("trackId").references(() => tracks.id, { onDelete: "cascade" }).notNull(),
  businessId: text("businessId").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  locationId: text("locationId").references(() => locations.id, { onDelete: "set null" }),
  wasSkipped: boolean("wasSkipped").default(false).notNull(),
  listenDurationSec: integer("listenDurationSec").default(0).notNull(), // seconds actually heard
  playedAt: timestamp("playedAt").defaultNow().notNull(),
}, (t) => ({
  businessPlayedIdx: index("announcement_play_logs_business_played_idx").on(t.businessId, t.playedAt),
  announcementPlayedIdx: index("announcement_play_logs_announcement_played_idx").on(t.announcementId, t.playedAt),
  trackPlayedIdx: index("announcement_play_logs_track_played_idx").on(t.trackId, t.playedAt),
}));

export const announcementPlayLogsRelations = relations(announcementPlayLogs, ({ one }) => ({
  announcement: one(voiceAnnouncements, { fields: [announcementPlayLogs.announcementId], references: [voiceAnnouncements.id] }),
  track: one(tracks, { fields: [announcementPlayLogs.trackId], references: [tracks.id] }),
  business: one(businesses, { fields: [announcementPlayLogs.businessId], references: [businesses.id] }),
  location: one(locations, { fields: [announcementPlayLogs.locationId], references: [locations.id] }),
}));

export const trackSkipsRelations = relations(trackSkips, ({ one }) => ({
  track: one(tracks, { fields: [trackSkips.trackId], references: [tracks.id] }),
  user: one(users, { fields: [trackSkips.userId], references: [users.id] }),
  business: one(businesses, { fields: [trackSkips.businessId], references: [businesses.id] }),
  location: one(locations, { fields: [trackSkips.locationId], references: [locations.id] }),
}));

export const supportConversationsRelations = relations(supportConversations, ({ one, many }) => ({
  user: one(users, { relationName: "support_conversation_owner", fields: [supportConversations.userId], references: [users.id] }),
  business: one(businesses, { fields: [supportConversations.businessId], references: [businesses.id] }),
  assignedToUser: one(users, { relationName: "support_conversation_assignee", fields: [supportConversations.assignedToUserId], references: [users.id] }),
  messages: many(supportMessages),
}));

export const supportMessagesRelations = relations(supportMessages, ({ one, many }) => ({
  conversation: one(supportConversations, { fields: [supportMessages.conversationId], references: [supportConversations.id] }),
  senderUser: one(users, { fields: [supportMessages.senderUserId], references: [users.id] }),
  deliveries: many(supportMessageDeliveries),
}));

export const supportMessageDeliveriesRelations = relations(supportMessageDeliveries, ({ one }) => ({
  message: one(supportMessages, { fields: [supportMessageDeliveries.messageId], references: [supportMessages.id] }),
}));

export const trackReactionsRelations = relations(trackReactions, ({ one }) => ({

  user: one(users, { fields: [trackReactions.userId], references: [users.id] }),
  track: one(tracks, { fields: [trackReactions.trackId], references: [tracks.id] }),
}));

export const licensesRelations = relations(licenses, ({ one }) => ({
  business: one(businesses, { fields: [licenses.businessId], references: [businesses.id] }),
}));

export const legalAcceptanceEventsRelations = relations(legalAcceptanceEvents, ({ one }) => ({
  user: one(users, { fields: [legalAcceptanceEvents.userId], references: [users.id] }),
}));

export const blogCategoriesRelations = relations(blogCategories, ({ many }) => ({
  posts: many(blogPosts),
}));

export const blogPostsRelations = relations(blogPosts, ({ one, many }) => ({
  category: one(blogCategories, { fields: [blogPosts.categoryId], references: [blogCategories.id] }),
  author: one(users, { fields: [blogPosts.authorId], references: [users.id] }),
  tags: many(blogPostTags),
}));

export const blogPostTagsRelations = relations(blogPostTags, ({ one }) => ({
  post: one(blogPosts, { fields: [blogPostTags.postId], references: [blogPosts.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  business: one(businesses, { fields: [payments.businessId], references: [businesses.id] }),
}));
export const voiceAnnouncementsRelations = relations(voiceAnnouncements, ({ one, many }) => ({
  business: one(businesses, { fields: [voiceAnnouncements.businessId], references: [businesses.id] }),
  track: one(tracks, { fields: [voiceAnnouncements.trackId], references: [tracks.id] }),
  platformAnnouncement: one(platformAnnouncementProducts, { fields: [voiceAnnouncements.platformAnnouncementId], references: [platformAnnouncementProducts.id] }),
  generatedByBulkJobs: many(announcementBulkJobs),
  bulkTargets: many(announcementBulkJobTargets),
  acquisitions: many(businessAnnouncementAcquisitions),
}));

export const announcementTemplatesRelations = relations(announcementTemplates, ({ one }) => ({
  createdByUser: one(users, { fields: [announcementTemplates.createdByUserId], references: [users.id] }),
}));

export const announcementJinglesRelations = relations(announcementJingles, ({ one }) => ({
  createdByUser: one(users, { fields: [announcementJingles.createdByUserId], references: [users.id] }),
}));

export const announcementBulkJobsRelations = relations(announcementBulkJobs, ({ one, many }) => ({
  business: one(businesses, { fields: [announcementBulkJobs.businessId], references: [businesses.id] }),
  createdByUser: one(users, { fields: [announcementBulkJobs.createdByUserId], references: [users.id] }),
  generatedAnnouncement: one(voiceAnnouncements, { fields: [announcementBulkJobs.generatedAnnouncementId], references: [voiceAnnouncements.id] }),
  jingle: one(announcementJingles, { fields: [announcementBulkJobs.jingleId], references: [announcementJingles.id] }),
  targets: many(announcementBulkJobTargets),
}));

export const announcementBulkJobTargetsRelations = relations(announcementBulkJobTargets, ({ one }) => ({
  job: one(announcementBulkJobs, { fields: [announcementBulkJobTargets.jobId], references: [announcementBulkJobs.id] }),
  location: one(locations, { fields: [announcementBulkJobTargets.locationId], references: [locations.id] }),
  playlist: one(playlists, { fields: [announcementBulkJobTargets.playlistId], references: [playlists.id] }),
  announcement: one(voiceAnnouncements, { fields: [announcementBulkJobTargets.announcementId], references: [voiceAnnouncements.id] }),
  track: one(tracks, { fields: [announcementBulkJobTargets.trackId], references: [tracks.id] }),
}));

export const locationPlaylistAssignmentsRelations = relations(locationPlaylistAssignments, ({ one }) => ({
  business: one(businesses, { fields: [locationPlaylistAssignments.businessId], references: [businesses.id] }),
  location: one(locations, { fields: [locationPlaylistAssignments.locationId], references: [locations.id] }),
  playlist: one(playlists, { fields: [locationPlaylistAssignments.playlistId], references: [playlists.id] }),
  updatedByUser: one(users, { fields: [locationPlaylistAssignments.updatedByUserId], references: [users.id] }),
}));

export const platformAnnouncementProductsRelations = relations(platformAnnouncementProducts, ({ one, many }) => ({
  track: one(tracks, { fields: [platformAnnouncementProducts.trackId], references: [tracks.id] }),
  createdByUser: one(users, { fields: [platformAnnouncementProducts.createdByUserId], references: [users.id] }),
  acquisitions: many(businessAnnouncementAcquisitions),
  importedAnnouncements: many(voiceAnnouncements),
}));

export const businessAnnouncementAcquisitionsRelations = relations(businessAnnouncementAcquisitions, ({ one }) => ({
  business: one(businesses, { fields: [businessAnnouncementAcquisitions.businessId], references: [businesses.id] }),
  platformAnnouncement: one(platformAnnouncementProducts, { fields: [businessAnnouncementAcquisitions.platformAnnouncementId], references: [platformAnnouncementProducts.id] }),
  payment: one(payments, { fields: [businessAnnouncementAcquisitions.paymentId], references: [payments.id] }),
  importedAnnouncement: one(voiceAnnouncements, { fields: [businessAnnouncementAcquisitions.importedAnnouncementId], references: [voiceAnnouncements.id] }),
}));

export const ttsCreditLotsRelations = relations(ttsCreditLots, ({ one }) => ({
  business: one(businesses, { fields: [ttsCreditLots.businessId], references: [businesses.id] }),
  payment: one(payments, { fields: [ttsCreditLots.paymentId], references: [payments.id] }),
}));

export const ttsUsageEventsRelations = relations(ttsUsageEvents, ({ one }) => ({
  business: one(businesses, { fields: [ttsUsageEvents.businessId], references: [businesses.id] }),
  announcement: one(voiceAnnouncements, { fields: [ttsUsageEvents.announcementId], references: [voiceAnnouncements.id] }),
}));
