import { pgTable, text, integer, boolean, timestamp, jsonb, pgEnum, uniqueIndex, index, doublePrecision } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

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

// Enums - keep them as lowercase for DB if they were created that way, but Prisma usually keeps them as defined
export const roleEnum = pgEnum("role", ["ADMIN", "BUSINESS_OWNER", "STAFF"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["INACTIVE", "ACTIVE", "EXPIRED"]);
export const billingIntervalEnum = pgEnum("billing_interval", ["monthly", "yearly"]);
export const userTypeEnum = pgEnum("user_type", ["BUSINESS", "CREATOR"]);
export const documentStatusEnum = pgEnum("document_status", ["GENERATING", "READY", "FAILED"]);

// Users Table
export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()), 
  email: text("email").notNull().unique(),
  passwordHash: text("passwordHash").default("SUPABASE_AUTH"),
  role: roleEnum("role").default("BUSINESS_OWNER").notNull(),
  userType: userTypeEnum("userType").default("BUSINESS").notNull(),
  phone: text("phone"),
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

// PlayLogs Table
export const playLogs = pgTable("play_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  locationId: text("locationId").references(() => locations.id),
  businessId: text("businessId").references(() => businesses.id),
  trackId: text("trackId").references(() => tracks.id).notNull(),
  playedAt: timestamp("playedAt").defaultNow().notNull(),
});

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
  text: text("text").notNull(),
  languageCode: text("languageCode").default("ru-RU").notNull(),
  provider: text("provider").default("google").notNull(),
  voiceName: text("voiceName").notNull(),
  speakingRate: doublePrecision("speakingRate").default(1.0).notNull(),
  pitch: doublePrecision("pitch").default(0.0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
});

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

// RELATIONS
export const usersRelations = relations(users, ({ many }) => ({
  businesses: many(businesses),
  blogPosts: many(blogPosts),
  legalAcceptanceEvents: many(legalAcceptanceEvents),
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
}));

export const locationsRelations = relations(locations, ({ one, many }) => ({
  business: one(businesses, { fields: [locations.businessId], references: [businesses.id] }),
  playLogs: many(playLogs),
}));

export const tracksRelations = relations(tracks, ({ one, many }) => ({
  artist: one(artists, { fields: [tracks.artistId], references: [artists.id] }),
  album: one(albums, { fields: [tracks.albumId], references: [albums.id] }),
  business: one(businesses, { fields: [tracks.businessId], references: [businesses.id] }),
  playLogs: many(playLogs),
  playlistTracks: many(playlistTracks),
  voiceAnnouncement: one(voiceAnnouncements, { fields: [tracks.id], references: [voiceAnnouncements.trackId] }),
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
export const voiceAnnouncementsRelations = relations(voiceAnnouncements, ({ one }) => ({
  business: one(businesses, { fields: [voiceAnnouncements.businessId], references: [businesses.id] }),
  track: one(tracks, { fields: [voiceAnnouncements.trackId], references: [tracks.id] }),
}));

export const ttsCreditLotsRelations = relations(ttsCreditLots, ({ one }) => ({
  business: one(businesses, { fields: [ttsCreditLots.businessId], references: [businesses.id] }),
  payment: one(payments, { fields: [ttsCreditLots.paymentId], references: [payments.id] }),
}));

export const ttsUsageEventsRelations = relations(ttsUsageEvents, ({ one }) => ({
  business: one(businesses, { fields: [ttsUsageEvents.businessId], references: [businesses.id] }),
  announcement: one(voiceAnnouncements, { fields: [ttsUsageEvents.announcementId], references: [voiceAnnouncements.id] }),
}));
