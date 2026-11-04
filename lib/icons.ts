/** Icons a skill can wear. Stored on the skill as the Boxicons class name. */
export const SKILL_ICONS: [string, string][] = [
  ['bx-code-alt', 'Code'], ['bx-palette', 'Design'], ['bx-pen', 'Writing'], ['bx-globe', 'Language'],
  ['bx-music', 'Music'], ['bx-dumbbell', 'Fitness'], ['bx-line-chart', 'Business'], ['bx-book-open', 'Reading'],
  ['bx-camera', 'Photo'], ['bx-microphone', 'Speaking'], ['bx-data', 'Data'], ['bx-bulb', 'Ideas'],
];
/** Skills saved before icons were picked used emoji; show a neutral glyph for those. */
export const skillIcon = (v: string) => (v?.startsWith('bx') ? v : 'bx-brain');
