import Head from 'next/head'
import Image from 'next/image'
import type { SVGProps } from 'react'
import type { StaticImageData } from 'next/image'

import { Card } from '@/components/Card'
import { SimpleLayout } from '@/components/SimpleLayout'
import logoOpenShuttle from '@/images/logos/open-shuttle.svg'
import lollypopLogo from '@/images/logos/lollypo-logo.png'
import digitLogo from '@/images/logos/go-digit.png'
import valtechLogo from '@/images/logos/valtech.png'
import githubLogo from '@/images/logos/github.png'

interface Project {
  name: string
  description: string
  link: { href: string; label: string }
  logo: StaticImageData
}

const projects: Project[] = [
  {
    name: 'Lollypop Design Studio',
    description:
      'High performance web animation library, hand-written in optimized WASM.',
    link: { href: 'https://lollypop.design/', label: 'lollypop.design' },
    logo: lollypopLogo,
  },
  {
    name: 'Go Digit Insurance',
    description:
      'Creating technology to empower civilians to explore space on their own terms.',
    link: { href: 'https://www.godigit.com/', label: 'godigit.com' },
    logo: digitLogo,
  },

  {
    name: 'Expo 2020 Dubai',
    description:
      'Real-time video streaming library, optimized for interstellar transmission.',
    link: { href: 'https://www.expo2020dubai.com/', label: 'Expo 2020 Dubai' },
    logo: valtechLogo,
  },
  {
    name: 'Villas on Rent',
    description:
      'The operating system that powers our Planetaria space shuttles.',
    link: { href: 'https://villasonrent.com/', label: 'villasonrent.com' },
    logo: lollypopLogo,
  },
  {
    name: 'PS Group',
    description:
      'The schematics for the first rocket I designed that successfully made it to orbit.',
    link: { href: 'https://psgroup.in/', label: 'psgroup.in' },
    logo: lollypopLogo,
  },
  {
    name: 'Moople',
    description:
      'The schematics for the first rocket I designed that successfully made it to orbit.',
    link: { href: 'https://moople.in/', label: 'moople.in' },
    logo: logoOpenShuttle,
  },
]

const openSourceProjects: Project[] = [
  {
    name: 'Project Management',
    description:
      'A project management tool built with Next.js and Tailwind CSS.',
    link: {
      href: 'https://project-management-app-theta-sand.vercel.app/',
      label: 'project-management.app',
    },
    logo: githubLogo,
  },
  {
    name: 'Care Pulse',
    description:
      'CarePulse is a doctor booking app built using a modern tech stack to ensure a seamless and efficient user experience.',
    link: {
      href: 'https://care-pulse-nine-mu.vercel.app/',
      label: 'care-pulse.app',
    },
    logo: githubLogo,
  },
  {
    name: 'Vite games',
    description:
      'vite-games repository is an open-source project that utilizes the Vite build tool and Chakra UI library to create a web application for gaming purposes. Vite is a fast and lightweight development tool for building modern web applications, while Chakra UI is a component library.',
    link: { href: 'https://vite-games.vercel.app', label: 'vite-games.app' },
    logo: githubLogo,
  },
  {
    name: 'Cab Booking React Native App',
    description:
      'Check out this a cab booking app built using React Native, Expo, TypeScript, Neon Database, and Clerk for authentication. Implemented following pages Welcome, Sign Up, Sign In, Recent Rides, Chat, and Profile.',
    link: {
      href: 'https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7239654459935449088',
      label: 'cab-booking.app',
    },
    logo: githubLogo,
  },
  {
    name: 'Garden React App',
    description: 'A collaborative gardening app built with React.',
    link: {
      href: 'https://garden-team.netlify.app/',
      label: 'garden-team.com',
    },
    logo: githubLogo,
  },
  {
    name: 'Color Pallette',
    description:
      'A tool to generate and share color palettes for design projects.',
    link: {
      href: 'https://color-pallete-pi.vercel.app/',
      label: 'color-pallette.app',
    },
    logo: githubLogo,
  },
  {
    name: 'Material Dashboard',
    description:
      'A React-based dashboard template using Material-UI components.',
    link: {
      href: 'https://react-material-dashboard-vijaykolar.vercel.app/',
      label: 'material-dashboard.com',
    },
    logo: githubLogo,
  },
]

function LinkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M15.712 11.823a.75.75 0 1 0 1.06 1.06l-1.06-1.06Zm-4.95 1.768a.75.75 0 0 0 1.06-1.06l-1.06 1.06Zm-2.475-1.414a.75.75 0 1 0-1.06-1.06l1.06 1.06Zm4.95-1.768a.75.75 0 1 0-1.06 1.06l1.06-1.06Zm3.359.53-.884.884 1.06 1.06.885-.883-1.061-1.06Zm-4.95-2.12 1.414-1.415L12 6.344l-1.415 1.413 1.061 1.061Zm0 3.535a2.5 2.5 0 0 1 0-3.536l-1.06-1.06a4 4 0 0 0 0 5.656l1.06-1.06Zm4.95-4.95a2.5 2.5 0 0 1 0 3.535L17.656 12a4 4 0 0 0 0-5.657l-1.06 1.06Zm1.06-1.06a4 4 0 0 0-5.656 0l1.06 1.06a2.5 2.5 0 0 1 3.536 0l1.06-1.06Zm-7.07 7.07.176.177 1.06-1.06-.176-.177-1.06 1.06Zm-3.183-.353.884-.884-1.06-1.06-.884.883 1.06 1.06Zm4.95 2.121-1.414 1.414 1.06 1.06 1.415-1.413-1.06-1.061Zm0-3.536a2.5 2.5 0 0 1 0 3.536l1.06 1.06a4 4 0 0 0 0-5.656l-1.06 1.06Zm-4.95 4.95a2.5 2.5 0 0 1 0-3.535L6.344 12a4 4 0 0 0 0 5.656l1.06-1.06Zm-1.06 1.06a4 4 0 0 0 5.657 0l-1.061-1.06a2.5 2.5 0 0 1-3.535 0l-1.061 1.06Zm7.07-7.07-.176-.177-1.06 1.06.176.178 1.06-1.061Z"
        fill="currentColor"
      />
    </svg>
  )
}

export default function Projects() {
  return (
    <>
      <Head>
        <title>Projects - Vijay Kolar</title>
        <meta
          name="description"
          content="Things I've made trying to put my dent in the universe."
        />
      </Head>
      <SimpleLayout
        title="Things I've made trying to put my dent in the universe."
        intro="I've worked on few of little projects over the years but these are the ones that I'm most proud of. Few of them are open-source, so if you see something that piques your interest, check out the code and contribute if you have ideas for how it can be improved."
      >
        <ul
          role="list"
          className="grid grid-cols-1 gap-x-12 gap-y-16 sm:grid-cols-2 lg:grid-cols-3"
        >
          {projects.map((project) => (
            <Card as="li" key={project.name}>
              <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md shadow-zinc-800/5 ring-1 ring-zinc-900/5 dark:border dark:border-zinc-700/50 dark:bg-zinc-800 dark:ring-0">
                <Image
                  src={project.logo}
                  alt=""
                  className="h-8 w-8 object-contain"
                  unoptimized
                />
              </div>
              <h2 className="mt-6 text-base font-semibold text-zinc-800 dark:text-zinc-100">
                <Card.Link target="_blank" href={project.link.href}>
                  {project.name}
                </Card.Link>
              </h2>
              <Card.Description>{project.description}</Card.Description>
              <p className="relative z-10 mt-6 flex text-sm font-medium text-zinc-400 transition group-hover:text-teal-500 dark:text-zinc-200">
                <LinkIcon className="h-6 w-6 flex-none" />
                <span className="ml-2">{project.link.label}</span>
              </p>
            </Card>
          ))}
        </ul>
      </SimpleLayout>
      <SimpleLayout title="Open source" intro="">
        <ul
          role="list"
          className="grid grid-cols-1 gap-x-12 gap-y-16 sm:grid-cols-2 lg:grid-cols-3"
        >
          {openSourceProjects.map((project) => (
            <Card as="li" key={project.name}>
              <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md shadow-zinc-800/5 ring-1 ring-zinc-900/5 dark:border dark:border-zinc-700/50 dark:bg-zinc-800 dark:ring-0">
                <Image
                  src={project.logo}
                  alt=""
                  className="h-8 w-8 object-contain"
                  unoptimized
                />
              </div>
              <h2 className="mt-6 text-base font-semibold text-zinc-800 dark:text-zinc-100">
                <Card.Link target="_blank" href={project.link.href}>
                  {project.name}
                </Card.Link>
              </h2>
              <Card.Description>{project.description}</Card.Description>
              <p className="relative z-10 mt-6 flex text-sm font-medium text-zinc-400 transition group-hover:text-teal-500 dark:text-zinc-200">
                <LinkIcon className="h-6 w-6 flex-none" />
                <span className="ml-2">{project.link.label}</span>
              </p>
            </Card>
          ))}
        </ul>
      </SimpleLayout>
    </>
  )
}
