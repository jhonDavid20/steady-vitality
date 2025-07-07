// prisma/seed/index.ts
import { PrismaClient, ActivityLevel, GoalCategory, MeasurementType, ExerciseType, MealType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createDefaultUsers() {
  console.log('👥 Creating default users...')
  
  // Create admin user
  console.log('🔄 Creating admin user...')
  const admin = await prisma.user.upsert({
    where: { email: 'admin@steadyvitality.com' },
    update: {}, // Don't update if exists
    create: {
      email: 'admin@steadyvitality.com',
      username: 'admin',
      password: await bcrypt.hash('AdminPassword123!', 12),
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
      isActive: true,
      isVerified: true,
      profile: {
        create: {
          dateOfBirth: new Date('1990-01-01'),
          gender: 'Other',
          phone: '+1-555-0123',
          timezone: 'America/New_York',
          height: 175,
          activityLevel: ActivityLevel.MODERATELY_ACTIVE,
          primaryGoal: GoalCategory.GENERAL_FITNESS,
          coachNotes: 'System administrator account with full access to all features',
          onboardingCompleted: true
        }
      }
    },
    include: { profile: true }
  })

  console.log('✅ Admin user ready!')
  console.log(`   Email: ${admin.email}`)

  // Create sample client user
  console.log('🔄 Creating sample client user...')
  const client = await prisma.user.upsert({
    where: { email: 'client@example.com' },
    update: {},
    create: {
      email: 'client@example.com',
      username: 'sample_client',
      password: await bcrypt.hash('ClientPassword123!', 12),
      firstName: 'Jane',
      lastName: 'Doe',
      role: 'CLIENT',
      isActive: true,
      isVerified: true,
      profile: {
        create: {
          dateOfBirth: new Date('1995-06-15'),
          gender: 'Female',
          phone: '+1-555-0456',
          timezone: 'America/New_York',
          height: 165,
          activityLevel: ActivityLevel.LIGHTLY_ACTIVE,
          primaryGoal: GoalCategory.WEIGHT_LOSS,
          dietaryRestrictions: ['vegetarian'],
          allergies: ['nuts'],
          exercisePreferences: ['yoga', 'walking', 'swimming'],
          coachNotes: 'Sample client for testing. Motivated to lose weight and build healthy habits.',
          onboardingCompleted: true
        }
      }
    },
    include: { profile: true }
  })

  console.log('✅ Sample client ready!')
  console.log(`   Email: ${client.email}`)

  return { admin, client }
}

async function createSystemSettings() {
  console.log('⚙️ Creating system settings...')
  
  const settings = [
    {
      key: 'APP_VERSION',
      value: '1.0.0',
      description: 'Current application version',
      category: 'app'
    },
    {
      key: 'MAX_FILE_SIZE',
      value: '10485760',
      description: 'Maximum file upload size in bytes (10MB)',
      category: 'upload'
    },
    {
      key: 'ALLOWED_IMAGE_TYPES',
      value: 'image/jpeg,image/png,image/webp',
      description: 'Allowed image file types for uploads',
      category: 'upload'
    },
    {
      key: 'DEFAULT_GOAL_DURATION_DAYS',
      value: '90',
      description: 'Default goal duration in days',
      category: 'goals'
    },
    {
      key: 'MAINTENANCE_MODE',
      value: 'false',
      description: 'Whether the app is in maintenance mode',
      category: 'app'
    },
    {
      key: 'EMAIL_NOTIFICATIONS_ENABLED',
      value: 'true',
      description: 'Whether email notifications are enabled',
      category: 'notifications'
    }
  ]

  for (const setting of settings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: { 
        value: setting.value,
        description: setting.description,
        category: setting.category
      },
      create: setting
    })
  }

  console.log(`✅ Created ${settings.length} system settings`)
}

async function createSampleContent() {
  console.log('📚 Creating educational content...')
  
  const content = [
    {
      title: 'Getting Started with Steady Vitality',
      description: 'Learn the basics of using the Steady Vitality platform',
      content: 'Welcome to Steady Vitality! This guide will help you get started with tracking your health and fitness journey.',
      category: 'getting_started',
      tags: ['beginner', 'introduction', 'platform'],
      difficulty: 'beginner',
      isPublished: true,
      duration: 5
    },
    {
      title: 'Understanding Macronutrients',
      description: 'Learn about proteins, carbohydrates, and fats',
      content: 'Macronutrients are the building blocks of nutrition. Understanding them is key to reaching your health goals.',
      category: 'nutrition',
      tags: ['nutrition', 'macros', 'education'],
      difficulty: 'beginner',
      isPublished: true,
      duration: 10
    },
    {
      title: 'Creating Sustainable Habits',
      description: 'How to build habits that last a lifetime',
      content: 'Sustainable habits are formed through consistency, not perfection. Start small and build gradually.',
      category: 'habit_formation',
      tags: ['habits', 'psychology', 'lifestyle'],
      difficulty: 'intermediate',
      isPublished: true,
      duration: 15
    },
    {
      title: 'Strength Training Basics',
      description: 'Introduction to resistance training',
      content: 'Strength training is essential for building muscle, improving bone density, and boosting metabolism.',
      category: 'exercise',
      tags: ['strength', 'resistance', 'muscle'],
      difficulty: 'beginner',
      isPublished: true,
      duration: 12
    },
    {
      title: 'Progress Photo Guidelines',
      description: 'How to take effective progress photos',
      content: 'Consistent progress photos are a powerful tool for tracking your transformation.',
      category: 'tracking',
      tags: ['photos', 'progress', 'measurement'],
      difficulty: 'beginner',
      isPublished: true,
      duration: 8
    }
  ]

  for (const item of content) {
    // Find existing content by title (assuming title is not unique)
    const existing = await prisma.educationalContent.findFirst({ where: { title: item.title } })
    if (existing) {
      await prisma.educationalContent.update({
        where: { id: existing.id },
        data: item
      })
    } else {
      await prisma.educationalContent.create({
        data: item
      })
    }
  }

  console.log(`✅ Created ${content.length} educational content items`)
}

async function createSampleData(clientId: string) {
  console.log('📊 Creating sample data for development...')
  
  // Create sample health metrics
  const healthMetrics = [
    { type: MeasurementType.WEIGHT, value: 70, unit: 'kg', recordedAt: new Date('2024-01-01') },
    { type: MeasurementType.WEIGHT, value: 69.5, unit: 'kg', recordedAt: new Date('2024-01-08') },
    { type: MeasurementType.WEIGHT, value: 69, unit: 'kg', recordedAt: new Date('2024-01-15') },
    { type: MeasurementType.BODY_FAT, value: 25, unit: '%', recordedAt: new Date('2024-01-01') },
    { type: MeasurementType.BODY_FAT, value: 24.5, unit: '%', recordedAt: new Date('2024-01-15') },
  ]

  for (const metric of healthMetrics) {
    await prisma.healthMetric.create({
      data: {
        userId: clientId,
        ...metric
      }
    })
  }

  // Create sample body measurements
  await prisma.bodyMeasurement.create({
    data: {
      userId: clientId,
      weight: 70,
      bodyFat: 25,
      waist: 80,
      chest: 90,
      arms: 30,
      thighs: 55,
      bmi: 25.7,
      notes: 'Initial measurements',
      recordedAt: new Date('2024-01-01')
    }
  })

  // Create sample workout session
  const workoutSession = await prisma.workoutSession.create({
    data: {
      userId: clientId,
      name: 'Upper Body Strength',
      type: ExerciseType.STRENGTH,
      duration: 45,
      caloriesBurned: 250,
      notes: 'Great workout! Feeling strong.',
      difficulty: 7,
      startedAt: new Date('2024-01-02T09:00:00'),
      completedAt: new Date('2024-01-02T09:45:00'),
    }
  })

  // Create sample exercises for the workout
  const exercises = [
    { name: 'Push-ups', sets: 3, reps: 12, order: 1 },
    { name: 'Dumbbell Press', sets: 3, reps: 10, weight: 15, order: 2 },
    { name: 'Pull-ups', sets: 3, reps: 8, order: 3 },
    { name: 'Shoulder Press', sets: 3, reps: 12, weight: 10, order: 4 },
  ]

  for (const exercise of exercises) {
    await prisma.workoutExercise.create({
      data: {
        sessionId: workoutSession.id,
        ...exercise
      }
    })
  }

  // Create sample nutrition entries
  const nutritionEntries = [
    {
      foodName: 'Oatmeal with Berries',
      servingSize: 1,
      servingUnit: 'bowl',
      calories: 300,
      protein: 10,
      carbohydrates: 50,
      fat: 8,
      mealType: MealType.BREAKFAST,
      consumedAt: new Date('2024-01-02T08:00:00')
    },
    {
      foodName: 'Grilled Chicken Salad',
      servingSize: 1,
      servingUnit: 'plate',
      calories: 450,
      protein: 35,
      carbohydrates: 20,
      fat: 25,
      mealType: MealType.LUNCH,
      consumedAt: new Date('2024-01-02T13:00:00')
    },
    {
      foodName: 'Salmon with Vegetables',
      servingSize: 1,
      servingUnit: 'plate',
      calories: 500,
      protein: 40,
      carbohydrates: 30,
      fat: 25,
      mealType: MealType.DINNER,
      consumedAt: new Date('2024-01-02T19:00:00')
    }
  ]

  for (const entry of nutritionEntries) {
    await prisma.nutritionEntry.create({
      data: {
        userId: clientId,
        ...entry
      }
    })
  }

  // Create sample goals
  const goals = [
    {
      title: 'Lose 5kg',
      description: 'Reach target weight of 65kg through healthy eating and exercise',
      category: GoalCategory.WEIGHT_LOSS,
      targetValue: 65,
      currentValue: 70,
      unit: 'kg',
      targetDate: new Date('2024-04-01'),
      priority: 'high'
    },
    {
      title: 'Exercise 4x per week',
      description: 'Maintain consistent workout schedule',
      category: GoalCategory.HABIT_FORMATION,
      targetValue: 4,
      currentValue: 2,
      unit: 'times per week',
      targetDate: new Date('2024-03-01'),
      priority: 'medium'
    },
    {
      title: 'Drink 8 glasses of water daily',
      description: 'Stay properly hydrated throughout the day',
      category: GoalCategory.NUTRITION,
      targetValue: 8,
      currentValue: 5,
      unit: 'glasses',
      priority: 'medium'
    }
  ]

  for (const goal of goals) {
    await prisma.goal.create({
      data: {
        userId: clientId,
        ...goal
      }
    })
  }

  // Create sample habit tracking
  const habits = ['Water Intake', 'Exercise', 'Sleep 8 hours', 'Meditation', 'Healthy Breakfast']
  const categories = ['hydration', 'exercise', 'sleep', 'mindfulness', 'nutrition']
  
  for (let i = 0; i < habits.length; i++) {
    for (let day = 1; day <= 7; day++) {
      await prisma.habitTracking.create({
        data: {
          userId: clientId,
          habitName: habits[i],
          category: categories[i],
          targetValue: i === 0 ? 8 : 1, // 8 glasses for water, 1 for others
          actualValue: i === 0 ? Math.floor(Math.random() * 3) + 6 : Math.random() > 0.3 ? 1 : 0,
          unit: i === 0 ? 'glasses' : 'completed',
          isCompleted: Math.random() > 0.2, // 80% completion rate
          streak: Math.floor(Math.random() * 10) + 1,
          trackedDate: new Date(`2024-01-0${day}`)
        }
      })
    }
  }

  console.log('✅ Sample data created successfully!')
}

async function main() {
  try {
    console.log('🌱 Starting Steady Vitality database seeding...\n')

    // Check if we're in a fresh database or re-seeding
    const existingUsers = await prisma.user.count()
    if (existingUsers > 0) {
      console.log(`📊 Found ${existingUsers} existing users. Using upsert for safety.\n`)
    }

    // 1. Create default users (admin and sample client)
    const { admin, client } = await createDefaultUsers()
    
    // 2. Create system settings
    console.log('\n⚙️ Creating system settings...')
    await createSystemSettings()
    
    // 3. Create sample educational content
    console.log('\n📚 Creating educational content...')
    await createSampleContent()
    
    // 4. Create sample data for development (only in dev environment)
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n📊 Creating sample data for development...')
      await createSampleData(client.id)
    }

    console.log('\n✅ Database seeding completed successfully!')
    console.log('\n🔑 Default Login Credentials:')
    console.log('┌─────────────────────────────────────────────────┐')
    console.log('│ ADMIN ACCESS                                    │')
    console.log('│ Email:    admin@steadyvitality.com              │')
    console.log('│ Password: AdminPassword123!                     │')
    console.log('├─────────────────────────────────────────────────┤')
    console.log('│ CLIENT ACCESS                                   │')
    console.log('│ Email:    client@example.com                    │')
    console.log('│ Password: ClientPassword123!                    │')
    console.log('└─────────────────────────────────────────────────┘')
    console.log('\n🚀 You can now start the server and login!')
    console.log('📊 View database: npm run db:studio')
    
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Handle script execution
main()
  .catch((e) => {
    console.error('Seeding failed:', e)
    process.exit(1)
  })

export default main