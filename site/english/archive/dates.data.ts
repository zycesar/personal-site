import { defineLoader } from 'vitepress'

import { listArchiveDates, todayIso } from '../../.vitepress/english/rotation'

export default defineLoader({
  load: () => listArchiveDates(todayIso()),
})
