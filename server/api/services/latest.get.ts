import { queryRows } from '../../utils/mysql'

export default defineEventHandler(async () => {
  try {
    const items = await queryRows(`
      SELECT service_result_id, run_key, generated_at, site_name, host_address, host_display_name, service_name, check_profile_name, status, passed_count, failed_count, connection_error, service_report_html_path, service_screenshot_file
      FROM latest_service_status_v
      ORDER BY site_name ASC, host_address ASC, service_name ASC
    `)

    return {
      databaseOnline: true,
      message: '',
      items
    }
  }
  catch (error: any) {
    return {
      databaseOnline: false,
      message: error?.message || 'Failed to load latest service status.',
      items: []
    }
  }
})
