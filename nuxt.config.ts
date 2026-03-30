// https://nuxt.com/docs/api/configuration/nuxt-config
const isWindows = process.platform === 'win32'

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
    checkerRoot: process.env.CHECKER_ROOT || (isWindows ? '' : '/Users/macbookpro/server-checker'),
    checkerRunScript: process.env.CHECKER_RUN_SCRIPT || (isWindows ? '' : '/Users/macbookpro/server-checker/scripts/run_once.sh'),
    checkerOutputRoot: process.env.CHECKER_OUTPUT_ROOT || (isWindows ? '' : '/Users/macbookpro/server-checker/output'),
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
