import { pgTable, text, serial, boolean, jsonb, time, integer, date, timestamp, bigint, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const organizationSettings = pgTable("organization_settings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  primaryColor: text("primary_color").notNull(),
  secondaryColor: text("secondary_color"),
  logoUrl: text("logo_url"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  firstName: text("firstName").notNull(),
  lastName: text("lastName").notNull(),
  phone: text("phone"),
  isParent: boolean("isParent").default(false).notNull(),
  isAdmin: boolean("isAdmin").default(false).notNull(),
  createdAt: text("createdAt").notNull().default(new Date().toISOString()),
  householdId: serial("householdId").references(() => households.id),
});

export const households = pgTable("households", {
  id: serial("id").primaryKey(),
  lastName: text("lastName").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zipCode").notNull(),
  primaryEmail: text("primaryEmail").notNull(),
  createdAt: text("createdAt").notNull().default(new Date().toISOString()),
});

export const complexes = pgTable("complexes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  country: text("country").notNull(),
  openTime: text("open_time").notNull(),
  closeTime: text("close_time").notNull(),
  rules: text("rules"),
  directions: text("directions"),
  isOpen: boolean("is_open").default(true).notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const fields = pgTable("fields", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  hasLights: boolean("has_lights").default(false).notNull(),
  hasParking: boolean("has_parking").default(false).notNull(),
  isOpen: boolean("is_open").default(true).notNull(),
  specialInstructions: text("special_instructions"),
  complexId: serial("complex_id").references(() => complexes.id),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character");

export const insertOrganizationSettingsSchema = createInsertSchema(organizationSettings, {
  name: z.string().min(1, "Organization name is required"),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format").optional(),
  logoUrl: z.string().url("Invalid URL format").optional(),
});

export const selectOrganizationSettingsSchema = createSelectSchema(organizationSettings);

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Please enter a valid email address").min(1, "Email is required"),
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  password: passwordSchema,
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  phone: z.string().nullable(),
  isAdmin: z.boolean().default(false),
  isParent: z.boolean().default(false),
  householdId: z.number().optional(),
  createdAt: z.string().optional(),
});

export const insertHouseholdSchema = createInsertSchema(households, {
  lastName: z.string().min(1, "Last name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required").max(2),
  zipCode: z.string().min(5, "ZIP code is required").max(10),
  primaryEmail: z.string().email("Please enter a valid email address"),
});

export const insertComplexSchema = createInsertSchema(complexes, {
  name: z.string().min(1, "Complex name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required"),
  country: z.string().min(2, "Country is required"),
  openTime: z.string().min(1, "Open time is required"),
  closeTime: z.string().min(1, "Close time is required"),
  rules: z.string().optional(),
  directions: z.string().optional(),
  isOpen: z.boolean().optional(),
});

export const selectComplexSchema = createSelectSchema(complexes);

export const selectUserSchema = createSelectSchema(users);
export const selectHouseholdSchema = createSelectSchema(households);

export const insertFieldSchema = createInsertSchema(fields, {
  name: z.string().min(1, "Field name is required"),
  hasLights: z.boolean(),
  hasParking: z.boolean(),
  isOpen: z.boolean(),
  specialInstructions: z.string().optional(),
  complexId: z.number(),
});

export const selectFieldSchema = createSelectSchema(fields);

export const events = pgTable("events", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  name: text("name").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  timezone: text("timezone").notNull(),
  applicationDeadline: text("application_deadline").notNull(),
  details: text("details"),
  agreement: text("agreement"),
  refundPolicy: text("refund_policy"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const eventAgeGroups = pgTable("event_age_groups", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id),
  ageGroup: text("age_group").notNull(),
  birthYear: integer("birth_year").notNull(),
  gender: text("gender").notNull(),
  divisionCode: text("division_code").notNull(),
  projectedTeams: integer("projected_teams").notNull(),
  scoringRule: text("scoring_rule"),
  fieldSize: text("field_size").notNull(),
  amountDue: integer("amount_due"),
  createdAt: text("created_at").notNull(),
});

export const insertEventAgeGroupSchema = createInsertSchema(eventAgeGroups, {
  ageGroup: z.string().min(1, "Age group is required"),
  birthYear: z.number().int("Birth year must be a valid year"),
  gender: z.enum(["Boys", "Girls"], "Gender must be either Boys or Girls"),
  divisionCode: z.string().min(1, "Division code is required"),
  projectedTeams: z.number().int().min(0, "Projected teams must be 0 or greater"),
  fieldSize: z.string().min(1, "Field size is required"),
  amountDue: z.number().int().min(0, "Amount due must be 0 or greater").optional(),
  scoringRule: z.string().optional(),
});

export type InsertEventAgeGroup = typeof eventAgeGroups.$inferInsert;
export type SelectEventAgeGroup = typeof eventAgeGroups.$inferSelect;

export const insertEventSchema = createInsertSchema(events, {
  name: z.string().min(1, "Event name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  timezone: z.string().min(1, "Time zone is required"),
  applicationDeadline: z.string().min(1, "Application deadline is required"),
  details: z.string().optional(),
  agreement: z.string().optional(),
  refundPolicy: z.string().optional(),
});

export type InsertEvent = typeof events.$inferInsert;
export type SelectEvent = typeof events.$inferSelect;

export const gameTimeSlots = pgTable("game_time_slots", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: 'cascade' }),
  fieldId: integer("field_id").notNull().references(() => fields.id),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  dayIndex: integer("day_index").notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const tournamentGroups = pgTable("tournament_groups", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: 'cascade' }),
  ageGroupId: integer("age_group_id").notNull().references(() => eventAgeGroups.id),
  name: text("name").notNull(),
  type: text("type").notNull(),
  stage: text("stage").notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: 'cascade' }),
  ageGroupId: integer("age_group_id").notNull().references(() => eventAgeGroups.id),
  groupId: integer("group_id").references(() => tournamentGroups.id),
  name: text("name").notNull(),
  coach: text("coach"),
  managerName: text("manager_name"),
  managerPhone: text("manager_phone"),
  managerEmail: text("manager_email"),
  seedRanking: integer("seed_ranking"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: 'cascade' }),
  ageGroupId: integer("age_group_id").notNull().references(() => eventAgeGroups.id),
  groupId: integer("group_id").references(() => tournamentGroups.id),
  fieldId: integer("field_id").references(() => fields.id),
  timeSlotId: integer("time_slot_id").references(() => gameTimeSlots.id),
  homeTeamId: integer("home_team_id").references(() => teams.id),
  awayTeamId: integer("away_team_id").references(() => teams.id),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  status: text("status").notNull().default('scheduled'),
  round: integer("round").notNull(),
  matchNumber: integer("match_number").notNull(),
  duration: integer("duration").notNull(),
  breakTime: integer("break_time").notNull().default(5),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const insertGameTimeSlotSchema = createInsertSchema(gameTimeSlots);
export const insertTournamentGroupSchema = createInsertSchema(tournamentGroups);
export const insertTeamSchema = createInsertSchema(teams);
export const insertGameSchema = createInsertSchema(games, {
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']),
  duration: z.number().min(20).max(120),
  breakTime: z.number().min(0).max(30),
});

export const selectGameTimeSlotSchema = createSelectSchema(gameTimeSlots);
export const selectTournamentGroupSchema = createSelectSchema(tournamentGroups);
export const selectTeamSchema = createSelectSchema(teams);
export const selectGameSchema = createSelectSchema(games);

export type InsertGameTimeSlot = typeof gameTimeSlots.$inferInsert;
export type SelectGameTimeSlot = typeof gameTimeSlots.$inferSelect;
export type InsertTournamentGroup = typeof tournamentGroups.$inferInsert;
export type SelectTournamentGroup = typeof tournamentGroups.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;
export type SelectTeam = typeof teams.$inferSelect;
export type InsertGame = typeof games.$inferInsert;
export type SelectGame = typeof games.$inferSelect;

export const eventComplexes = pgTable("event_complexes", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id),
  complexId: integer("complex_id").notNull().references(() => complexes.id),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const eventFieldSizes = pgTable("event_field_sizes", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id),
  fieldId: integer("field_id").notNull().references(() => fields.id),
  fieldSize: text("field_size").notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const eventScoringRules = pgTable("event_scoring_rules", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id),
  title: text("title").notNull(),
  win: integer("win").notNull(),
  loss: integer("loss").notNull(),
  tie: integer("tie").notNull(),
  goalCapped: integer("goal_capped").notNull(),
  shutout: integer("shutout").notNull(),
  redCard: integer("red_card").notNull(),
  tieBreaker: text("tie_breaker").notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const insertEventScoringRuleSchema = createInsertSchema(eventScoringRules, {
  title: z.string().min(1, "Title is required"),
  win: z.number().min(0, "Win points must be positive"),
  loss: z.number().min(0, "Loss points must be positive"),
  tie: z.number().min(0, "Tie points must be positive"),
  goalCapped: z.number().min(0, "Goal cap must be positive"),
  shutout: z.number().min(0, "Shutout points must be positive"),
  redCard: z.number().min(-10, "Red card points must be greater than -10"),
  tieBreaker: z.string().min(1, "Tie breaker is required"),
});

export const selectEventScoringRuleSchema = createSelectSchema(eventScoringRules);
export type InsertEventScoringRule = typeof eventScoringRules.$inferInsert;
export type SelectEventScoringRule = typeof eventScoringRules.$inferSelect;

export const eventAdministrators = pgTable("event_administrators", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").notNull(),
  adminType: text("admin_type").notNull().default('super_admin'),
  permissions: jsonb("permissions"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const eventSettings = pgTable("event_settings", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id),
  settingKey: text("setting_key").notNull(),
  settingValue: text("setting_value").notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const insertEventAdministratorSchema = createInsertSchema(eventAdministrators, {
  role: z.enum(['owner', 'admin', 'moderator']),
  adminType: z.enum(['super_admin', 'tournament_admin', 'score_admin', 'finance_admin']).default('super_admin'),
  permissions: z.record(z.boolean()).optional(),
});

export const insertEventSettingSchema = createInsertSchema(eventSettings, {
  settingKey: z.string().min(1, "Setting key is required"),
  settingValue: z.string().min(1, "Setting value is required"),
});

export const selectEventAdministratorSchema = createSelectSchema(eventAdministrators);
export const selectEventSettingSchema = createSelectSchema(eventSettings);

export type InsertEventAdministrator = typeof eventAdministrators.$inferInsert;
export type SelectEventAdministrator = typeof eventAdministrators.$inferSelect;
export type InsertEventSetting = typeof eventSettings.$inferInsert;
export type SelectEventSetting = typeof eventSettings.$inferSelect;

export const chatRooms = pgTable("chat_rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  eventId: text("event_id").references(() => events.id),
  teamId: integer("team_id").references(() => teams.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const chatParticipants = pgTable("chat_participants", {
  id: serial("id").primaryKey(),
  chatRoomId: integer("chat_room_id").notNull().references(() => chatRooms.id),
  userId: integer("user_id").notNull().references(() => users.id),
  isAdmin: boolean("is_admin").default(false).notNull(),
  lastReadAt: timestamp("last_read_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatRoomId: integer("chat_room_id").notNull().references(() => chatRooms.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  type: text("type").notNull().default('text'),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertChatRoomSchema = createInsertSchema(chatRooms, {
  name: z.string().min(1, "Chat room name is required"),
  type: z.enum(['team', 'event', 'private']),
  eventId: z.number().optional(),
  teamId: z.number().optional(),
});

export const insertMessageSchema = createInsertSchema(messages, {
  content: z.string().min(1, "Message content is required"),
  type: z.enum(['text', 'image', 'system']).default('text'),
  metadata: z.record(z.unknown()).optional(),
});

export const insertChatParticipantSchema = createInsertSchema(chatParticipants, {
  isAdmin: z.boolean().default(false),
});

export const selectChatRoomSchema = createSelectSchema(chatRooms);
export const selectMessageSchema = createSelectSchema(messages);
export const selectChatParticipantSchema = createSelectSchema(chatParticipants);

export type InsertChatRoom = typeof chatRooms.$inferInsert;
export type SelectChatRoom = typeof chatRooms.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type SelectMessage = typeof messages.$inferSelect;
export type InsertChatParticipant = typeof chatParticipants.$inferInsert;
export type SelectChatParticipant = typeof chatParticipants.$inferSelect;


export const householdInvitations = pgTable("household_invitations", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull().references(() => households.id),
  email: text("email").notNull(),
  status: text("status").notNull().default('pending'),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").notNull().references(() => users.id),
});

export const insertHouseholdInvitationSchema = createInsertSchema(householdInvitations, {
  email: z.string().email("Please enter a valid email address"),
  status: z.enum(['pending', 'accepted', 'declined', 'expired']).default('pending'),
  token: z.string(),
  expiresAt: z.string(),
  createdBy: z.number(),
  householdId: z.number(),
});

export const selectHouseholdInvitationSchema = createSelectSchema(householdInvitations);

export type InsertHouseholdInvitation = typeof householdInvitations.$inferInsert;
export type SelectHouseholdInvitation = typeof householdInvitations.$inferSelect;

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertHousehold = typeof households.$inferInsert;
export type SelectHousehold = typeof households.$inferSelect;
export type InsertOrganizationSettings = typeof organizationSettings.$inferInsert;
export type SelectOrganizationSettings = typeof organizationSettings.$inferSelect;
export type InsertComplex = typeof complexes.$inferInsert;
export type SelectComplex = typeof complexes.$inferSelect;
export type InsertField = typeof fields.$inferInsert;
export type SelectField = typeof fields.$inferSelect;

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const files = pgTable("files", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  type: text("type").notNull(),
  size: bigint("size", { mode: "number" }).notNull(),
  folderId: text("folder_id"),
  thumbnailUrl: text("thumbnail_url"),
  uploadedById: integer("uploaded_by_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const folders = pgTable("folders", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  parentId: text("parent_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const foldersRelations = relations(folders, ({ one, many }) => ({
  parent: one(folders, {
    fields: [folders.parentId],
    references: [folders.id],
  }),
  files: many(files),
  children: many(folders),
}));

export const filesRelations = relations(files, ({ one }) => ({
  folder: one(folders, {
    fields: [files.folderId],
    references: [folders.id],
  }),
  uploadedBy: one(users, {
    fields: [files.uploadedById],
    references: [users.id],
  }),
}));

export const insertFileSchema = createInsertSchema(files, {
  name: z.string().min(1, "File name is required"),
  url: z.string().min(1, "File URL is required"),
  type: z.string().min(1, "File type is required"),
  size: z.number().positive("File size must be positive"),
  folderId: z.string().nullable().optional(),
  thumbnailUrl: z.string().nullable().optional(),
  uploadedById: z.number().optional(),
});

export const insertFolderSchema = createInsertSchema(folders, {
  name: z.string().min(1, "Folder name is required"),
  parentId: z.string().nullable().optional(),
});

export const selectFileSchema = createSelectSchema(files);
export const selectFolderSchema = createSelectSchema(folders);

export type InsertFile = typeof files.$inferInsert;
export type SelectFile = typeof files.$inferSelect;
export type InsertFolder = typeof folders.$inferInsert;
export type SelectFolder = typeof folders.$inferSelect;

export const seasonalScopes = pgTable("seasonal_scopes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startYear: integer("start_year").notNull(),
  endYear: integer("end_year").notNull(),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const ageGroupSettings = pgTable("age_group_settings", {
  id: serial("id").primaryKey(),
  seasonalScopeId: integer("seasonal_scope_id")
    .notNull()
    .references(() => seasonalScopes.id, { onDelete: 'cascade' }),
  ageGroup: text("age_group").notNull(),
  birthYear: integer("birth_year").notNull(),
  gender: text("gender").notNull(),
  divisionCode: text("division_code").notNull(),
  minBirthYear: integer("min_birth_year").notNull(),
  maxBirthYear: integer("max_birth_year").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const seasonalScopesRelations = relations(seasonalScopes, ({ many }) => ({
  ageGroups: many(ageGroupSettings),
}));

export const ageGroupSettingsRelations = relations(ageGroupSettings, ({ one }) => ({
  seasonalScope: one(seasonalScopes, {
    fields: [ageGroupSettings.seasonalScopeId],
    references: [seasonalScopes.id],
  }),
}));

export const insertSeasonalScopeSchema = createInsertSchema(seasonalScopes, {
  name: z.string().min(1, "Name is required"),
  startYear: z.number().int().min(2000).max(2100),
  endYear: z.number().int().min(2000).max(2100),
  isActive: z.boolean(),
});

export const insertAgeGroupSettingSchema = createInsertSchema(ageGroupSettings, {
  ageGroup: z.string().min(1, "Age group is required"),
  birthYear: z.number().int("Birth year must be a valid year"),
  gender: z.enum(["Boys", "Girls"]),
  divisionCode: z.string().min(1, "Division code is required"),
  minBirthYear: z.number().int("Min birth year must be a valid year"),
  maxBirthYear: z.number().int("Max birth year must be a valid year"),
});

export const selectSeasonalScopeSchema = createSelectSchema(seasonalScopes);
export const selectAgeGroupSettingSchema = createSelectSchema(ageGroupSettings);

export type InsertSeasonalScope = typeof seasonalScopes.$inferInsert;
export type SelectSeasonalScope = typeof seasonalScopes.$inferSelect;
export type InsertAgeGroupSetting = typeof ageGroupSettings.$inferInsert;
export type SelectAgeGroupSetting = typeof ageGroupSettings.$inferSelect;

export const adminRoles = pgTable("admin_roles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  roleId: integer("role_id").notNull().references(() => roles.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRoleSchema = createInsertSchema(roles, {
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional(),
});

export const selectRoleSchema = createSelectSchema(roles);

export type InsertRole = typeof roles.$inferInsert;
export type SelectRole = typeof roles.$inferSelect;
export type InsertAdminRole = typeof adminRoles.$inferInsert;
export type SelectAdminRole = typeof adminRoles.$inferSelect;

export const adminFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  roles: z.array(z.string()).min(1, "At least one role is required"),
});

export type AdminFormValues = z.infer<typeof adminFormSchema>;

export const updates = pgTable("updates", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUpdateSchema = createInsertSchema(updates, {
  content: z.string().min(1, "Update content is required"),
});

export const selectUpdateSchema = createSelectSchema(updates);

export type InsertUpdate = typeof updates.$inferInsert;
export type SelectUpdate = typeof updates.$inferSelect;

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountType: text("discount_type").notNull(),  // 'fixed' or 'percentage'
  amount: integer("amount").notNull(),
  expirationDate: timestamp("expiration_date"),
  description: text("description"),
  eventId: bigint("event_id", { mode: "number" }).references(() => events.id),
  maxUses: integer("max_uses"),
  usageCount: integer("usage_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCouponSchema = createInsertSchema(coupons, {
  code: z.string().min(1, "Coupon code is required"),
  discountType: z.enum(['fixed', 'percentage'], "Invalid discount type"),
  amount: z.number().positive("Amount must be positive"),
  expirationDate: z.string().min(1, "Expiration date is required"),
  description: z.string().optional(),
  eventId: z.string().optional(),
  maxUses: z.number().int().positive("Maximum uses must be positive").optional(),
  isActive: z.boolean().default(true),
});

export const selectCouponSchema = createSelectSchema(coupons);

export type InsertCoupon = typeof coupons.$inferInsert;
export type SelectCoupon = typeof coupons.$inferSelect;

export const eventFormTemplates = pgTable("event_form_templates", {
  id: serial("id").primaryKey(),
  eventId: bigint("event_id", { mode: "number" }).notNull().references(() => events.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  description: text("description"),
  isPublished: boolean("is_published").default(false).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const formFields = pgTable("form_fields", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull().references(() => eventFormTemplates.id, { onDelete: 'cascade' }),
  label: text("label").notNull(),
  type: text("type").notNull(), // 'dropdown', 'paragraph', 'input'
  required: boolean("required").default(false).notNull(),
  order: integer("order").notNull(),
  placeholder: text("placeholder"),
  helpText: text("help_text"),
  validation: jsonb("validation"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const formFieldOptions = pgTable("form_field_options", {
  id: serial("id").primaryKey(),
  fieldId: integer("field_id").notNull().references(() => formFields.id, { onDelete: 'cascade' }),
  label: text("label").notNull(),
  value: text("value").notNull(),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const formResponses = pgTable("form_responses", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull().references(() => eventFormTemplates.id),
  teamId: integer("team_id").notNull().references(() => teams.id),
  responses: jsonb("responses").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Add Zod schemas for the new tables
export const insertEventFormTemplateSchema = createInsertSchema(eventFormTemplates, {
  name: z.string().min(1, "Template name is required"),
description: z.string().optional(),
  isPublished: z.boolean().default(false),
});

export const insertFormFieldSchema = createInsertSchema(formFields, {
  label: z.string().min(1, "Field label is required"),
  type: z.enum(["dropdown", "paragraph", "input"]),
  required: z.boolean().default(false),
  order: z.number().int().min(0),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  validation: z.record(z.unknown()).optional(),
});

export const insertFormFieldOptionSchema = createInsertSchema(formFieldOptions, {
  label: z.string().min(1, "Option label is required"),
  value: z.string().min(1, "Option value is required"),
  order: z.number().int().min(0),
});

export const insertFormResponseSchema = createInsertSchema(formResponses, {
  responses: z.record(z.unknown()).refine((data) => Object.keys(data).length > 0, "Responses cannot be empty"),
});

// Add select schemas
export const selectEventFormTemplateSchema = createSelectSchema(eventFormTemplates);
export const selectFormFieldSchema = createSelectSchema(formFields);
export const selectFormFieldOptionSchema = createSelectSchema(formFieldOptions);
export const selectFormResponseSchema = createSelectSchema(formResponses);

// Add types
export type InsertEventFormTemplate = typeof eventFormTemplates.$inferInsert;
export type SelectEventFormTemplate = typeof eventFormTemplates.$inferSelect;
export type InsertFormField = typeof formFields.$inferInsert;
export type SelectFormField = typeof formFields.$inferSelect;
export type InsertFormFieldOption = typeof formFieldOptions.$inferInsert;
export type SelectFormFieldOption = typeof formFieldOptions.$inferSelect;
export type InsertFormResponse = typeof formResponses.$inferInsert;
export type SelectFormResponse = typeof formResponses.$inferSelect;

// Add relations
export const eventFormTemplatesRelations = relations(eventFormTemplates, ({ one, many }) => ({
  event: one(events, {
    fields: [eventFormTemplates.eventId],
    references: [events.id],
  }),
  fields: many(formFields),
  responses: many(formResponses),
}));

export const formFieldsRelations = relations(formFields, ({ one, many }) => ({
  template: one(eventFormTemplates, {
    fields: [formFields.templateId],
    references: [eventFormTemplates.id],
  }),
  options: many(formFieldOptions),
}));

export const formFieldOptionsRelations = relations(formFieldOptions, ({ one }) => ({
  field: one(formFields, {
    fields: [formFieldOptions.fieldId],
    references: [formFields.id],
  }),
}));

export const formResponsesRelations = relations(formResponses, ({ one }) => ({
  template: one(eventFormTemplates, {
    fields: [formResponses.templateId],
    references: [eventFormTemplates.id],
  }),
  team: one(teams, {
    fields: [formResponses.teamId],
    references: [teams.id],
  }),
}));