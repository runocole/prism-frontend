/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

import { Route as rootRouteImport } from './routes/__root'
import { Route as HrRouteImport } from './routes/hr'
import { Route as IndexRouteImport } from './routes/index'
import { Route as HrResultsRouteImport } from './routes/hr.results'
import { Route as HrLoginRouteImport } from './routes/hr.login'
import { Route as HrInvitesRouteImport } from './routes/hr.invites'
import { Route as HrDashboardRouteImport } from './routes/hr.dashboard'
import { Route as CTokenRouteImport } from './routes/c.$token'
import { Route as HrTestsNewRouteImport } from './routes/hr.tests.new'
import { Route as HrResultsInviteIdRouteImport } from './routes/hr.results.$inviteId'
import { Route as CTokenTestRouteImport } from './routes/c.$token.test'
import { Route as CTokenDoneRouteImport } from './routes/c.$token.done'
import { Route as HrTestsRouteImport } from './routes/hr.tests'
import { Route as HrTestsTestIdRouteImport } from './routes/hr.tests.$testId'
import { Route as ApplySlugRouteImport } from './routes/apply.$slug'
import { Route as HrJobsRouteImport } from './routes/hr.jobs'
import { Route as HrBlacklistRouteImport } from './routes/hr.blacklist'
import { Route as HrScreeningRouteImport } from './routes/hr.screening'

const HrRoute = HrRouteImport.update({
  id: '/hr',
  path: '/hr',
  getParentRoute: () => rootRouteImport,
} as any)
const IndexRoute = IndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRouteImport,
} as any)
const HrLoginRoute = HrLoginRouteImport.update({
  id: '/hr/login',
  path: '/hr/login',
  getParentRoute: () => rootRouteImport,
} as any)
const HrResultsRoute = HrResultsRouteImport.update({
  id: '/results',
  path: '/results',
  getParentRoute: () => HrRoute,
} as any)
const HrInvitesRoute = HrInvitesRouteImport.update({
  id: '/invites',
  path: '/invites',
  getParentRoute: () => HrRoute,
} as any)
const HrDashboardRoute = HrDashboardRouteImport.update({
  id: '/dashboard',
  path: '/dashboard',
  getParentRoute: () => HrRoute,
} as any)
const CTokenRoute = CTokenRouteImport.update({
  id: '/c/$token',
  path: '/c/$token',
  getParentRoute: () => rootRouteImport,
} as any)
const HrTestsNewRoute = HrTestsNewRouteImport.update({
  id: '/tests/new',
  path: '/tests/new',
  getParentRoute: () => HrRoute,
} as any)
const HrTestsRoute = HrTestsRouteImport.update({
  id: '/tests',
  path: '/tests',
  getParentRoute: () => HrRoute,
} as any)
const HrTestsTestIdRoute = HrTestsTestIdRouteImport.update({
  id: '/tests/$testId',
  path: '/tests/$testId',
  getParentRoute: () => HrRoute,
} as any)
const HrResultsInviteIdRoute = HrResultsInviteIdRouteImport.update({
  id: '/$inviteId',
  path: '/$inviteId',
  getParentRoute: () => HrResultsRoute,
} as any)
const CTokenTestRoute = CTokenTestRouteImport.update({
  id: '/test',
  path: '/test',
  getParentRoute: () => CTokenRoute,
} as any)
const CTokenDoneRoute = CTokenDoneRouteImport.update({
  id: '/done',
  path: '/done',
  getParentRoute: () => CTokenRoute,
} as any)
const ApplySlugRoute = ApplySlugRouteImport.update({
  id: '/apply/$slug',
  path: '/apply/$slug',
  getParentRoute: () => rootRouteImport,
} as any)
const HrJobsRoute = HrJobsRouteImport.update({
  id: '/jobs',
  path: '/jobs',
  getParentRoute: () => HrRoute,
} as any)
const HrBlacklistRoute = HrBlacklistRouteImport.update({
  id: '/blacklist',
  path: '/blacklist',
  getParentRoute: () => HrRoute,
} as any)
const HrScreeningRoute = HrScreeningRouteImport.update({
  id: '/screening',
  path: '/screening',
  getParentRoute: () => HrRoute,
} as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/hr': typeof HrRouteWithChildren
  '/c/$token': typeof CTokenRouteWithChildren
  '/apply/$slug': typeof ApplySlugRoute
  '/hr/login': typeof HrLoginRoute
  '/hr/dashboard': typeof HrDashboardRoute
  '/hr/invites': typeof HrInvitesRoute
  '/hr/results': typeof HrResultsRouteWithChildren
  '/c/$token/done': typeof CTokenDoneRoute
  '/c/$token/test': typeof CTokenTestRoute
  '/hr/results/$inviteId': typeof HrResultsInviteIdRoute
  '/hr/tests/new': typeof HrTestsNewRoute
  '/hr/tests': typeof HrTestsRoute
  '/hr/tests/$testId': typeof HrTestsTestIdRoute
  '/hr/jobs': typeof HrJobsRoute
  '/hr/blacklist': typeof HrBlacklistRoute
  '/hr/screening': typeof HrScreeningRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/hr': typeof HrRouteWithChildren
  '/c/$token': typeof CTokenRouteWithChildren
  '/apply/$slug': typeof ApplySlugRoute
  '/hr/login': typeof HrLoginRoute
  '/hr/dashboard': typeof HrDashboardRoute
  '/hr/invites': typeof HrInvitesRoute
  '/hr/results': typeof HrResultsRouteWithChildren
  '/c/$token/done': typeof CTokenDoneRoute
  '/c/$token/test': typeof CTokenTestRoute
  '/hr/results/$inviteId': typeof HrResultsInviteIdRoute
  '/hr/tests/new': typeof HrTestsNewRoute
  '/hr/tests': typeof HrTestsRoute
  '/hr/tests/$testId': typeof HrTestsTestIdRoute
  '/hr/jobs': typeof HrJobsRoute
  '/hr/blacklist': typeof HrBlacklistRoute
  '/hr/screening': typeof HrScreeningRoute
}

export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/hr': typeof HrRouteWithChildren
  '/c/$token': typeof CTokenRouteWithChildren
  '/apply/$slug': typeof ApplySlugRoute
  '/hr/login': typeof HrLoginRoute
  '/hr/dashboard': typeof HrDashboardRoute
  '/hr/invites': typeof HrInvitesRoute
  '/hr/results': typeof HrResultsRouteWithChildren
  '/c/$token/done': typeof CTokenDoneRoute
  '/c/$token/test': typeof CTokenTestRoute
  '/hr/results/$inviteId': typeof HrResultsInviteIdRoute
  '/hr/tests/new': typeof HrTestsNewRoute
  '/hr/tests': typeof HrTestsRoute
  '/hr/tests/$testId': typeof HrTestsTestIdRoute
  '/hr/jobs': typeof HrJobsRoute
  '/hr/blacklist': typeof HrBlacklistRoute
  '/hr/screening': typeof HrScreeningRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/'
    | '/hr'
    | '/c/$token'
    | '/apply/$slug'
    | '/hr/login'
    | '/hr/dashboard'
    | '/hr/invites'
    | '/hr/results'
    | '/c/$token/done'
    | '/c/$token/test'
    | '/hr/results/$inviteId'
    | '/hr/tests/new'
    | '/hr/tests'
    | '/hr/tests/$testId'
    | '/hr/jobs'
    | '/hr/blacklist'
    | '/hr/screening'
  fileRoutesByTo: FileRoutesByTo
  to:
    | '/'
    | '/hr'
    | '/c/$token'
    | '/apply/$slug'
    | '/hr/login'
    | '/hr/dashboard'
    | '/hr/invites'
    | '/hr/results'
    | '/c/$token/done'
    | '/c/$token/test'
    | '/hr/results/$inviteId'
    | '/hr/tests/new'
    | '/hr/tests'
    | '/hr/tests/$testId'
    | '/hr/jobs'
    | '/hr/blacklist'
    | '/hr/screening'
  id:
    | '__root__'
    | '/'
    | '/hr'
    | '/c/$token'
    | '/apply/$slug'
    | '/hr/login'
    | '/hr/dashboard'
    | '/hr/invites'
    | '/hr/results'
    | '/c/$token/done'
    | '/c/$token/test'
    | '/hr/results/$inviteId'
    | '/hr/tests/new'
    | '/hr/tests'
    | '/hr/tests/$testId'
    | '/hr/jobs'
    | '/hr/blacklist'
    | '/hr/screening'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  HrRoute: typeof HrRouteWithChildren
  CTokenRoute: typeof CTokenRouteWithChildren
  ApplySlugRoute: typeof ApplySlugRoute
  HrLoginRoute: typeof HrLoginRoute
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/hr': {
      id: '/hr'
      path: '/hr'
      fullPath: '/hr'
      preLoaderRoute: typeof HrRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/hr/login': {
      id: '/hr/login'
      path: '/hr/login'
      fullPath: '/hr/login'
      preLoaderRoute: typeof HrLoginRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/hr/results': {
      id: '/hr/results'
      path: '/results'
      fullPath: '/hr/results'
      preLoaderRoute: typeof HrResultsRouteImport
      parentRoute: typeof HrRoute
    }
    '/hr/invites': {
      id: '/hr/invites'
      path: '/invites'
      fullPath: '/hr/invites'
      preLoaderRoute: typeof HrInvitesRouteImport
      parentRoute: typeof HrRoute
    }
    '/hr/dashboard': {
      id: '/hr/dashboard'
      path: '/dashboard'
      fullPath: '/hr/dashboard'
      preLoaderRoute: typeof HrDashboardRouteImport
      parentRoute: typeof HrRoute
    }
    '/c/$token': {
      id: '/c/$token'
      path: '/c/$token'
      fullPath: '/c/$token'
      preLoaderRoute: typeof CTokenRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/apply/$slug': {
      id: '/apply/$slug'
      path: '/apply/$slug'
      fullPath: '/apply/$slug'
      preLoaderRoute: typeof ApplySlugRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/hr/tests/new': {
      id: '/hr/tests/new'
      path: '/tests/new'
      fullPath: '/hr/tests/new'
      preLoaderRoute: typeof HrTestsNewRouteImport
      parentRoute: typeof HrRoute
    }
    '/hr/results/$inviteId': {
      id: '/hr/results/$inviteId'
      path: '/$inviteId'
      fullPath: '/hr/results/$inviteId'
      preLoaderRoute: typeof HrResultsInviteIdRouteImport
      parentRoute: typeof HrResultsRoute
    }
    '/c/$token/test': {
      id: '/c/$token/test'
      path: '/test'
      fullPath: '/c/$token/test'
      preLoaderRoute: typeof CTokenTestRouteImport
      parentRoute: typeof CTokenRoute
    }
    '/c/$token/done': {
      id: '/c/$token/done'
      path: '/done'
      fullPath: '/c/$token/done'
      preLoaderRoute: typeof CTokenDoneRouteImport
      parentRoute: typeof CTokenRoute
    }
    '/hr/tests': {
      id: '/hr/tests'
      path: '/tests'
      fullPath: '/hr/tests'
      preLoaderRoute: typeof HrTestsRouteImport
      parentRoute: typeof HrRoute
    }
    '/hr/tests/$testId': {
      id: '/hr/tests/$testId'
      path: '/tests/$testId'
      fullPath: '/hr/tests/$testId'
      preLoaderRoute: typeof HrTestsTestIdRouteImport
      parentRoute: typeof HrRoute
    }
    '/hr/jobs': {
      id: '/hr/jobs'
      path: '/jobs'
      fullPath: '/hr/jobs'
      preLoaderRoute: typeof HrJobsRouteImport
      parentRoute: typeof HrRoute
    }
    '/hr/blacklist': {
      id: '/hr/blacklist'
      path: '/blacklist'
      fullPath: '/hr/blacklist'
      preLoaderRoute: typeof HrBlacklistRouteImport
      parentRoute: typeof HrRoute
    }
    '/hr/screening': {
      id: '/hr/screening'
      path: '/screening'
      fullPath: '/hr/screening'
      preLoaderRoute: typeof HrScreeningRouteImport
      parentRoute: typeof HrRoute
    }
  }
}

interface HrResultsRouteChildren {
  HrResultsInviteIdRoute: typeof HrResultsInviteIdRoute
}

const HrResultsRouteChildren: HrResultsRouteChildren = {
  HrResultsInviteIdRoute: HrResultsInviteIdRoute,
}

const HrResultsRouteWithChildren = HrResultsRoute._addFileChildren(
  HrResultsRouteChildren,
)

interface HrRouteChildren {
  HrDashboardRoute: typeof HrDashboardRoute
  HrInvitesRoute: typeof HrInvitesRoute
  HrResultsRoute: typeof HrResultsRouteWithChildren
  HrTestsNewRoute: typeof HrTestsNewRoute
  HrTestsRoute: typeof HrTestsRoute
  HrTestsTestIdRoute: typeof HrTestsTestIdRoute
  HrJobsRoute: typeof HrJobsRoute
  HrBlacklistRoute: typeof HrBlacklistRoute
  HrScreeningRoute: typeof HrScreeningRoute
}

const HrRouteChildren: HrRouteChildren = {
  HrDashboardRoute: HrDashboardRoute,
  HrInvitesRoute: HrInvitesRoute,
  HrResultsRoute: HrResultsRouteWithChildren,
  HrTestsNewRoute: HrTestsNewRoute,
  HrTestsRoute: HrTestsRoute,
  HrTestsTestIdRoute: HrTestsTestIdRoute,
  HrJobsRoute: HrJobsRoute,
  HrBlacklistRoute: HrBlacklistRoute,
  HrScreeningRoute: HrScreeningRoute,
}

const HrRouteWithChildren = HrRoute._addFileChildren(HrRouteChildren)

interface CTokenRouteChildren {
  CTokenDoneRoute: typeof CTokenDoneRoute
  CTokenTestRoute: typeof CTokenTestRoute
}

const CTokenRouteChildren: CTokenRouteChildren = {
  CTokenDoneRoute: CTokenDoneRoute,
  CTokenTestRoute: CTokenTestRoute,
}

const CTokenRouteWithChildren = CTokenRoute._addFileChildren(CTokenRouteChildren)

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  HrRoute: HrRouteWithChildren,
  CTokenRoute: CTokenRouteWithChildren,
  ApplySlugRoute: ApplySlugRoute,
  HrLoginRoute: HrLoginRoute,
}

export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

import type { getRouter } from './router.tsx'
import type { createStart } from '@tanstack/react-start'
declare module '@tanstack/react-start' {
  interface Register {
    ssr: true
    router: Awaited<ReturnType<typeof getRouter>>
  }
}