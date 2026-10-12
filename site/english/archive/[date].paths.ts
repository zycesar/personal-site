import { listArchiveDates, todayIso } from '../../.vitepress/english/rotation'

export default {
  paths() {
    return listArchiveDates(todayIso()).map((date) => ({ params: { date } }))
  },
}
