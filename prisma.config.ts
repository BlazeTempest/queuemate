import { defineConfig } from '@prisma/config'
import dotenv from 'dotenv'

// This line forces Prisma to read your .env file
dotenv.config({ path: '.env.local' })

export default defineConfig({
  datasource: {
    // We use process.env here to grab the loaded URL
    url: process.env.DATABASE_URL,
  }
})