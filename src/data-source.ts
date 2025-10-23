import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { Card } from './entity/Card'
import * as dotenv from 'dotenv'

dotenv.config()

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  synchronize: true,
  logging: false,
  entities: [Card],
  migrations: ['src/migration/**/*.ts'],
  subscribers: [],
})
