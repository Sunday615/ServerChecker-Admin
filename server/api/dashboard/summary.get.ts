import { queryOne, queryRows } from '../../utils/mysql'

export default defineEventHandler(async () => {
  try {
    const [latestRun, failingServices, failingWebChecks, failingSites, recentRuns] = await Promise.all([
      queryOne(`
        SELECT run_key, generated_at, overall_status, total_hosts, total_services, total_failed, total_web_failed
        FROM check_runs
        ORDER BY generated_at DESC
        LIMIT 1
      `),
      queryRows(`
        SELECT service_result_id, site_name, host_address, host_display_name, service_name, status, connection_error, service_report_html_path, service_screenshot_file
        FROM latest_service_status_v
        WHERE status <> 'PASS'
        ORDER BY generated_at DESC
        LIMIT 8
      `),
      queryRows(`
        SELECT web_result_id, site_name, target_name, target_url, status, message, screenshot_file, web_report_html_path
        FROM latest_web_status_v
        WHERE status <> 'PASS'
        ORDER BY generated_at DESC
        LIMIT 8
      `),
      queryRows(`
        SELECT site_name, COUNT(*) AS failing_services
        FROM latest_service_status_v
        WHERE status <> 'PASS'
        GROUP BY site_name
        ORDER BY failing_services DESC, site_name ASC
      `),
      queryRows(`
        SELECT run_key, generated_at, overall_status, total_hosts, total_services, total_failed, total_web_failed
        FROM check_runs
        ORDER BY generated_at DESC
        LIMIT 10
      `)
    ])

    return {
      databaseOnline: true,
      message: '',
      latestRun,
      failingServiceCount: failingServices.length,
      failingWebCount: failingWebChecks.length,
      failingSites,
      failingServices,
      failingWebChecks,
      recentRuns
    }
  }
  catch (error: any) {
    return {
      databaseOnline: false,
      message: error?.message || 'Failed to load dashboard data from MySQL.',
      latestRun: null,
      failingServiceCount: 0,
      failingWebCount: 0,
      failingSites: [],
      failingServices: [],
      failingWebChecks: [],
      recentRuns: []
    }
  }
})
