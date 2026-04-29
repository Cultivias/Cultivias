/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,mdx,md}'],
  theme: {
    extend: {
      colors: {
        primary: '#5cab88',
        'primary-dark': '#3d8a67',
        'bg-mint': '#EDF6EE',
        'bg-pale': '#D4F3D7',
        dark: '#06140C',
        text: '#222222',
        accent: '#C8873A',
        'accent-dark': '#a86e2a',
      },
      fontFamily: {
        heading: ['Merriweather', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      typography: (theme) => ({
        cultivias: {
          css: {
            '--tw-prose-body': theme('colors.text'),
            '--tw-prose-headings': theme('colors.dark'),
            '--tw-prose-links': theme('colors.primary'),
            '--tw-prose-bold': theme('colors.dark'),
            '--tw-prose-counters': theme('colors.primary'),
            '--tw-prose-bullets': theme('colors.primary'),
            '--tw-prose-hr': theme('colors.bg-pale'),
            '--tw-prose-quotes': theme('colors.dark'),
            '--tw-prose-quote-borders': theme('colors.primary'),
            '--tw-prose-code': theme('colors.dark'),
            '--tw-prose-pre-bg': '#f8f8f8',
            maxWidth: 'none',
            fontSize: '1.0625rem',
            lineHeight: '1.75',
            h2: {
              fontFamily: theme('fontFamily.heading').join(', '),
              fontWeight: '700',
              fontSize: '1.5rem',
              marginTop: '2.5rem',
              marginBottom: '1rem',
              color: theme('colors.dark'),
            },
            h3: {
              fontFamily: theme('fontFamily.heading').join(', '),
              fontWeight: '700',
              fontSize: '1.25rem',
              color: theme('colors.dark'),
            },
            p: {
              marginTop: '1.25rem',
              marginBottom: '1.25rem',
            },
            a: {
              color: theme('colors.primary'),
              textDecoration: 'underline',
              '&:hover': { color: theme('colors.primary-dark') },
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
