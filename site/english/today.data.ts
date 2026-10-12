import { defineLoader } from 'vitepress'

import { todayIso } from '../.vitepress/english/rotation'

export default defineLoader({
  load: () => todayIso(),
})
