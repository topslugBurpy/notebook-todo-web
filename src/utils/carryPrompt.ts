export function shouldPromptCarryForward(today: string): boolean {
  return localStorage.getItem(`carry-prompted-${today}`) !== '1'
}

export function dismissCarryPrompt(today: string): void {
  localStorage.setItem(`carry-prompted-${today}`, '1')
}

const taskKey = (text: string) => text.trim().toLowerCase()

// Drops tasks whose text is already on today's list, or repeated within `tasks`.
export function withoutDuplicates<T extends { text: string }>(
  tasks: T[],
  todayTasks: { text: string }[],
): T[] {
  const seen = new Set(todayTasks.map(t => taskKey(t.text)))
  return tasks.filter(t => {
    const key = taskKey(t.text)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
