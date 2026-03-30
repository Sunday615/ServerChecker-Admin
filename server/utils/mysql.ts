import mysql from 'mysql2/promise'
import type { Pool, RowDataPacket } from 'mysql2/promise'

declare global {
  var __serverCheckMysqlPool: Pool | undefined
}

export const getMysqlPool = () => {
  if (!globalThis.__serverCheckMysqlPool) {
    const config = useRuntimeConfig()

    globalThis.__serverCheckMysqlPool = mysql.createPool({
      host: config.mysqlHost,
      port: Number(config.mysqlPort),
      user: config.mysqlUser,
      password: config.mysqlPassword,
      database: config.mysqlDatabase,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      dateStrings: true
    })
  }

  return globalThis.__serverCheckMysqlPool
}

export const queryRows = async <T extends RowDataPacket[] = RowDataPacket[]>(
  sql: string,
  params: Array<string | number | boolean | null> = []
) => {
  const [rows] = await getMysqlPool().query<T>(sql, params)
  return rows
}

export const queryOne = async <T extends RowDataPacket = RowDataPacket>(
  sql: string,
  params: Array<string | number | boolean | null> = []
) => {
  const rows = await queryRows<T[]>(sql, params)
  return rows[0] || null
}
