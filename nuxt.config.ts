import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// https://nuxt.com/docs/api/configuration/nuxt-config
const isWindows = process.platform === 'win32'
const frontendRoot = dirname(fileURLToPath(import.meta.url))
const siblingBackendRoot = resolve(frontendRoot, '../server-checker-backend')
const legacyBackendRoot = isWindows ? '' : '/Users/macbookpro/server-checker'
const defaultCheckerRoot = existsSync(siblingBackendRoot)
  ? siblingBackendRoot
  : legacyBackendRoot
const defaultCheckerRunScript = defaultCheckerRoot
  ? resolve(defaultCheckerRoot, 'scripts', 'run_once.sh')
  : ''
const defaultCheckerOutputRoot = defaultCheckerRoot
  ? resolve(defaultCheckerRoot, 'output')
  : ''

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  compatibilityDate: '2025-01-15',

  runtimeConfig: {
    mysqlHost: process.env.MYSQL_HOST || '127.0.0.1',
    mysqlPort: Number(process.env.MYSQL_PORT || 3306),
    mysqlUser: process.env.MYSQL_USER || 'root',
    mysqlPassword: process.env.MYSQL_PASSWORD || '',
    mysqlDatabase: process.env.MYSQL_DATABASE || 'server_checker',
    checkerRoot: process.env.CHECKER_ROOT || defaultCheckerRoot,
    checkerRunScript: process.env.CHECKER_RUN_SCRIPT || defaultCheckerRunScript,
    checkerOutputRoot: process.env.CHECKER_OUTPUT_ROOT || defaultCheckerOutputRoot,
    checkerPythonBin: process.env.CHECKER_PYTHON_BIN || 'python'
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
