export type SocialLink = {
  name: 'x' | 'github' | 'linkedin' | 'medium' | 'email'
  title: string
  handle: string
  href: string
}

export const site = {
  name: 'Swaraj',
  fullName: 'Swaraj Mali',
  monogram: 'SM',
  title: 'AI Engineer.',
  location: 'Mumbai, India',
  email: 'swarajmali31@gmail.com',
  hireHref: '#contact',
  /** GitHub username for the activity heatmap (no @). */
  githubUsername: 'Swaraj07082',
  flipSentences: [
    'AI Engineer.',
    'Building agents, RAG & real-time voice AI.',
    'Writing about ML & system design.',
  ],
  nav: [
    { label: 'About', href: '#about' },
    { label: 'Experience', href: '#experience' },
    { label: 'Work', href: '#work' },
    { label: 'Articles', href: '#articles' },
    { label: 'Contact', href: '#contact' },
  ],
  social: [
    {
      name: 'x',
      title: 'X',
      handle: '@mindtensor_',
      href: 'https://x.com/mindtensor_',
    },
    {
      name: 'github',
      title: 'GitHub',
      handle: 'Swaraj07082',
      href: 'https://github.com/Swaraj07082',
    },
    {
      name: 'linkedin',
      title: 'LinkedIn',
      handle: 'swaraj-mali',
      href: 'https://www.linkedin.com/in/swaraj-mali-567070254',
    },
    {
      name: 'medium',
      title: 'Medium',
      handle: '@swarajmali31',
      href: 'https://medium.com/@swarajmali31',
    },
    {
      name: 'email',
      title: 'Email',
      handle: 'swarajmali31@gmail.com',
      href: 'mailto:swarajmali31@gmail.com',
    },
  ] satisfies SocialLink[],
  mediumUrl: 'https://medium.com/@swarajmali31',
  avatarSrc: '/avatar.jpeg' as string | null,
  githubStarsLabel: null as string | null,
}
