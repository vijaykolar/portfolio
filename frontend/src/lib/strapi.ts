// Strapi API configuration and utilities

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337'
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN

interface StrapiResponse<T> {
  data: T
  meta?: {
    pagination?: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

interface StrapiSingleResponse<T> {
  data: {
    id: number
    attributes: T
  }
}

interface StrapiCollectionResponse<T> {
  data: Array<{
    id: number
    attributes: T
  }>
  meta?: {
    pagination?: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

// Strapi Media type
export interface StrapiMedia {
  data: {
    id: number
    attributes: {
      name: string
      alternativeText: string | null
      caption: string | null
      width: number
      height: number
      formats: {
        thumbnail?: StrapiImageFormat
        small?: StrapiImageFormat
        medium?: StrapiImageFormat
        large?: StrapiImageFormat
      }
      url: string
    }
  } | null
}

interface StrapiImageFormat {
  name: string
  hash: string
  ext: string
  mime: string
  width: number
  height: number
  size: number
  url: string
}

// Content Types
export interface StrapiPersonalInfo {
  name: string
  title: string
  tagline: string
  bio: string
  location: string
  email: string
  resumeUrl: string
  avatar: StrapiMedia
  createdAt: string
  updatedAt: string
}

export interface StrapiSocialLink {
  platform: 'twitter' | 'github' | 'linkedin' | 'instagram' | 'email'
  url: string
  label: string
  order: number
  createdAt: string
  updatedAt: string
}

export interface StrapiWorkExperience {
  company: string
  title: string
  logo: StrapiMedia
  startDate: string
  endDate: string | null
  isCurrentRole: boolean
  description: string | null
  order: number
  createdAt: string
  updatedAt: string
}

export interface StrapiProject {
  name: string
  description: string
  url: string
  urlLabel: string
  logo: StrapiMedia
  type: 'professional' | 'opensource'
  order: number
  createdAt: string
  updatedAt: string
}

export interface StrapiTool {
  title: string
  description: string
  href: string | null
  category: 'workstation' | 'development' | 'design' | 'productivity'
  order: number
  createdAt: string
  updatedAt: string
}

export interface StrapiArticle {
  title: string
  slug: string
  description: string
  content: string
  author: string
  publishedAt: string
  createdAt: string
  updatedAt: string
}

export interface StrapiAboutContent {
  heading: string
  paragraphs: Array<{
    id: number
    content: string
  }>
  createdAt: string
  updatedAt: string
}

// Helper function to get full media URL
export function getStrapiMediaUrl(media: StrapiMedia | null | undefined): string {
  if (!media?.data?.attributes?.url) {
    return ''
  }
  const url = media.data.attributes.url
  // If URL is absolute, return as is; otherwise prepend STRAPI_URL
  if (url.startsWith('http')) {
    return url
  }
  return `${STRAPI_URL}${url}`
}

// Generic fetch function
async function fetchAPI<T>(
  endpoint: string,
  options: {
    populate?: string | string[] | Record<string, unknown>
    filters?: Record<string, unknown>
    sort?: string | string[]
    pagination?: {
      page?: number
      pageSize?: number
    }
  } = {}
): Promise<T> {
  const { populate, filters, sort, pagination } = options

  const queryParams = new URLSearchParams()

  // Handle populate
  if (populate) {
    if (typeof populate === 'string') {
      queryParams.append('populate', populate)
    } else if (Array.isArray(populate)) {
      populate.forEach((p) => queryParams.append('populate', p))
    } else {
      queryParams.append('populate', JSON.stringify(populate))
    }
  }

  // Handle filters
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (typeof value === 'object') {
        Object.entries(value as Record<string, unknown>).forEach(([filterKey, filterValue]) => {
          queryParams.append(`filters[${key}][${filterKey}]`, String(filterValue))
        })
      } else {
        queryParams.append(`filters[${key}]`, String(value))
      }
    })
  }

  // Handle sort
  if (sort) {
    if (Array.isArray(sort)) {
      sort.forEach((s) => queryParams.append('sort', s))
    } else {
      queryParams.append('sort', sort)
    }
  }

  // Handle pagination
  if (pagination) {
    if (pagination.page) {
      queryParams.append('pagination[page]', String(pagination.page))
    }
    if (pagination.pageSize) {
      queryParams.append('pagination[pageSize]', String(pagination.pageSize))
    }
  }

  const url = `${STRAPI_URL}/api/${endpoint}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (STRAPI_API_TOKEN) {
    headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`
  }

  const response = await fetch(url, { headers })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

// API functions for each content type

export async function getPersonalInfo(): Promise<StrapiPersonalInfo | null> {
  try {
    const response = await fetchAPI<StrapiSingleResponse<StrapiPersonalInfo>>(
      'personal-info',
      { populate: 'avatar' }
    )
    return response.data?.attributes || null
  } catch (error) {
    console.error('Error fetching personal info:', error)
    return null
  }
}

export async function getSocialLinks(): Promise<StrapiSocialLink[]> {
  try {
    const response = await fetchAPI<StrapiCollectionResponse<StrapiSocialLink>>(
      'social-links',
      { sort: 'order:asc' }
    )
    return response.data?.map((item) => item.attributes) || []
  } catch (error) {
    console.error('Error fetching social links:', error)
    return []
  }
}

export async function getWorkExperiences(): Promise<StrapiWorkExperience[]> {
  try {
    const response = await fetchAPI<StrapiCollectionResponse<StrapiWorkExperience>>(
      'work-experiences',
      {
        populate: 'logo',
        sort: 'order:asc',
      }
    )
    return response.data?.map((item) => item.attributes) || []
  } catch (error) {
    console.error('Error fetching work experiences:', error)
    return []
  }
}

export async function getProjects(type?: 'professional' | 'opensource'): Promise<StrapiProject[]> {
  try {
    const filters = type ? { type: { $eq: type } } : undefined
    const response = await fetchAPI<StrapiCollectionResponse<StrapiProject>>(
      'projects',
      {
        populate: 'logo',
        sort: 'order:asc',
        filters,
      }
    )
    return response.data?.map((item) => item.attributes) || []
  } catch (error) {
    console.error('Error fetching projects:', error)
    return []
  }
}

export async function getTools(category?: string): Promise<StrapiTool[]> {
  try {
    const filters = category ? { category: { $eq: category } } : undefined
    const response = await fetchAPI<StrapiCollectionResponse<StrapiTool>>(
      'tools',
      {
        sort: ['category:asc', 'order:asc'],
        filters,
      }
    )
    return response.data?.map((item) => item.attributes) || []
  } catch (error) {
    console.error('Error fetching tools:', error)
    return []
  }
}

export async function getArticles(): Promise<StrapiArticle[]> {
  try {
    const response = await fetchAPI<StrapiCollectionResponse<StrapiArticle>>(
      'articles',
      {
        sort: 'publishedAt:desc',
      }
    )
    return response.data?.map((item) => item.attributes) || []
  } catch (error) {
    console.error('Error fetching articles:', error)
    return []
  }
}

export async function getArticleBySlug(slug: string): Promise<StrapiArticle | null> {
  try {
    const response = await fetchAPI<StrapiCollectionResponse<StrapiArticle>>(
      'articles',
      {
        filters: { slug: { $eq: slug } },
      }
    )
    return response.data?.[0]?.attributes || null
  } catch (error) {
    console.error('Error fetching article:', error)
    return null
  }
}

export async function getAboutContent(): Promise<StrapiAboutContent | null> {
  try {
    const response = await fetchAPI<StrapiSingleResponse<StrapiAboutContent>>(
      'about-content',
      { populate: 'paragraphs' }
    )
    return response.data?.attributes || null
  } catch (error) {
    console.error('Error fetching about content:', error)
    return null
  }
}

// Export base URL for external usage
export { STRAPI_URL }
