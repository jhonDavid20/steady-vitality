/**
 * Steady Vitality — OpenAPI 3.0 specification
 *
 * Fully inline: no JSDoc scanning required.
 * Covers every route across Auth, Users, Coaches, Invites, and Admin.
 */
import { config } from './env';

// ─── Reusable example IDs ─────────────────────────────────────────────────────
const UUID   = '550e8400-e29b-41d4-a716-446655440000';
const UUID2  = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const UUID3  = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const TS     = '2026-03-01T12:00:00.000Z';
const TOKEN  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6ImNvYWNoQHN0ZWFkeXZpdGFsaXR5LmNvbSIsInJvbGUiOiJjb2FjaCIsInNlc3Npb25JZCI6ImExYjJjM2Q0LWU1ZjYtNzg5MC1hYmNkLWVmMTIzNDU2Nzg5MCIsImlhdCI6MTc0MzEwMDAwMCwiZXhwIjoxNzQzMTAzNjAwfQ.signature';
const REFRESH = 'dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4gZXhhbXBsZQ==';
const INVITE_TOKEN = 'a3f9b2c1d8e74f56a3b2c1d8e74f56a3b2c1d8e74f56a3b2c1d8e74f56a3b2c1d8e74f56a3b2c1d8e7';

export const specs = {
  openapi: '3.0.0',

  info: {
    title: 'Steady Vitality API',
    version: '1.0.0',
    description: `
## Health & Fitness Coaching Platform

Full REST API for the Steady Vitality coaching app.

### Authentication
All protected endpoints require a \`Bearer\` JWT in the \`Authorization\` header:
\`\`\`
Authorization: Bearer <accessToken>
\`\`\`

### Roles
| Role    | Description |
|---------|-------------|
| \`admin\`  | Full platform access |
| \`coach\`  | Manage their own profile, clients, and packages |
| \`client\` | Browse coaches, manage their own profile |

### Token lifecycle
Access tokens expire in **1 hour** (7 days if \`rememberMe: true\`).
Use \`POST /api/auth/refresh\` to obtain a new access token using the refresh token.
    `,
    contact: { name: 'Steady Vitality Support', email: 'support@steadyvitality.com' },
    license: { name: 'MIT', url: 'https://opensource.org/licenses/MIT' },
  },

  servers: [
    {
      url: config.nodeEnv === 'production'
        ? 'https://api.steadyvitality.com'
        : `http://localhost:${config.port}`,
      description: config.nodeEnv === 'production' ? 'Production' : 'Development',
    },
  ],

  tags: [
    { name: 'Auth',     description: 'Registration, login, token management' },
    { name: 'Users',    description: 'Client profile management' },
    { name: 'Coaches',  description: 'Coach profiles and client management' },
    { name: 'Packages', description: 'Coaching package templates and client assignments' },
    { name: 'Invites',  description: 'Coach and admin invite flows' },
    { name: 'Admin',    description: 'Platform administration (admin role required)' },
  ],

  // ─── Reusable components ───────────────────────────────────────────────────
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste your access token (no "Bearer " prefix needed here)',
      },
    },

    // ── Schemas ──────────────────────────────────────────────────────────────
    schemas: {

      // ── Core user ──────────────────────────────────────────────────────────
      User: {
        type: 'object',
        properties: {
          id:                    { type: 'string', format: 'uuid', example: UUID },
          email:                 { type: 'string', format: 'email', example: 'coach@steadyvitality.com' },
          username:              { type: 'string', example: 'coach_jane' },
          firstName:             { type: 'string', example: 'Jane' },
          lastName:              { type: 'string', example: 'Doe' },
          avatar:                { type: 'string', format: 'uri', nullable: true, example: 'https://cdn.steadyvitality.com/avatars/jane.jpg' },
          role:                  { type: 'string', enum: ['admin', 'coach', 'client'], example: 'coach' },
          isEmailVerified:       { type: 'boolean', example: true },
          hasCompletedOnboarding:{ type: 'boolean', example: false },
          lastLoginAt:           { type: 'string', format: 'date-time', nullable: true, example: TS },
          createdAt:             { type: 'string', format: 'date-time', example: TS },
          updatedAt:             { type: 'string', format: 'date-time', example: TS },
        },
      },

      TokenPair: {
        type: 'object',
        properties: {
          accessToken:  { type: 'string', example: TOKEN },
          refreshToken: { type: 'string', example: REFRESH },
          expiresIn:    { type: 'integer', description: 'Seconds until access token expires', example: 3600 },
        },
      },

      AuthResponse: {
        type: 'object',
        properties: {
          success:  { type: 'boolean', example: true },
          message:  { type: 'string', example: 'Login successful' },
          user:     { $ref: '#/components/schemas/User' },
          tokens:   { $ref: '#/components/schemas/TokenPair' },
        },
      },

      // ── Client profile ─────────────────────────────────────────────────────
      UserProfile: {
        type: 'object',
        properties: {
          id:                   { type: 'string', format: 'uuid', example: UUID2 },
          userId:               { type: 'string', format: 'uuid', example: UUID },
          gender:               { type: 'string', enum: ['male','female','other','prefer_not_to_say'], nullable: true, example: 'female' },
          dateOfBirth:          { type: 'string', format: 'date', nullable: true, example: '1992-07-14' },
          height:               { type: 'number', description: 'cm', nullable: true, example: 168 },
          weight:               { type: 'number', description: 'kg', nullable: true, example: 65 },
          targetWeight:         { type: 'number', description: 'kg', nullable: true, example: 60 },
          phone:                { type: 'string', nullable: true, example: '+13055551234' },
          activityLevel:        { type: 'string', enum: ['sedentary','lightly_active','moderately_active','very_active','extremely_active'], example: 'moderately_active' },
          fitnessGoal:          { type: 'string', enum: ['weight_loss','muscle_gain','maintenance','strength','endurance','flexibility','general_fitness'], example: 'weight_loss' },
          medicalConditions:    { type: 'array', items: { type: 'string' }, example: [] },
          medications:          { type: 'array', items: { type: 'string' }, example: [] },
          injuries:             { type: 'array', items: { type: 'string' }, example: ['Left knee — meniscus 2023'] },
          allergies:            { type: 'array', items: { type: 'string' }, example: [] },
          dietaryRestrictions:  { type: 'array', items: { type: 'string' }, example: ['Vegetarian'] },
          preferredWorkoutTime: { type: 'string', nullable: true, example: 'morning' },
          gymLocation:          { type: 'string', nullable: true, example: 'Downtown Gym, Miami' },
          timezone:             { type: 'string', nullable: true, example: 'America/New_York' },
          notes:                { type: 'string', nullable: true, example: null },
          createdAt:            { type: 'string', format: 'date-time', example: TS },
          updatedAt:            { type: 'string', format: 'date-time', example: TS },
        },
      },

      ClientOnboardingRequest: {
        type: 'object',
        required: ['fitnessGoal','activityLevel','dateOfBirth','gender','height','weight'],
        properties: {
          fitnessGoal:          { type: 'string', enum: ['weight_loss','muscle_gain','maintenance','strength','endurance','flexibility','general_fitness'], example: 'weight_loss' },
          activityLevel:        { type: 'string', enum: ['sedentary','lightly_active','moderately_active','very_active','extremely_active'], example: 'moderately_active' },
          dateOfBirth:          { type: 'string', format: 'date', example: '1992-07-14' },
          gender:               { type: 'string', enum: ['male','female','other','prefer_not_to_say'], example: 'female' },
          height:               { type: 'number', minimum: 50, maximum: 300, example: 168 },
          weight:               { type: 'number', minimum: 30, maximum: 500, example: 65 },
          targetWeight:         { type: 'number', minimum: 30, maximum: 500, nullable: true, example: 60 },
          medicalConditions:    { type: 'array', items: { type: 'string' }, example: [] },
          injuries:             { type: 'array', items: { type: 'string' }, example: [] },
          medications:          { type: 'array', items: { type: 'string' }, example: [] },
          allergies:            { type: 'array', items: { type: 'string' }, example: [] },
          preferredWorkoutTime: { type: 'string', example: 'morning' },
          gymLocation:          { type: 'string', example: 'Downtown Gym, Miami' },
          timezone:             { type: 'string', example: 'America/New_York' },
          phone:                { type: 'string', example: '+13055551234' },
        },
      },

      // ── Coach profile ──────────────────────────────────────────────────────
      CoachProfile: {
        type: 'object',
        properties: {
          id:                    { type: 'string', format: 'uuid', example: UUID3 },
          userId:                { type: 'string', format: 'uuid', example: UUID },
          // core
          bio:                   { type: 'string', nullable: true, example: '10 years helping clients build sustainable strength. Former D1 athlete.' },
          specialties:           { type: 'array', items: { type: 'string' }, example: ['Weight Loss','Muscle Gain'] },
          certifications:        { type: 'array', items: { type: 'string' }, example: ['NASM-CPT','CSCS'] },
          sessionRateUSD:        { type: 'number', nullable: true, example: 120 },
          acceptingClients:      { type: 'boolean', example: true },
          // identity
          profileHeadline:       { type: 'string', nullable: true, example: 'Strength & Mobility Coach for Busy Professionals' },
          yearsOfExperience:     { type: 'integer', nullable: true, example: 10 },
          coachingType:          { type: 'string', enum: ['online','in_person','hybrid'], nullable: true, example: 'online' },
          trainingModalities:    { type: 'array', items: { type: 'string' }, example: ['Strength Training','Mobility & Flexibility'] },
          targetClientTypes:     { type: 'array', items: { type: 'string' }, example: ['Busy Professionals','Beginners'] },
          languagesSpoken:       { type: 'array', items: { type: 'string' }, example: ['English','Spanish'] },
          // scheduling
          timezone:              { type: 'string', nullable: true, example: 'America/New_York' },
          sessionDurationMinutes:{ type: 'integer', nullable: true, example: 60 },
          maxClientCapacity:     { type: 'integer', nullable: true, example: 20 },
          trialSessionAvailable: { type: 'boolean', example: true },
          trialSessionRateUSD:   { type: 'number', nullable: true, example: 40 },
          // media
          videoIntroUrl:         { type: 'string', format: 'uri', nullable: true, example: 'https://youtube.com/watch?v=abc123' },
          websiteUrl:            { type: 'string', format: 'uri', nullable: true, example: 'https://janedoefitness.com' },
          instagramHandle:       { type: 'string', nullable: true, example: 'janedoe_fitness' },
          // business
          totalClientsTrained:   { type: 'integer', example: 150 },
          activeClientsCount:    { type: 'integer', description: 'Live count of clients linked to this coach', example: 12 },
          createdAt:             { type: 'string', format: 'date-time', example: TS },
          updatedAt:             { type: 'string', format: 'date-time', example: TS },
        },
      },

      CoachOnboardingRequest: {
        type: 'object',
        properties: {
          profileHeadline:       { type: 'string', maxLength: 160, example: 'Strength & Mobility Coach for Busy Professionals' },
          bio:                   { type: 'string', maxLength: 2000, example: '10 years helping clients build sustainable strength.' },
          videoIntroUrl:         { type: 'string', format: 'uri', nullable: true, example: 'https://youtube.com/watch?v=abc123' },
          specialties:           { type: 'array', items: { type: 'string' }, example: ['Weight Loss','Muscle Gain'] },
          trainingModalities:    { type: 'array', items: { type: 'string' }, example: ['Strength Training','HIIT'] },
          targetClientTypes:     { type: 'array', items: { type: 'string' }, example: ['Beginners','Busy Professionals'] },
          yearsOfExperience:     { type: 'integer', minimum: 0, maximum: 60, example: 10 },
          certifications:        { type: 'array', items: { type: 'string' }, example: ['NASM-CPT','CSCS'] },
          coachingType:          { type: 'string', enum: ['online','in_person','hybrid'], example: 'online' },
          languagesSpoken:       { type: 'array', items: { type: 'string' }, example: ['English','Spanish'] },
          instagramHandle:       { type: 'string', example: 'janedoe_fitness' },
          websiteUrl:            { type: 'string', format: 'uri', nullable: true, example: 'https://janedoefitness.com' },
          timezone:              { type: 'string', example: 'America/New_York' },
          sessionDurationMinutes:{ type: 'integer', minimum: 15, maximum: 480, example: 60 },
          maxClientCapacity:     { type: 'integer', minimum: 1, example: 20 },
          acceptingClients:      { type: 'boolean', example: true },
          totalClientsTrained:   { type: 'integer', minimum: 0, example: 150 },
          sessionRateUSD:        { type: 'number', minimum: 0, example: 120 },
          trialSessionAvailable: { type: 'boolean', example: true },
          trialSessionRateUSD:   { type: 'number', minimum: 0, nullable: true, example: 40 },
        },
      },

      // ── Invite ────────────────────────────────────────────────────────────
      Invite: {
        type: 'object',
        properties: {
          id:          { type: 'string', format: 'uuid', example: UUID2 },
          email:       { type: 'string', format: 'email', example: 'newcoach@example.com' },
          token:       { type: 'string', example: INVITE_TOKEN },
          used:        { type: 'boolean', example: false },
          expiresAt:   { type: 'string', format: 'date-time', example: '2026-03-04T12:00:00.000Z' },
          createdAt:   { type: 'string', format: 'date-time', example: TS },
          invitedBy: {
            type: 'object', nullable: true,
            properties: {
              id:        { type: 'string', format: 'uuid', example: UUID },
              email:     { type: 'string', format: 'email', example: 'admin@steadyvitality.com' },
              firstName: { type: 'string', example: 'Admin' },
              lastName:  { type: 'string', example: 'User' },
            },
          },
        },
      },

      // ── Admin stats ───────────────────────────────────────────────────────
      AdminStats: {
        type: 'object',
        properties: {
          users: {
            type: 'object',
            properties: {
              total:       { type: 'integer', example: 142 },
              newThisWeek: { type: 'integer', example: 8 },
              byRole: {
                type: 'object',
                properties: {
                  admin:  { type: 'integer', example: 2 },
                  coach:  { type: 'integer', example: 15 },
                  client: { type: 'integer', example: 125 },
                },
              },
            },
          },
          invites: {
            type: 'object',
            properties: {
              total:    { type: 'integer', example: 20 },
              pending:  { type: 'integer', example: 5 },
              accepted: { type: 'integer', example: 14 },
              expired:  { type: 'integer', example: 1 },
            },
          },
          signupsByDay: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date:  { type: 'string', format: 'date', example: '2026-03-01' },
                count: { type: 'integer', example: 3 },
              },
            },
          },
        },
      },

      // ── Error shapes ──────────────────────────────────────────────────────
      Error: {
        type: 'object',
        properties: {
          error:   { type: 'string', example: 'Unauthorized' },
          message: { type: 'string', example: 'Invalid or expired token' },
        },
      },

      ValidationError: {
        type: 'object',
        properties: {
          error:   { type: 'string', example: 'Validation failed' },
          message: { type: 'string', example: 'Please check your input data' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type:  { type: 'string', example: 'field' },
                path:  { type: 'string', example: 'email' },
                msg:   { type: 'string', example: 'Please provide a valid email address' },
                value: { type: 'string', example: 'not-an-email' },
              },
            },
          },
        },
      },

      PaginationMeta: {
        type: 'object',
        properties: {
          total: { type: 'integer', example: 47 },
          page:  { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
        },
      },

      // ── Package template ──────────────────────────────────────────────────
      Package: {
        type: 'object',
        properties: {
          id:               { type: 'string', format: 'uuid', example: UUID2 },
          coachId:          { type: 'string', format: 'uuid', description: 'CoachProfile.id', example: UUID3 },
          name:             { type: 'string', example: '12-Week Transformation' },
          description:      { type: 'string', nullable: true, example: 'A structured 12-week program combining strength and nutrition.' },
          durationWeeks:    { type: 'integer', minimum: 1, example: 12 },
          sessionsIncluded: { type: 'integer', minimum: 1, example: 24 },
          priceUSD:         { type: 'number', minimum: 0, example: 599 },
          isActive:         { type: 'boolean', example: true },
          features:         { type: 'array', items: { type: 'string' }, nullable: true, example: ['Weekly check-ins', 'Custom meal plan', '24/7 messaging support'] },
          createdAt:        { type: 'string', format: 'date-time', example: TS },
          updatedAt:        { type: 'string', format: 'date-time', example: TS },
        },
      },

      // ── Client package assignment ─────────────────────────────────────────
      ClientPackage: {
        type: 'object',
        properties: {
          id:                { type: 'string', format: 'uuid', example: UUID },
          packageId:         { type: 'string', format: 'uuid', example: UUID2 },
          clientId:          { type: 'string', format: 'uuid', example: UUID3 },
          status:            { type: 'string', enum: ['pending', 'active', 'completed', 'cancelled'], example: 'active' },
          startDate:         { type: 'string', format: 'date-time', nullable: true, example: TS },
          endDate:           { type: 'string', format: 'date-time', nullable: true, description: 'Computed: startDate + durationWeeks × 7 days', example: '2026-06-01T12:00:00.000Z' },
          sessionsCompleted: { type: 'integer', minimum: 0, example: 8 },
          notes:             { type: 'string', nullable: true, example: 'Client prefers morning sessions' },
          goals:             { type: 'array', items: { type: 'string' }, example: ['Lose 10 kg', 'Run a 5K'] },
          package: {
            nullable: true,
            type: 'object',
            properties: {
              id:               { type: 'string', format: 'uuid', example: UUID2 },
              name:             { type: 'string', example: '12-Week Transformation' },
              description:      { type: 'string', nullable: true, example: null },
              durationWeeks:    { type: 'integer', example: 12 },
              sessionsIncluded: { type: 'integer', example: 24 },
              priceUSD:         { type: 'number', example: 599 },
              features:         { type: 'array', items: { type: 'string' }, example: ['Weekly check-ins'] },
            },
          },
        },
      },

      // ── Connection request ────────────────────────────────────────────────
      ConnectionRequest: {
        type: 'object',
        properties: {
          id:        { type: 'string', format: 'uuid', example: UUID },
          clientId:  { type: 'string', format: 'uuid', example: UUID2 },
          coachId:   { type: 'string', format: 'uuid', description: 'Coach User.id', example: UUID3 },
          status:    { type: 'string', enum: ['pending', 'accepted', 'declined'], example: 'pending' },
          createdAt: { type: 'string', format: 'date-time', example: TS },
          updatedAt: { type: 'string', format: 'date-time', example: TS },
          client: {
            nullable: true,
            type: 'object',
            properties: {
              id:        { type: 'string', format: 'uuid', example: UUID2 },
              firstName: { type: 'string', example: 'Sam' },
              lastName:  { type: 'string', example: 'Lee' },
              email:     { type: 'string', format: 'email', example: 'sam@example.com' },
            },
          },
        },
      },
    },

    // ── Reusable responses ─────────────────────────────────────────────────
    responses: {
      Unauthorized: {
        description: 'Missing or invalid JWT',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Unauthorized', message: 'Invalid or expired token' } } },
      },
      Forbidden: {
        description: 'Authenticated but insufficient role',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Forbidden', message: 'Insufficient permissions' } } },
      },
      NotFound: {
        description: 'Resource not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Not Found', message: 'Resource not found' } } },
      },
      ValidationFailed: {
        description: 'Request body failed validation',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } },
      },
      InternalError: {
        description: 'Unexpected server error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Internal Server Error', message: 'Something went wrong' } } },
      },
    },
  },

  security: [{ bearerAuth: [] }],

  // ──────────────────────────────────────────────────────────────────────────
  // PATHS
  // ──────────────────────────────────────────────────────────────────────────
  paths: {

    // ═══════════════════════════════════════════════════════════════════════
    // AUTH
    // ═══════════════════════════════════════════════════════════════════════

    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new client account',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email','username','password','firstName','lastName'],
                properties: {
                  email:     { type: 'string', format: 'email', example: 'jane@example.com' },
                  username:  { type: 'string', minLength: 3, maxLength: 30, example: 'jane_doe' },
                  password:  { type: 'string', minLength: 8, example: 'Str0ng!Pass' },
                  firstName: { type: 'string', example: 'Jane' },
                  lastName:  { type: 'string', example: 'Doe' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Account created. Email verification link sent.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' }, example: { success: true, message: 'Registration successful. Please check your email to verify your account.', user: { id: UUID, email: 'jane@example.com', username: 'jane_doe', firstName: 'Jane', lastName: 'Doe', role: 'client', isEmailVerified: false, hasCompletedOnboarding: false }, tokens: { accessToken: TOKEN, refreshToken: REFRESH, expiresIn: 3600 } } } },
          },
          400: { $ref: '#/components/responses/ValidationFailed' },
          409: { description: 'Email or username already taken', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Conflict', message: 'An account with this email already exists' } } } },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login — works for all roles (client, coach, admin)',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email','password'],
                properties: {
                  email:      { type: 'string', format: 'email', example: 'admin@steadyvitality.com' },
                  password:   { type: 'string', example: 'Str0ng!Pass' },
                  rememberMe: { type: 'boolean', default: false, description: 'Extends token lifetime to 7 days', example: true },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful — JWT payload includes `role`',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
                examples: {
                  admin: { summary: 'Admin login', value: { success: true, message: 'Login successful', user: { id: UUID, email: 'admin@steadyvitality.com', role: 'admin', hasCompletedOnboarding: true }, tokens: { accessToken: TOKEN, refreshToken: REFRESH, expiresIn: 3600 } } },
                  coach: { summary: 'Coach login', value: { success: true, message: 'Login successful', user: { id: UUID, email: 'coach@example.com', role: 'coach', hasCompletedOnboarding: false }, tokens: { accessToken: TOKEN, refreshToken: REFRESH, expiresIn: 3600 } } },
                  client:{ summary: 'Client login', value: { success: true, message: 'Login successful', user: { id: UUID, email: 'client@example.com', role: 'client', hasCompletedOnboarding: true }, tokens: { accessToken: TOKEN, refreshToken: REFRESH, expiresIn: 3600 } } },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/ValidationFailed' },
          401: { description: 'Wrong credentials or inactive account', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { success: false, message: 'Invalid email or password' } } } },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout current session',
        responses: {
          200: { description: 'Session revoked', content: { 'application/json': { example: { success: true, message: 'Logged out successfully' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/auth/logout-all': {
      post: {
        tags: ['Auth'],
        summary: 'Logout all sessions for current user',
        responses: {
          200: { description: 'All sessions revoked', content: { 'application/json': { example: { success: true, message: 'All sessions logged out' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: { refreshToken: { type: 'string', example: REFRESH } },
              },
            },
          },
        },
        responses: {
          200: { description: 'New access token issued', content: { 'application/json': { example: { success: true, message: 'Token refreshed successfully', tokens: { accessToken: TOKEN, refreshToken: REFRESH, expiresIn: 3600 } } } } },
          400: { $ref: '#/components/responses/ValidationFailed' },
          401: { description: 'Refresh token invalid or expired', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { success: false, message: 'Invalid or expired refresh token' } } } },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get the authenticated user (from JWT)',
        responses: {
          200: {
            description: 'Current user — password and sensitive tokens stripped',
            content: {
              'application/json': {
                example: {
                  success: true,
                  user: { id: UUID, email: 'coach@example.com', username: 'coach_jane', firstName: 'Jane', lastName: 'Doe', role: 'coach', isEmailVerified: true, hasCompletedOnboarding: false, lastLoginAt: TS, createdAt: TS },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
      patch: {
        tags: ['Auth'],
        summary: 'Update basic account fields (firstName, lastName, username, avatar)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  firstName: { type: 'string', example: 'Jane' },
                  lastName:  { type: 'string', example: 'Smith' },
                  username:  { type: 'string', example: 'janesmith_fit' },
                  avatar:    { type: 'string', format: 'uri', example: 'https://cdn.example.com/avatar.jpg' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Profile updated', content: { 'application/json': { example: { success: true, message: 'Profile updated successfully', user: { id: UUID, firstName: 'Jane', lastName: 'Smith', username: 'janesmith_fit' } } } } },
          400: { $ref: '#/components/responses/ValidationFailed' },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/auth/sessions': {
      get: {
        tags: ['Auth'],
        summary: 'List active sessions for the authenticated user',
        responses: {
          200: {
            description: 'Active session list',
            content: {
              'application/json': {
                example: {
                  success: true,
                  sessions: [
                    { id: UUID2, deviceType: 'desktop', browser: 'Chrome', os: 'macOS', country: 'US', city: 'Miami', ipAddress: '72.1.2.3', lastAccessedAt: TS, createdAt: TS, expiresAt: '2026-04-01T12:00:00.000Z', isActive: true },
                  ],
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/auth/change-password': {
      post: {
        tags: ['Auth'],
        summary: 'Change password (requires current password)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword','newPassword'],
                properties: {
                  currentPassword: { type: 'string', example: 'OldStr0ng!Pass' },
                  newPassword:     { type: 'string', minLength: 8, example: 'NewStr0ng!Pass' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password changed', content: { 'application/json': { example: { success: true, message: 'Password changed successfully' } } } },
          400: { description: 'Wrong current password or validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request a password-reset email',
        description: 'Always returns 200 to prevent email enumeration.',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email', example: 'jane@example.com' } } } } },
        },
        responses: {
          200: { description: 'Reset email sent (or silently skipped if account not found)', content: { 'application/json': { example: { success: true, message: 'If an account with that email exists, a reset link has been sent.' } } } },
          400: { $ref: '#/components/responses/ValidationFailed' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Set a new password using a reset token',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['token','newPassword'], properties: { token: { type: 'string', example: 'reset-token-from-email' }, newPassword: { type: 'string', minLength: 8, example: 'NewStr0ng!Pass' } } } } },
        },
        responses: {
          200: { description: 'Password reset successful', content: { 'application/json': { example: { success: true, message: 'Password has been reset successfully' } } } },
          400: { description: 'Token invalid, expired, or weak password', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/auth/verify-email': {
      post: {
        tags: ['Auth'],
        summary: 'Verify email address using the token from the verification email',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['token'], properties: { token: { type: 'string', example: 'email-verification-token' } } } } },
        },
        responses: {
          200: { description: 'Email verified', content: { 'application/json': { example: { success: true, message: 'Email verified successfully' } } } },
          400: { description: 'Token invalid or expired', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/auth/status': {
      get: {
        tags: ['Auth'],
        summary: 'Quick check — is the Authorization header present?',
        security: [],
        responses: {
          200: {
            description: 'Status check result',
            content: {
              'application/json': {
                examples: {
                  authenticated:   { value: { isAuthenticated: true, message: 'Use /me endpoint for detailed user information' } },
                  unauthenticated: { value: { isAuthenticated: false, user: null } },
                },
              },
            },
          },
        },
      },
    },

    // ── Coach registration flow ──────────────────────────────────────────────

    '/api/auth/coach/setup/{token}': {
      get: {
        tags: ['Auth'],
        summary: 'Validate a coach invite token (pre-fill the registration form)',
        description: 'Call this before showing the coach registration form. Returns the locked email from the invite so the frontend can pre-fill and disable the email field.',
        security: [],
        parameters: [
          { name: 'token', in: 'path', required: true, schema: { type: 'string', example: INVITE_TOKEN } },
        ],
        responses: {
          200: { description: 'Token valid', content: { 'application/json': { example: { valid: true, email: 'newcoach@example.com' } } } },
          400: { description: 'Token invalid, expired, or already used', content: { 'application/json': { example: { valid: false, message: 'This invite has expired. Ask an admin for a new one' } } } },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/auth/coach/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a coach account using an invite token',
        description: 'Email is locked to the invite — it cannot be changed. The invite is marked used after successful registration.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token','firstName','lastName','password','confirmPassword'],
                properties: {
                  token:           { type: 'string', example: INVITE_TOKEN },
                  firstName:       { type: 'string', example: 'Jane' },
                  lastName:        { type: 'string', example: 'Doe' },
                  password:        { type: 'string', minLength: 8, example: 'Str0ng!Pass' },
                  confirmPassword: { type: 'string', example: 'Str0ng!Pass' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Coach account created. `hasCompletedOnboarding` will be `false` — redirect to `/coach/onboarding`.',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Coach account created successfully.',
                  user: { id: UUID, email: 'newcoach@example.com', role: 'coach', hasCompletedOnboarding: false },
                  tokens: { accessToken: TOKEN, refreshToken: REFRESH, expiresIn: 3600 },
                },
              },
            },
          },
          400: { description: 'Passwords don\'t match, invalid token, or validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          409: { description: 'Email already registered', content: { 'application/json': { example: { error: 'Registration failed', message: 'An account with this email already exists' } } } },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/auth/coach/onboarding': {
      post: {
        tags: ['Auth'],
        summary: 'Complete coach profile onboarding',
        description: `Upserts the \`CoachProfile\` record and sets \`hasCompletedOnboarding = true\` on the user in a single transaction.

**All fields are optional** — send whatever the wizard collected.

On success, read \`user.hasCompletedOnboarding\` from the response and update your auth state — that flag is what gates the redirect away from the wizard.`,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CoachOnboardingRequest' },
              example: {
                profileHeadline: 'Strength & Mobility Coach for Busy Professionals',
                bio: '10 years helping clients build sustainable strength.',
                videoIntroUrl: 'https://youtube.com/watch?v=abc123',
                specialties: ['Weight Loss', 'Muscle Gain'],
                trainingModalities: ['Strength Training', 'HIIT'],
                targetClientTypes: ['Beginners', 'Busy Professionals'],
                yearsOfExperience: 10,
                certifications: ['NASM-CPT', 'CSCS'],
                coachingType: 'online',
                languagesSpoken: ['English', 'Spanish'],
                instagramHandle: 'janedoe_fitness',
                websiteUrl: 'https://janedoefitness.com',
                timezone: 'America/New_York',
                sessionDurationMinutes: 60,
                maxClientCapacity: 20,
                acceptingClients: true,
                totalClientsTrained: 150,
                sessionRateUSD: 120,
                trialSessionAvailable: true,
                trialSessionRateUSD: 40,
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Onboarding saved and `hasCompletedOnboarding` flipped to `true`',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Onboarding complete!',
                  user: { id: UUID, email: 'coach@example.com', role: 'coach', hasCompletedOnboarding: true },
                  profile: { id: UUID3, userId: UUID, profileHeadline: 'Strength & Mobility Coach for Busy Professionals', coachingType: 'online', acceptingClients: true, totalClientsTrained: 150 },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/ValidationFailed' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { description: 'User is not a coach or admin', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Forbidden', message: 'Insufficient permissions' } } } },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // USERS
    // ═══════════════════════════════════════════════════════════════════════

    '/api/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Get current user with full client profile',
        responses: {
          200: { description: 'User + profile', content: { 'application/json': { example: { success: true, user: { id: UUID, email: 'client@example.com', role: 'client', profile: { fitnessGoal: 'weight_loss', activityLevel: 'moderately_active', height: 168, weight: 65 } } } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update account basics (name, avatar)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { firstName: { type: 'string', example: 'Jane' }, lastName: { type: 'string', example: 'Smith' }, avatar: { type: 'string', format: 'uri' } } } } },
        },
        responses: {
          200: { description: 'Updated', content: { 'application/json': { example: { success: true, message: 'User updated successfully' } } } },
          400: { $ref: '#/components/responses/ValidationFailed' },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Soft-delete account (sets isActive = false)',
        responses: {
          200: { description: 'Account deactivated', content: { 'application/json': { example: { success: true, message: 'Account deactivated successfully' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/users/me/profile': {
      get: {
        tags: ['Users'],
        summary: 'Get client health & fitness profile',
        responses: {
          200: { description: 'Profile', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserProfile' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Partial update of client health & fitness profile',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ClientOnboardingRequest' } } } },
        responses: {
          200: { description: 'Profile updated', content: { 'application/json': { example: { success: true, message: 'Profile updated', profile: { fitnessGoal: 'weight_loss', weight: 63 } } } } },
          400: { $ref: '#/components/responses/ValidationFailed' },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/users/me/onboarding': {
      get: {
        tags: ['Users'],
        summary: 'Check if the current user has completed onboarding',
        responses: {
          200: { description: 'Onboarding status', content: { 'application/json': { example: { success: true, hasCompletedOnboarding: false } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Users'],
        summary: 'Complete client onboarding — upserts profile and flips `hasCompletedOnboarding`',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ClientOnboardingRequest' }, example: { fitnessGoal: 'weight_loss', activityLevel: 'moderately_active', dateOfBirth: '1992-07-14', gender: 'female', height: 168, weight: 65, targetWeight: 60, timezone: 'America/New_York', phone: '+13055551234' } } } },
        responses: {
          200: { description: 'Onboarding complete', content: { 'application/json': { example: { success: true, message: 'Onboarding completed successfully', user: { id: UUID, hasCompletedOnboarding: true }, profile: { fitnessGoal: 'weight_loss', height: 168, weight: 65 } } } } },
          400: { $ref: '#/components/responses/ValidationFailed' },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Same as POST — re-submit to update individual fields after onboarding',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ClientOnboardingRequest' } } } },
        responses: {
          200: { description: 'Updated', content: { 'application/json': { example: { success: true, message: 'Onboarding completed successfully' } } } },
          400: { $ref: '#/components/responses/ValidationFailed' },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/users/me/password': {
      patch: {
        tags: ['Users'],
        summary: 'Change password',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['currentPassword','newPassword'], properties: { currentPassword: { type: 'string', example: 'OldStr0ng!Pass' }, newPassword: { type: 'string', example: 'NewStr0ng!Pass' } } } } },
        },
        responses: {
          200: { description: 'Password changed', content: { 'application/json': { example: { success: true, message: 'Password changed successfully' } } } },
          400: { description: 'Wrong current password', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/users/me/avatar': {
      patch: {
        tags: ['Users'],
        summary: 'Upload or replace profile avatar',
        description: 'Accepts `multipart/form-data` with a single file under the `file` field. Allowed types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`. Max size: 5 MB. If the user already has a local avatar it is deleted from disk before the new one is saved. The stored URL is returned and also persisted to `users.avatar`.',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary', description: 'Image file (jpeg / png / webp / gif, max 5 MB)' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Avatar saved', content: { 'application/json': { example: { url: 'http://localhost:3001/uploads/avatars/550e8400-e29b-41d4-a716-446655440000.jpg', message: 'Avatar updated' } } } },
          400: { description: 'No file, wrong type, or file too large', content: { 'application/json': { example: { message: 'File too large. Maximum size is 5 MB.' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Remove profile avatar',
        description: 'Deletes the local avatar file from disk (if present) and sets `users.avatar` to `null`.',
        responses: {
          200: { description: 'Avatar removed', content: { 'application/json': { example: { message: 'Avatar removed' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // COACHES
    // ═══════════════════════════════════════════════════════════════════════

    '/api/coaches': {
      get: {
        tags: ['Coaches'],
        summary: 'Browse coaches accepting new clients (public)',
        security: [],
        parameters: [
          { name: 'page',  in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
        ],
        responses: {
          200: {
            description: 'Paginated coach list',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: [{ id: UUID, coachProfileId: UUID3, firstName: 'Jane', lastName: 'Doe', profileHeadline: 'Strength Coach', coachingType: 'online', acceptingClients: true, sessionRateUSD: 120, yearsOfExperience: 10, totalClientsTrained: 150, activeClientsCount: 12 }],
                  total: 1, page: 1, limit: 20,
                },
              },
            },
          },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/coaches/me': {
      get: {
        tags: ['Coaches'],
        summary: 'Get own coach profile (full detail)',
        responses: {
          200: { description: 'Coach profile', content: { 'application/json': { schema: { $ref: '#/components/schemas/CoachProfile' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { description: 'Profile not yet created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
      post: {
        tags: ['Coaches'],
        summary: 'Create coach profile (first time)',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CoachOnboardingRequest' } } } },
        responses: {
          201: { description: 'Profile created', content: { 'application/json': { example: { success: true, message: 'Coach profile created successfully', data: { id: UUID3 } } } } },
          400: { description: 'Profile already exists or validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
      patch: {
        tags: ['Coaches'],
        summary: 'Update coach profile fields (partial)',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CoachOnboardingRequest' } } } },
        responses: {
          200: { description: 'Profile updated', content: { 'application/json': { example: { success: true, message: 'Coach profile updated successfully' } } } },
          400: { $ref: '#/components/responses/ValidationFailed' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/coaches/me/clients': {
      get: {
        tags: ['Coaches'],
        summary: 'List clients linked to this coach (via users.coachId)',
        parameters: [
          { name: 'page',  in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
        ],
        responses: {
          200: {
            description: 'Paginated linked client list',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: [{
                    id: UUID, firstName: 'Sam', lastName: 'Lee', email: 'sam@example.com',
                    profile: { fitnessGoal: 'weight_loss', activityLevel: 'moderately_active', height: 175, weight: 80, timezone: 'America/New_York' },
                  }],
                  total: 1, page: 1, limit: 20,
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/coaches/me/clients/{clientId}': {
      get: {
        tags: ['Coaches'],
        summary: 'Get a single linked client\'s full profile',
        description: 'The client must have `users.coachId = authenticated coach user ID`.',
        parameters: [
          { name: 'clientId', in: 'path', required: true, description: 'Client user UUID', schema: { type: 'string', format: 'uuid', example: UUID2 } },
        ],
        responses: {
          200: {
            description: 'Full client profile',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    id: UUID2, firstName: 'Sam', lastName: 'Lee', email: 'sam@example.com',
                    profile: {
                      fitnessGoal: 'weight_loss', activityLevel: 'moderately_active',
                      height: 175, weight: 80, targetWeight: 70,
                      medications: [], preferredWorkoutTime: 'morning',
                      gymLocation: 'Downtown Gym', timezone: 'America/New_York', phone: '+13055551234',
                    },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/coaches/me/stats': {
      get: {
        tags: ['Coaches'],
        summary: 'Coach stats (alias for dashboard)',
        responses: {
          200: { description: 'Coach stats', content: { 'application/json': { example: { success: true, data: { totalClients: 18, pendingRequests: 2, activePackagesCount: 14 } } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/coaches/me/linked-clients': {
      get: {
        tags: ['Coaches'],
        summary: 'Alias for GET /api/coaches/me/clients',
        parameters: [
          { name: 'page',  in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
        ],
        responses: {
          200: { description: 'Paginated linked client list', content: { 'application/json': { example: { success: true, data: [], total: 0, page: 1, limit: 20 } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/coaches/connection-requests': {
      post: {
        tags: ['Coaches'],
        summary: 'Client sends a connection request to a coach',
        description: 'Creates a `pending` `ConnectionRequest`. A client can only have one coach — if `users.coachId` is already set, the request is rejected with 409.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['coachId'],
                properties: {
                  coachId: { type: 'string', format: 'uuid', description: 'Coach User.id', example: UUID },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Request sent', content: { 'application/json': { example: { success: true, message: 'Connection request sent', data: { id: UUID2, clientId: UUID3, coachId: UUID, status: 'pending', createdAt: TS } } } } },
          409: { description: 'Already connected or request already exists', content: { 'application/json': { example: { success: false, message: "You're already connected to a coach" } } } },
          400: { $ref: '#/components/responses/ValidationFailed' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/coaches/me/connection-requests': {
      get: {
        tags: ['Coaches'],
        summary: 'Coach gets their pending connection requests',
        responses: {
          200: {
            description: 'List of pending requests',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: [{
                    id: UUID2, clientId: UUID3, coachId: UUID, status: 'pending', createdAt: TS,
                    client: { id: UUID3, firstName: 'Sam', lastName: 'Lee', email: 'sam@example.com' },
                  }],
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/coaches/me/connection-requests/{requestId}': {
      patch: {
        tags: ['Coaches'],
        summary: 'Coach accepts or declines a connection request',
        description: 'Accepting sets `users.coachId` on the client and removes the `ConnectionRequest` row. Declining removes the row.',
        parameters: [
          { name: 'requestId', in: 'path', required: true, schema: { type: 'string', format: 'uuid', example: UUID2 } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['action'],
                properties: {
                  action: { type: 'string', enum: ['accept', 'decline'], example: 'accept' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Request actioned', content: { 'application/json': { example: { success: true, message: 'Connection request accepted' } } } },
          400: { $ref: '#/components/responses/ValidationFailed' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/coaches/me/dashboard': {
      get: {
        tags: ['Coaches'],
        summary: 'Coach dashboard — aggregate stats',
        responses: {
          200: { description: 'Dashboard stats', content: { 'application/json': { example: { success: true, data: { totalClients: 18, pendingRequests: 2, activePackagesCount: 14 } } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/coaches/{id}': {
      get: {
        tags: ['Coaches'],
        summary: 'Get a coach\'s public profile by user ID',
        security: [],
        parameters: [
          { name: 'id', in: 'path', required: true, description: 'Coach user UUID', schema: { type: 'string', format: 'uuid', example: UUID } },
        ],
        responses: {
          200: { description: 'Coach public profile', content: { 'application/json': { schema: { $ref: '#/components/schemas/CoachProfile' } } } },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // INVITES
    // ═══════════════════════════════════════════════════════════════════════

    '/api/invites': {
      post: {
        tags: ['Invites'],
        summary: 'Create a coach invite (admin only)',
        description: 'Sends an invite to the given email. The invite token is valid for 72 hours. If a previous invite for the same email has expired, it is replaced automatically.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email', example: 'newcoach@example.com' } } } } },
        },
        responses: {
          201: { description: 'Invite created', content: { 'application/json': { example: { success: true, message: 'Invite created successfully', data: { id: UUID2, email: 'newcoach@example.com', expiresAt: '2026-04-01T12:00:00.000Z' } } } } },
          400: { description: 'Active invite already exists for this email, or already accepted', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
      get: {
        tags: ['Invites'],
        summary: 'List all invites, paginated (admin only)',
        parameters: [
          { name: 'page',  in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
        ],
        responses: {
          200: {
            description: 'Paginated invite list',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: [{ id: UUID2, email: 'newcoach@example.com', used: false, expiresAt: '2026-04-01T12:00:00.000Z', createdAt: TS, invitedBy: { id: UUID, email: 'admin@steadyvitality.com', firstName: 'Admin', lastName: 'User' } }],
                  total: 1, page: 1, limit: 20,
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/invites/validate/{token}': {
      get: {
        tags: ['Invites'],
        summary: 'Validate an invite token (public — used on the coach registration page)',
        security: [],
        parameters: [
          { name: 'token', in: 'path', required: true, schema: { type: 'string', example: INVITE_TOKEN } },
        ],
        responses: {
          200: { description: 'Token is valid', content: { 'application/json': { example: { success: true, data: { id: UUID2, email: 'newcoach@example.com', expiresAt: '2026-04-01T12:00:00.000Z' } } } } },
          400: { description: 'Token invalid, expired, or used', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, examples: { expired: { value: { success: false, message: 'This invite has expired. Ask an admin for a new one' } }, used: { value: { success: false, message: 'This invite has already been used' } }, invalid: { value: { success: false, message: 'Invalid invite token' } } } } } },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/invites/client': {
      post: {
        tags: ['Invites'],
        summary: 'Coach creates a client invite link',
        description: 'Sends an invite email to the given address. The generated link leads to the client registration page pre-linked to the coach.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email', example: 'newclient@example.com' } } } } },
        },
        responses: {
          201: { description: 'Invite created and email sent', content: { 'application/json': { example: { success: true, message: 'Client invite created', token: INVITE_TOKEN, inviteUrl: 'http://localhost:3000/en/invite/client/a3f9b2c1…' } } } },
          409: { description: 'Email already registered or pending invite exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          400: { $ref: '#/components/responses/ValidationFailed' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/invites/validate/client/{token}': {
      get: {
        tags: ['Invites'],
        summary: 'Validate a coach-issued client invite token (public)',
        security: [],
        parameters: [
          { name: 'token', in: 'path', required: true, schema: { type: 'string', example: INVITE_TOKEN } },
        ],
        responses: {
          200: { description: 'Token valid', content: { 'application/json': { example: { valid: true, invite: { id: UUID2, email: 'newclient@example.com', coachName: 'Jane Doe' } } } } },
          404: { description: 'Token invalid or expired', content: { 'application/json': { example: { valid: false, message: 'Invalid or expired invite token' } } } },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/invites/accept/client': {
      post: {
        tags: ['Invites'],
        summary: 'Accept a client invite and create an account (public)',
        description: 'Client submits the registration form from the invite link. The `token` from the invite URL must be included. On success the account is linked to the inviting coach (`users.coachId`).',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'firstName', 'lastName', 'password'],
                properties: {
                  token:     { type: 'string', example: INVITE_TOKEN },
                  firstName: { type: 'string', maxLength: 50, example: 'Sam' },
                  lastName:  { type: 'string', maxLength: 50, example: 'Lee' },
                  password:  { type: 'string', minLength: 8, description: 'Must contain uppercase, lowercase, digit, and special character', example: 'Str0ng!Pass' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Account created and tokens issued', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' }, example: { success: true, message: 'Account created successfully', user: { id: UUID2, email: 'newclient@example.com', firstName: 'Sam', lastName: 'Lee', role: 'client' }, tokens: { accessToken: TOKEN, refreshToken: REFRESH, expiresIn: 3600 } } } } },
          400: { description: 'Invalid token or password requirements not met', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          409: { description: 'Email already registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/invites/{id}': {
      delete: {
        tags: ['Invites'],
        summary: 'Revoke a pending invite (admin only)',
        description: 'Hard-deletes the invite so the email address can be re-invited immediately. Fails if the invite has already been accepted — use `/permanent` to bypass that guard.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid', example: UUID2 } },
        ],
        responses: {
          200: { description: 'Invite revoked', content: { 'application/json': { example: { success: true, message: 'Invite revoked' } } } },
          400: { description: 'Invite already accepted — cannot revoke', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { success: false, message: 'Cannot revoke an invite that has already been accepted' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/invites/{id}/permanent': {
      delete: {
        tags: ['Invites'],
        summary: 'Permanently delete any invite (admin only)',
        description: 'Hard-deletes the invite record regardless of status (pending, used, or expired). Use when you need to fully purge a record — for example, to re-invite an email that already accepted.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid', example: UUID2 } },
        ],
        responses: {
          200: { description: 'Invite deleted', content: { 'application/json': { example: { success: true, message: 'Invite deleted' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // PACKAGES
    // ═══════════════════════════════════════════════════════════════════════

    '/api/packages': {
      post: {
        tags: ['Packages'],
        summary: 'Coach creates a package template',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'durationWeeks', 'sessionsIncluded', 'priceUSD'],
                properties: {
                  name:             { type: 'string', maxLength: 255, example: '12-Week Transformation' },
                  description:      { type: 'string', example: 'A structured 12-week program.' },
                  durationWeeks:    { type: 'integer', minimum: 1, example: 12 },
                  sessionsIncluded: { type: 'integer', minimum: 1, example: 24 },
                  priceUSD:         { type: 'number', minimum: 0, example: 599 },
                  features:         { type: 'array', items: { type: 'string' }, example: ['Weekly check-ins', 'Custom meal plan'] },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Package created', content: { 'application/json': { example: { success: true, message: 'Package created successfully', data: { id: UUID2, name: '12-Week Transformation', durationWeeks: 12, sessionsIncluded: 24, priceUSD: 599, isActive: true } } } } },
          400: { $ref: '#/components/responses/ValidationFailed' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/packages/me/active': {
      get: {
        tags: ['Packages'],
        summary: 'Client gets their currently active package',
        responses: {
          200: {
            description: 'Active client package',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ClientPackage' },
                example: {
                  success: true,
                  clientPackage: {
                    id: UUID, packageId: UUID2, clientId: UUID3, status: 'active',
                    startDate: TS, endDate: '2026-06-01T12:00:00.000Z',
                    sessionsCompleted: 8, notes: 'Going well', goals: ['Lose 10 kg'],
                    package: { id: UUID2, name: '12-Week Transformation', durationWeeks: 12, sessionsIncluded: 24, priceUSD: 599, features: [] },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { description: 'No active package', content: { 'application/json': { example: { success: false, message: 'No active package found' } } } },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/packages/coach/{coachId}': {
      get: {
        tags: ['Packages'],
        summary: 'List active packages for a coach (public)',
        security: [],
        parameters: [
          { name: 'coachId', in: 'path', required: true, description: 'Coach user UUID', schema: { type: 'string', format: 'uuid', example: UUID } },
        ],
        responses: {
          200: { description: 'Active package list', content: { 'application/json': { example: { success: true, data: [{ id: UUID2, name: '12-Week Transformation', durationWeeks: 12, sessionsIncluded: 24, priceUSD: 599, isActive: true, features: ['Weekly check-ins'] }] } } } },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/packages/client/{clientId}': {
      get: {
        tags: ['Packages'],
        summary: 'Coach gets the most recent package for one of their clients',
        parameters: [
          { name: 'clientId', in: 'path', required: true, schema: { type: 'string', format: 'uuid', example: UUID2 } },
        ],
        responses: {
          200: { description: 'Client package', content: { 'application/json': { schema: { $ref: '#/components/schemas/ClientPackage' }, example: { success: true, clientPackage: { id: UUID, status: 'active', sessionsCompleted: 4 } } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/packages/client/{id}/status': {
      patch: {
        tags: ['Packages'],
        summary: 'Coach updates a client package status',
        description: 'Transitions the assignment through `pending → active → completed / cancelled`. Setting `completed` or `cancelled` stamps `endDate`.',
        parameters: [
          { name: 'id', in: 'path', required: true, description: 'ClientPackage UUID', schema: { type: 'string', format: 'uuid', example: UUID } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['pending', 'active', 'completed', 'cancelled'], example: 'active' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Status updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/ClientPackage' }, example: { success: true, message: 'Package status updated successfully', data: { id: UUID, status: 'active' } } } } },
          400: { $ref: '#/components/responses/ValidationFailed' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/packages/client/{id}': {
      patch: {
        tags: ['Packages'],
        summary: 'Coach updates notes, goals, or sessionsCompleted on an assignment',
        parameters: [
          { name: 'id', in: 'path', required: true, description: 'ClientPackage UUID', schema: { type: 'string', format: 'uuid', example: UUID } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  notes:             { type: 'string', nullable: true, example: 'Client is making great progress.' },
                  goals:             { type: 'array', items: { type: 'string' }, nullable: true, example: ['Lose 10 kg', 'Run a 5K'] },
                  sessionsCompleted: { type: 'integer', minimum: 0, example: 10 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Assignment updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/ClientPackage' }, example: { success: true, message: 'Client package updated successfully', clientPackage: { id: UUID, sessionsCompleted: 10, notes: 'Client is making great progress.' } } } } },
          400: { $ref: '#/components/responses/ValidationFailed' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/packages/{packageId}/request': {
      post: {
        tags: ['Packages'],
        summary: 'Client requests a package from their coach',
        description: 'Creates a `ClientPackage` with `status = pending`. The client must already be linked to the package\'s coach via `users.coachId`. The coach then activates it via `PATCH /api/packages/client/:id/status`.',
        parameters: [
          { name: 'packageId', in: 'path', required: true, schema: { type: 'string', format: 'uuid', example: UUID2 } },
        ],
        responses: {
          201: { description: 'Package requested', content: { 'application/json': { example: { message: 'Package requested successfully', clientPackage: { id: UUID, packageId: UUID2, clientId: UUID3, status: 'pending', startDate: null } } } } },
          400: { description: 'Already has active or pending package', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Not connected to this coach or no coach linked', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { description: 'Package not found or inactive', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/packages/{id}': {
      patch: {
        tags: ['Packages'],
        summary: 'Coach updates their own package template',
        parameters: [
          { name: 'id', in: 'path', required: true, description: 'Package UUID', schema: { type: 'string', format: 'uuid', example: UUID2 } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name:             { type: 'string', maxLength: 255, example: '12-Week Transformation v2' },
                  description:      { type: 'string', example: 'Updated description.' },
                  durationWeeks:    { type: 'integer', minimum: 1, example: 12 },
                  sessionsIncluded: { type: 'integer', minimum: 1, example: 24 },
                  priceUSD:         { type: 'number', minimum: 0, example: 649 },
                  isActive:         { type: 'boolean', example: true },
                  features:         { type: 'array', items: { type: 'string' }, example: ['Weekly check-ins', 'Custom meal plan'] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Package updated', content: { 'application/json': { example: { success: true, message: 'Package updated successfully', data: { id: UUID2, name: '12-Week Transformation v2' } } } } },
          400: { $ref: '#/components/responses/ValidationFailed' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
      delete: {
        tags: ['Packages'],
        summary: 'Coach soft-deletes (deactivates) a package template',
        parameters: [
          { name: 'id', in: 'path', required: true, description: 'Package UUID', schema: { type: 'string', format: 'uuid', example: UUID2 } },
        ],
        responses: {
          200: { description: 'Package deactivated', content: { 'application/json': { example: { success: true, message: 'Package deactivated successfully' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/packages/{id}/assign': {
      post: {
        tags: ['Packages'],
        summary: 'Coach directly assigns a package to a client',
        description: 'Creates a `ClientPackage` with `status = active` immediately (no pending step). The client must be an active user.',
        parameters: [
          { name: 'id', in: 'path', required: true, description: 'Package UUID', schema: { type: 'string', format: 'uuid', example: UUID2 } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['clientId'],
                properties: {
                  clientId:  { type: 'string', format: 'uuid', example: UUID3 },
                  startDate: { type: 'string', format: 'date-time', example: TS },
                  notes:     { type: 'string', nullable: true, example: 'Focus on strength.' },
                  goals:     { type: 'array', items: { type: 'string' }, example: ['Build muscle', 'Improve posture'] },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Package assigned', content: { 'application/json': { schema: { $ref: '#/components/schemas/ClientPackage' }, example: { success: true, message: 'Package assigned successfully', data: { id: UUID, status: 'active', startDate: TS } } } } },
          400: { description: 'Client already has an active assignment for this package', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // ADMIN
    // ═══════════════════════════════════════════════════════════════════════

    '/api/admin/stats': {
      get: {
        tags: ['Admin'],
        summary: 'Platform stats — user counts, invite summary, 30-day signup series',
        responses: {
          200: {
            description: 'Admin statistics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    stats:   { $ref: '#/components/schemas/AdminStats' },
                  },
                },
                example: {
                  success: true,
                  stats: {
                    users: { total: 142, newThisWeek: 8, byRole: { admin: 2, coach: 15, client: 125 } },
                    invites: { total: 20, pending: 5, accepted: 14, expired: 1 },
                    signupsByDay: [
                      { date: '2026-03-01', count: 3 },
                      { date: '2026-03-02', count: 0 },
                      { date: '2026-03-03', count: 5 },
                    ],
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'Paginated user list with optional role / status filters',
        parameters: [
          { name: 'page',     in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit',    in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
          { name: 'role',     in: 'query', schema: { type: 'string', enum: ['admin','coach','client'] } },
          { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: {
          200: {
            description: 'User list',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: [{ id: UUID, email: 'coach@example.com', username: 'coach_jane', role: 'coach', isActive: true, isEmailVerified: true, createdAt: TS }],
                  total: 1, page: 1, limit: 20,
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/admin/users/{id}/role': {
      patch: {
        tags: ['Admin'],
        summary: 'Change a user\'s role',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid', example: UUID } },
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['role'], properties: { role: { type: 'string', enum: ['admin','coach','client'], example: 'coach' } } } } },
        },
        responses: {
          200: { description: 'Role updated', content: { 'application/json': { example: { success: true, message: 'Role updated', user: { id: UUID, role: 'coach' } } } } },
          400: { $ref: '#/components/responses/ValidationFailed' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/admin/users/{id}/status': {
      patch: {
        tags: ['Admin'],
        summary: 'Activate or deactivate a user account',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid', example: UUID } },
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['isActive'], properties: { isActive: { type: 'boolean', example: false } } } } },
        },
        responses: {
          200: { description: 'Status updated', content: { 'application/json': { example: { success: true, message: 'Status updated', user: { id: UUID, isActive: false } } } } },
          400: { $ref: '#/components/responses/ValidationFailed' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/admin/cleanup/sessions': {
      post: {
        tags: ['Admin'],
        summary: 'Manually trigger expired-session cleanup',
        responses: {
          200: { description: 'Cleanup complete', content: { 'application/json': { example: { success: true, message: 'Session cleanup completed', result: { expired: 42, old: 8, total: 50 } } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },

  },
};
