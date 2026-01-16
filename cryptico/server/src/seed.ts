import { prisma } from './lib/db.js'
import { hashPassword } from './lib/auth.js'
import { config } from './config.js'

export async function seedInitialAdmin(): Promise<void> {
  const { initialAdminUsername, initialAdminPassword } = config

  // Skip if no initial admin configured
  if (!initialAdminUsername || !initialAdminPassword) {
    return
  }

  // Check if any admin exists
  const existingAdmin = await prisma.adminUser.findFirst()

  if (existingAdmin) {
    console.log('Admin user already exists, skipping seed')
    return
  }

  // Create initial admin
  const passwordHash = await hashPassword(initialAdminPassword)

  await prisma.adminUser.create({
    data: {
      username: initialAdminUsername,
      passwordHash,
    },
  })

  console.log(`✅ Initial admin user created: ${initialAdminUsername}`)
  console.log('⚠️  IMPORTANT: Remove INITIAL_ADMIN_* env vars after first login!')
}

export async function seedDefaultSettings(): Promise<void> {
  const existing = await prisma.settings.findUnique({
    where: { id: 'default' },
  })

  if (existing) {
    return
  }

  await prisma.settings.create({
    data: { id: 'default' },
  })

  console.log('✅ Default settings created')
}
