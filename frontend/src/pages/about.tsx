import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import clsx from 'clsx'
import type { SVGProps, ComponentType, ReactNode } from 'react'
import type { GetStaticProps } from 'next'

import { Container } from '@/components/Container'
import {
  GitHubIcon,
  LinkedInIcon,
  TwitterIcon,
} from '@/components/SocialIcons'
import portraitImage from '@/images/avatar.jpg'
import {
  getAboutContent,
  getSocialLinks,
  getPersonalInfo,
  getStrapiMediaUrl,
} from '@/lib/strapi'

interface SocialLinkProps {
  className?: string
  href: string
  children: ReactNode
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

function SocialLink({ className, href, children, icon: Icon }: SocialLinkProps) {
  return (
    <li className={clsx(className, 'flex')}>
      <Link
        href={href}
        target="_blank"
        className="group flex text-sm font-medium text-zinc-800 transition hover:text-teal-500 dark:text-zinc-200 dark:hover:text-teal-500"
      >
        <Icon className="h-6 w-6 flex-none fill-zinc-500 transition group-hover:fill-teal-500" />
        <span className="ml-4">{children}</span>
      </Link>
    </li>
  )
}

function MailIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fillRule="evenodd"
        d="M6 5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6Zm.245 2.187a.75.75 0 0 0-.99 1.126l6.25 5.5a.75.75 0 0 0 .99 0l6.25-5.5a.75.75 0 0 0-.99-1.126L12 12.251 6.245 7.187Z"
      />
    </svg>
  )
}

// Fallback content
const fallbackHeading = "I'm Kolar Vijay. I live in Bengaluru City, where I develop the future."
const fallbackParagraphs = [
  "I am skilled web developer living in Bengaluru City, India. I specialize in developing websites using React Node, and known for my clean, efficient coding practices. In addition to my work as a web developer, I am passionate about blog writing, and regularly shares my insights and expertise on various topics related to web development and coding.",
  "When I am not busy in coding or writing, I enjoy spending time with family. I place a high value on relationships with my loved ones, and makes sure to carve out time in my busy schedule to connect with them.",
  "One of my greatest passions is travel. I love exploring new places and experiencing different cultures, and traveled to a number of destinations around the Karnataka, India. Whether I am exploring the bustling streets of a big city or hiking through a scenic mountain range, I am always eager to immerse myself in new experiences and learn as much as i can about the world around me.",
  "Despite my busy schedule and varied interests, I am a committed family man who always makes time for my loved ones. I am happily married and takes great joy in spending time with my spouse whenever i can.",
]

const fallbackSocialLinks = [
  { platform: 'twitter', url: 'https://twitter.com/_vkolar', label: 'Follow on Twitter' },
  { platform: 'github', url: 'https://github.com/vijaykolar/', label: 'Checkout on GitHub' },
  { platform: 'linkedin', url: 'https://www.linkedin.com/in/vijaykolar/', label: 'Connect on LinkedIn' },
]

// Map platform to icon
const socialIconMap: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  twitter: TwitterIcon,
  github: GitHubIcon,
  linkedin: LinkedInIcon,
}

interface AboutProps {
  heading?: string
  paragraphs?: string[]
  socialLinks?: Array<{
    platform: string
    url: string
    label: string
  }>
  email?: string
  avatarUrl?: string
}

export default function About({ heading, paragraphs, socialLinks, email, avatarUrl }: AboutProps) {
  const displayHeading = heading || fallbackHeading
  const displayParagraphs = paragraphs && paragraphs.length > 0 ? paragraphs : fallbackParagraphs
  const displayLinks = socialLinks && socialLinks.length > 0 ? socialLinks : fallbackSocialLinks
  const displayEmail = email || 'vijayikolar@gmail.com'

  return (
    <>
      <Head>
        <title>About - Vijay Kolar</title>
        <meta
          name="description"
          content="I'm Vijay Kolar. I live in Bengaluru, where I develop the future."
        />
      </Head>
      <Container className="mt-16 sm:mt-32">
        <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-y-12">
          <div className="lg:pl-20">
            <div className="max-w-xs px-2.5 lg:max-w-none">
              <Image
                src={avatarUrl || portraitImage}
                alt=""
                width={400}
                height={400}
                sizes="(min-width: 1024px) 32rem, 20rem"
                className="aspect-square rotate-3 rounded-2xl bg-zinc-100 object-cover dark:bg-zinc-800"
              />
            </div>
          </div>
          <div className="lg:order-first lg:row-span-2">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
              {displayHeading}
            </h1>
            <div className="mt-6 space-y-7 text-base text-zinc-600 dark:text-zinc-400">
              {displayParagraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
          <div className="lg:pl-20">
            <ul role="list">
              {displayLinks.map((link, index) => {
                const Icon = socialIconMap[link.platform]
                if (!Icon) return null
                return (
                  <SocialLink
                    key={link.platform}
                    href={link.url}
                    icon={Icon}
                    className={index > 0 ? 'mt-4' : undefined}
                  >
                    {link.label}
                  </SocialLink>
                )
              })}
              <SocialLink
                href={`mailto:${displayEmail}`}
                icon={MailIcon}
                className="mt-8 border-t border-zinc-100 pt-8 dark:border-zinc-700/40"
              >
                {displayEmail}
              </SocialLink>
            </ul>
          </div>
        </div>
      </Container>
    </>
  )
}

export const getStaticProps: GetStaticProps<AboutProps> = async () => {
  // Fetch data from Strapi
  const [aboutContent, socialLinksData, personalInfo] = await Promise.all([
    getAboutContent(),
    getSocialLinks(),
    getPersonalInfo(),
  ])

  // Transform about content
  const heading = aboutContent?.heading
  const paragraphs = aboutContent?.paragraphs?.map((p) => p.content)

  // Transform social links
  const socialLinks = socialLinksData.length > 0
    ? socialLinksData.map((link) => ({
        platform: link.platform,
        url: link.url,
        label: link.label,
      }))
    : undefined

  // Get email and avatar from personal info
  const email = personalInfo?.email
  const avatarUrl = personalInfo?.avatar ? getStrapiMediaUrl(personalInfo.avatar) : undefined

  return {
    props: {
      heading,
      paragraphs,
      socialLinks,
      email,
      avatarUrl,
    },
    revalidate: 3600,
  }
}
