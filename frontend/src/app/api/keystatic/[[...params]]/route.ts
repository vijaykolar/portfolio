import { makeRouteHandler } from '@keystatic/next/route-handler'
import config from '../../../../../keystatic.config'

// Handles Keystatic's read/write API and GitHub OAuth
// (callback: /api/keystatic/github/oauth/callback).
export const { POST, GET } = makeRouteHandler({ config })
