import Head from 'next/head'
import type { ReactNode } from 'react'
import type { GetStaticProps } from 'next'

import { Card } from '@/components/Card'
import { Section } from '@/components/Section'
import { SimpleLayout } from '@/components/SimpleLayout'
import { getTools } from '@/lib/strapi'

interface ToolsSectionProps {
  title: string
  children: ReactNode
}

function ToolsSection({ children, ...props }: ToolsSectionProps) {
  return (
    <Section {...props}>
      <ul role="list" className="space-y-16">
        {children}
      </ul>
    </Section>
  )
}

interface ToolProps {
  title: string
  href?: string
  children: ReactNode
}

function Tool({ title, href, children }: ToolProps) {
  return (
    <Card as="li">
      <Card.Title as="h3" href={href}>
        {title}
      </Card.Title>
      <Card.Description>{children}</Card.Description>
    </Card>
  )
}

// Tool data interface
interface ToolData {
  title: string
  description: string
  href?: string | null
  category: string
}

// Fallback tools data
const fallbackTools: ToolData[] = [
  {
    title: '13" MacBook Air, 8GB RAM (2019)',
    description: "I was using an Intel-based 13\" MacBook Air prior to this and the difference is night and day. I've never heard the fans turn on a single time, even under the incredibly heavy loads I put it through with our various launch simulations.",
    category: 'workstation',
  },
  {
    title: '27" Asus Monitor',
    description: "The only display on the market if you want something HiDPI and bigger than 27\". When you're working at planetary scale, every pixel you can get counts.",
    category: 'workstation',
  },
  {
    title: 'Herman Miller Aeron Chair',
    description: "If I'm going to slouch in the worst ergonomic position imaginable all day, I might as well do it in an expensive chair.",
    category: 'workstation',
  },
  {
    title: 'VS Code / Pycharm',
    description: "I don't care if it's missing all of the fancy IDE features everyone else relies on, VS Code / Pycharm is still the best text editors ever made.",
    category: 'development',
  },
  {
    title: 'iTerm2',
    description: "I'm honestly not even sure what features I get with this that aren't just part of the macOS Terminal but it's what I use.",
    category: 'development',
  },
  {
    title: 'SQL Lite Studio',
    description: 'Great software for working with databases. Has saved me from building about an admin interfaces for my various projects over the years.',
    category: 'development',
  },
  {
    title: 'Figma',
    description: "I started using Figma as just a design tool but now it's become our virtual whiteboard. Never would have expected the collaboration features to be the real hook.",
    category: 'design',
  },
  {
    title: 'Alfred',
    description: "It's not the newest kid on the block but it's still the fastest. The Sublime Text of the application launcher world.",
    category: 'productivity',
  },
  {
    title: 'Reflect',
    description: "Using a daily notes system instead of trying to keep things organized by topics has been super powerful for me. And with Reflect, it's still easy for me to keep all of that stuff discoverable by topic even though all of my writing happens in the daily note.",
    category: 'productivity',
  },
  {
    title: 'SavvyCal',
    description: 'Great tool for scheduling meetings while protecting my calendar and making sure I still have lots of time for deep work during the week.',
    category: 'productivity',
  },
  {
    title: 'Focus',
    description: 'Simple tool for blocking distracting websites when I need to just do the work and get some momentum going.',
    category: 'productivity',
  },
]

// Category display names
const categoryNames: Record<string, string> = {
  workstation: 'Workstation',
  development: 'Development tools',
  design: 'Design',
  productivity: 'Productivity',
}

// Category order
const categoryOrder = ['workstation', 'development', 'design', 'productivity']

interface UsesProps {
  tools?: ToolData[]
}

export default function Uses({ tools }: UsesProps) {
  const displayTools = tools && tools.length > 0 ? tools : fallbackTools

  // Group tools by category
  const toolsByCategory = displayTools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = []
    }
    acc[tool.category].push(tool)
    return acc
  }, {} as Record<string, ToolData[]>)

  return (
    <>
      <Head>
        <title>Uses - Vijay Kolar</title>
        <meta
          name="description"
          content="Software I use, gadgets I love, and other things I recommend."
        />
      </Head>
      <SimpleLayout
        title="Software I use, gadgets I love, and other things I recommend."
        intro="I get asked a lot about the things I use to build software, stay productive, or buy to fool myself into thinking I'm being productive when I'm really just procrastinating. Here's a big list of all of my favorite stuff."
      >
        <div className="space-y-20">
          {categoryOrder.map((category) => {
            const categoryTools = toolsByCategory[category]
            if (!categoryTools || categoryTools.length === 0) return null
            return (
              <ToolsSection key={category} title={categoryNames[category] || category}>
                {categoryTools.map((tool) => (
                  <Tool key={tool.title} title={tool.title} href={tool.href || undefined}>
                    {tool.description}
                  </Tool>
                ))}
              </ToolsSection>
            )
          })}
        </div>
      </SimpleLayout>
    </>
  )
}

export const getStaticProps: GetStaticProps<UsesProps> = async () => {
  // Fetch tools from Strapi
  const toolsData = await getTools()

  // Transform tools
  const tools: ToolData[] | undefined = toolsData.length > 0
    ? toolsData.map((t) => ({
        title: t.title,
        description: t.description,
        href: t.href,
        category: t.category,
      }))
    : undefined

  return {
    props: {
      tools,
    },
    revalidate: 3600,
  }
}
