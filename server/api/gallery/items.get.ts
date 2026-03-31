import { queryOne, queryRows } from '../../utils/mysql'

type GalleryZone = 'DC' | 'DR' | 'OTHER'
type GallerySource = 'service' | 'web' | 'summary'

const resolveZone = (siteName: string): GalleryZone => {
  const normalized = String(siteName || '').trim().toUpperCase()

  if (normalized.includes('DR')) {
    return 'DR'
  }

  if (normalized.includes('DC')) {
    return 'DC'
  }

  return 'OTHER'
}

export default defineEventHandler(async () => {
  try {
    const latestRun = await queryOne(`
      SELECT id, run_key, generated_at, overall_status
      FROM check_runs
      ORDER BY generated_at DESC
      LIMIT 1
    `)

    const [serviceShots, webShots, summaryShots] = await Promise.all([
      queryRows(`
        SELECT
          service_result_id,
          run_key,
          generated_at,
          site_name,
          host_address,
          host_display_name,
          service_name,
          status,
          connection_error,
          service_screenshot_file,
          service_report_html_path
        FROM latest_service_status_v
        WHERE service_screenshot_file <> ''
        ORDER BY generated_at DESC, site_name ASC, service_name ASC
      `),
      queryRows(`
        SELECT
          web_result_id,
          run_key,
          generated_at,
          site_name,
          target_name,
          target_url,
          final_url,
          status,
          message,
          screenshot_file,
          web_report_html_path
        FROM latest_web_status_v
        WHERE screenshot_file <> ''
        ORDER BY generated_at DESC, site_name ASC, target_name ASC
      `),
      latestRun
        ? queryRows(`
          SELECT
            sr.site_id,
            si.site_name,
            cr.run_key,
            cr.generated_at,
            cr.overall_status,
            sr.report_html_path,
            sr.summary_screenshot_file
          FROM site_run_reports sr
          JOIN sites si ON si.id = sr.site_id
          JOIN check_runs cr ON cr.id = sr.check_run_id
          WHERE sr.check_run_id = ?
            AND sr.summary_screenshot_file <> ''
          ORDER BY si.site_name ASC
        `, [latestRun.id as number])
        : Promise.resolve([])
    ])

    const items = [
      ...serviceShots.map((item: any) => ({
        id: `service-${item.service_result_id}`,
        zone: resolveZone(item.site_name),
        source: 'service' as GallerySource,
        sourceLabel: 'Service',
        siteName: item.site_name,
        title: `${item.service_name} on ${item.host_display_name || item.host_address}`,
        subtitle: item.connection_error || item.host_address,
        status: item.status,
        generatedAt: item.generated_at,
        runKey: item.run_key,
        imagePath: item.service_screenshot_file,
        reportPath: item.service_report_html_path,
        meta: item.host_display_name || item.host_address,
        targetUrl: '',
        note: item.connection_error || 'Terminal capture from the latest service run.'
      })),
      ...webShots.map((item: any) => ({
        id: `web-${item.web_result_id}`,
        zone: resolveZone(item.site_name),
        source: 'web' as GallerySource,
        sourceLabel: 'Web',
        siteName: item.site_name,
        title: item.target_name,
        subtitle: item.final_url || item.target_url,
        status: item.status,
        generatedAt: item.generated_at,
        runKey: item.run_key,
        imagePath: item.screenshot_file,
        reportPath: item.web_report_html_path,
        meta: item.target_url,
        targetUrl: item.final_url || item.target_url,
        note: item.message || 'Browser screenshot from the latest web check.'
      })),
      ...summaryShots.map((item: any) => ({
        id: `summary-${item.site_id}`,
        zone: resolveZone(item.site_name),
        source: 'summary' as GallerySource,
        sourceLabel: 'Summary',
        siteName: item.site_name,
        title: `${item.site_name} summary board`,
        subtitle: 'Site overview report',
        status: item.overall_status,
        generatedAt: item.generated_at,
        runKey: item.run_key,
        imagePath: item.summary_screenshot_file,
        reportPath: item.report_html_path,
        meta: item.site_name,
        targetUrl: '',
        note: 'Generated summary screenshot for the latest report bundle.'
      }))
    ].sort((left, right) => {
      return new Date(right.generatedAt).getTime() - new Date(left.generatedAt).getTime()
    })

    return {
      databaseOnline: true,
      message: '',
      items
    }
  }
  catch (error: any) {
    return {
      databaseOnline: false,
      message: error?.message || 'Failed to load gallery artifacts.',
      items: []
    }
  }
})
