import { readCheckerRunState } from '../../utils/checker'

export default defineEventHandler(async () => {
  return readCheckerRunState()
})
