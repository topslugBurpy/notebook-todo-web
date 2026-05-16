export function shouldPromptCarryForward(today: string): boolean {
  return localStorage.getItem(`carry-prompted-${today}`) !== '1'
}

export function dismissCarryPrompt(today: string): void {
  localStorage.setItem(`carry-prompted-${today}`, '1')
}
