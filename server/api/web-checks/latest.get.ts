import { queryRows } from '../../utils/mysql'

export default defineEventHandler(async () => {
  try {
    const items = await queryRows(`
      SELECT web_result_id, run_key, generated_at, site_name, target_name, target_url, final_url, status, message, screenshot_file, web_report_html_path
      FROM latest_web_status_v
      ORDER BY site_name ASC, target_name ASC
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
      message: error?.message || 'Failed to load latest web checks.',
      items: []
    }
  }
})
