// This list defines the order of the main navigation.
export const sections = [
  {
    id: 'research',
    title: 'Research',
    description: 'A running log of my research work. It covers projects I’ve contributed to, ones I’ve led myself, and detailed notes from papers I’ve read closely, from early prototypes to finished experiments.',
  },
  {
    id: 'course',
    title: 'Notes',
    description: 'Most of the notes from my CS major courses live here, alongside self-study notes on other topics I’ve picked up outside of class. They aren’t always polished, just my way of working through concepts and keeping them handy.',
  },
  {
    id: 'music',
    title: 'Music',
    description: 'Stray thoughts on music—what I’m listening to, ideas about sound, and whatever else is on my mind. It also holds excerpts and reading notes from music-related papers, essays, and books that have stuck with me.',
  },
  {
    id: 'about',
    title: 'About',
    description: 'I’m a Computer Science and Technology undergrad at Zhejiang University (Class of ’28), focusing my research on AI x music. Outside of schoolwork, I’m really into glitch and alt-R&B, and I’ve been trying my hand at producing my own tracks.',
  },
];

export function sectionForCategory(category) {
  const name = category.toLowerCase();
  return sections.find((section) => section.id !== 'about'
    && (section.id === name || section.title.toLowerCase() === name));
}

export const homeSections = ['about', 'research', 'course', 'music'].map((id) =>
  sections.find((section) => section.id === id));

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatDate(date) {
  return dateFormat.format(new Date(date));
}

