import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './env';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Steady Vitality API',
      version: '1.0.0',
      description: 'Health & Fitness Coaching Platform API',
      contact: {
        name: 'API Support',
        email: 'support@steadyvitality.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: config.nodeEnv === 'production' 
          ? 'https://api.steadyvitality.com' 
          : `http://localhost:${config.port}`,
        description: config.nodeEnv === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            username: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            avatar: { type: 'string', format: 'uri', nullable: true },
            role: { type: 'string', enum: ['admin', 'coach', 'client'] },
            isEmailVerified: { type: 'boolean' },
            hasCompletedOnboarding: { type: 'boolean' },
            lastLoginAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        UserProfile: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            gender: { type: 'string', enum: ['male', 'female', 'other', 'prefer_not_to_say'], nullable: true },
            dateOfBirth: { type: 'string', format: 'date', nullable: true },
            height: { type: 'number', description: 'Height in cm', nullable: true },
            weight: { type: 'number', description: 'Weight in kg', nullable: true },
            targetWeight: { type: 'number', description: 'Target weight in kg', nullable: true },
            phone: { type: 'string', nullable: true },
            activityLevel: { type: 'string', enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'] },
            fitnessGoal: { type: 'string', enum: ['weight_loss', 'muscle_gain', 'maintenance', 'strength', 'endurance', 'flexibility', 'general_fitness'] },
            medicalConditions: { type: 'array', items: { type: 'string' } },
            medications: { type: 'array', items: { type: 'string' } },
            injuries: { type: 'array', items: { type: 'string' } },
            allergies: { type: 'array', items: { type: 'string' } },
            dietaryRestrictions: { type: 'array', items: { type: 'string' } },
            preferredWorkoutTime: { type: 'string', nullable: true },
            gymLocation: { type: 'string', nullable: true },
            timezone: { type: 'string', nullable: true },
            notes: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        UserWithProfile: {
          allOf: [
            { $ref: '#/components/schemas/User' },
            {
              type: 'object',
              properties: {
                profile: {
                  oneOf: [
                    { $ref: '#/components/schemas/UserProfile' },
                    { type: 'null' }
                  ]
                }
              }
            }
          ]
        },
        OnboardingRequest: {
          type: 'object',
          required: ['fitnessGoal', 'activityLevel', 'dateOfBirth', 'gender', 'height', 'weight'],
          properties: {
            fitnessGoal: { type: 'string', enum: ['weight_loss', 'muscle_gain', 'maintenance', 'strength', 'endurance', 'flexibility', 'general_fitness'] },
            activityLevel: { type: 'string', enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'] },
            dateOfBirth: { type: 'string', format: 'date', example: '1990-05-20' },
            gender: { type: 'string', enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
            height: { type: 'number', minimum: 50, maximum: 300, description: 'Height in cm', example: 175 },
            weight: { type: 'number', minimum: 30, maximum: 500, description: 'Weight in kg', example: 80 },
            targetWeight: { type: 'number', minimum: 30, maximum: 500, description: 'Target weight in kg', example: 70 },
            medicalConditions: { type: 'array', items: { type: 'string' }, example: [] },
            injuries: { type: 'array', items: { type: 'string' }, example: [] },
            medications: { type: 'array', items: { type: 'string' }, example: [] },
            allergies: { type: 'array', items: { type: 'string' }, example: [] },
            preferredWorkoutTime: { type: 'string', example: 'morning' },
            gymLocation: { type: 'string', example: 'Downtown Gym' },
            timezone: { type: 'string', example: 'America/Bogota' },
            phone: { type: 'string', example: '+573001234567' }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            user: { $ref: '#/components/schemas/User' },
            tokens: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
                expiresIn: { type: 'number' }
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        ValidationError: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.routes.ts', // Path to the API routes
    './src/routes/*.ts',
  ]
};

export const specs = swaggerJsdoc(options);