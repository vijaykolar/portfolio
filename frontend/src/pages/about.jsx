import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import clsx from 'clsx'

import { Container } from '@/components/Container'
import {
  GitHubIcon,
  InstagramIcon,
  LinkedInIcon,
  TwitterIcon,
} from '@/components/SocialIcons'
import portraitImage from '@/images/avatar.jpg'

function SocialLink({ className, href, children, icon: Icon }) {
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

function MailIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fillRule="evenodd"
        d="M6 5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6Zm.245 2.187a.75.75 0 0 0-.99 1.126l6.25 5.5a.75.75 0 0 0 .99 0l6.25-5.5a.75.75 0 0 0-.99-1.126L12 12.251 6.245 7.187Z"
      />
    </svg>
  )
}

export default function About() {
  return (
    <>
      <Head>
        <title>About - Vijay Kolar</title>
        <meta
          name="description"
          content="I’m Vijay Kolar. I live in Bengaluru, where I develop the future."
        />
      </Head>
      <Container className="mt-16 sm:mt-32">
        <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-y-12">
          <div className="lg:pl-20">
            <div className="max-w-xs px-2.5 lg:max-w-none">
              <Image
                src={portraitImage}
                alt=""
                sizes="(min-width: 1024px) 32rem, 20rem"
                className="aspect-square rotate-3 rounded-2xl bg-zinc-100 object-cover dark:bg-zinc-800"
              />
            </div>
          </div>
          <div className="lg:order-first lg:row-span-2">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
              I’m Kolar Vijay. I live in Bengaluru City, where I develop the
              future.
            </h1>
            <div className="mt-6 space-y-7 text-base text-zinc-600 dark:text-zinc-400">
              <p>
               I am skilled web developer living in Bengaluru City, India. I specialize in developing websites using React Node, and known for my clean, efficient coding practices. In addition to my work as a web developer, I am passionate about blog writing, and regularly shares my insights and expertise on various topics related to web development and coding.
              </p>
              <p>
                When I am not busy in coding or writing, I enjoy spending time with family. I place a high value on relationships with my loved ones, and makes sure to carve out time in my busy schedule to connect with them.
              </p>
              <p>
                One of my greatest passions is travel. I love exploring new places and experiencing different cultures, and traveled to a number of destinations around the Karnataka, India. Whether I am exploring the bustling streets of a big city or hiking through a scenic mountain range, I am always eager to immerse myself in new experiences and learn as much as i can about the world around me.
              </p>
              <p>
                Despite my busy schedule and varied interests, I am a committed family man who always makes time for my loved ones. I am happily married and takes great joy in spending time with my spouse whenever i can.
              </p>
            </div>
          </div>
          <div className="lg:pl-20">
            <ul role="list">
              <SocialLink href="https://twitter.com/_vkolar" icon={TwitterIcon}>
                Follow on Twitter
              </SocialLink>
              <SocialLink href="https://github.com/vijaykolar/" icon={GitHubIcon} className="mt-4">
                Checkout on GitHub
              </SocialLink>
              <SocialLink href="https://www.linkedin.com/in/vijaykolar/" icon={LinkedInIcon} className="mt-4">
                Connect on LinkedIn
              </SocialLink>
              <SocialLink
                href="mailto:vijayikolar@gmail.com"
                icon={MailIcon}
                className="mt-8 border-t border-zinc-100 pt-8 dark:border-zinc-700/40"
              >
                vijayikolar@gmail.com
              </SocialLink>
            </ul>
          </div>
        </div>
      </Container>
    </>
  )
}
