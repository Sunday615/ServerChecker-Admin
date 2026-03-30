import { queryOne, queryRows } from '../../utils/mysql'

export default defineEventHandler(async () => {
  try {
    const [
      latestRun,
      siteCountRow,
      failingServiceCountRow,
      failingWebCountRow,
      failingServices,
      failingWebChecks,
      failingSites,
      recentRuns
    ] = await Promise.all([
      queryOne(`
        SELECT run_key, generated_at, overall_status, total_hosts, total_services, total_passed, total_failed, total_web_checks, total_web_passed, total_web_failed
        FROM check_runs
        ORDER BY generated_at DESC
        LIMIT 1
      `),
      queryOne(`
        SELECT COUNT(*) AS total_sites
        FROM sites
      `),
      queryOne(`
        SELECT COUNT(*) AS total_failing_services
        FROM latest_service_status_v
        WHERE status <> 'PASS'
      `),
      queryOne(`
        SELECT COUNT(*) AS total_failing_web
        FROM latest_web_status_v
        WHERE status <> 'PASS'
      `),
      queryRows(`
        SELECT service_result_id, run_key, generated_at, site_name, host_address, host_display_name, service_name, check_profile_name, status, connection_error, service_report_html_path, service_screenshot_file
        FROM latest_service_status_v
        WHERE status <> 'PASS'
        ORDER BY generated_at DESC
        LIMIT 8
      `),
      queryRows(`
        SELECT web_result_id, run_key, generated_at, site_name, target_name, target_url, final_url, status, message, screenshot_file, web_report_html_path
        FROM latest_web_status_v
        WHERE status <> 'PASS'
        ORDER BY generated_at DESC
        LIMIT 8
      `),
      queryRows(`
        SELECT
          site_name,
          COUNT(*) AS monitored_services,
          SUM(CASE WHEN status = 'PASS' THEN 1 ELSE 0 END) AS stable_services,
          SUM(CASE WHEN status <> 'PASS' THEN 1 ELSE 0 END) AS failing_services
        FROM latest_service_status_v
        GROUP BY site_name
        ORDER BY failing_services DESC, monitored_services DESC, site_name ASC
      `),
      queryRows(`
        SELECT run_key, generated_at, overall_status, total_hosts, total_services, total_passed, total_failed, total_web_checks, total_web_passed, total_web_failed
        FROM check_runs
        ORDER BY generated_at DESC
        LIMIT 12
      `)
    ])

    return {
      databaseOnline: true,
      message: '',
      totalSiteCount: Number(siteCountRow?.total_sites || 0),
      latestRun,
      failingServiceCount: Number(failingServiceCountRow?.total_failing_services || 0),
      failingWebCount: Number(failingWebCountRow?.total_failing_web || 0),
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
      totalSiteCount: 0,
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
