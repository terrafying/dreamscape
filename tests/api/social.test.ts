import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted creates refs that are hoisted BEFORE vi.mock calls — avoids TDZ
const { refs, getSupabaseFn, getAuthenticatedClientMock } = vi.hoisted(() => {
  const from = vi.fn()
  const fn = vi.fn()
  const getSupabaseFn = vi.fn(() => ({ from } as any))
  const refs = { supabase: { from }, getUser: fn }
  const getAuthenticatedClientMock = vi.fn(() => ({ from: refs.supabase.from }))
  return {
    refs,
    getSupabaseFn,
    getAuthenticatedClientMock,
  }
})

vi.mock('@/lib/supabaseClient', () => ({ getSupabase: getSupabaseFn }))
vi.mock('@/lib/supabaseServer', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/supabaseServer')>()
  return {
    ...actual,
    getUserFromRequest: refs.getUser,
    getAuthenticatedClient: getAuthenticatedClientMock,
  }
})

import { POST as sharePOST } from '@/app/api/share/[dreamId]/route'
import { GET as feedGET } from '@/app/api/feed/route'
import { GET as friendsGET } from '@/app/api/feed/friends/route'
import { GET as similarGET } from '@/app/api/similar/[dreamId]/route'
import { GET as profileGET } from '@/app/api/profile/[handle]/route'
import { POST as followPOST } from '@/app/api/profile/follow/[handle]/route'
import { POST as reactPOST } from '@/app/api/dreams/[id]/react/route'
import { POST as interpretPOST } from '@/app/api/dreams/[id]/interpret/route'

const mockUser = { id: 'user-1', email: 'test@example.com' }

function chain() {
  const c: Record<string, any> = {}
  for (const m of ['select', 'insert', 'update', 'delete', 'upsert', 'eq', 'neq', 'in', 'single', 'order', 'range', 'limit']) {
    ;(c as any)[m] = vi.fn().mockImplementation(function (this: Record<string, any>) { return c })
  }
  return c
}

const tables = new Map<string, Record<string, any>>()
const defaultChain = chain()

refs.supabase.from.mockImplementation((t: string) => {
  return tables.get(t) ?? defaultChain
})

function setTable(table: string, c: Record<string, any>) {
  tables.set(table, c)
}

function setTableWithIn(table: string, resolvedValue: any) {
  const sub = chain()
  sub.eq.mockResolvedValue(resolvedValue)
  const c = chain()
  c.in.mockReturnValue(sub)
  setTable(table, c)
}

let inCallCount = 0
function setTableWithInDouble(table: string, firstResult: any, secondResult: any) {
  inCallCount = 0
  const c = chain()
  c.in.mockImplementation(function () {
    inCallCount++
    const sub = chain()
    sub.eq.mockResolvedValue(inCallCount === 1 ? firstResult : secondResult)
    return sub
  })
  setTable(table, c)
}

function makeReq(url: string, method = 'GET', body?: object) {
  return new Request(`http://localhost${url}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

function authReq(r: Request) {
  r.headers.set('authorization', 'Bearer tok')
  return r
}

function withAuth() {
  refs.getUser.mockResolvedValue(mockUser as any)
}

beforeEach(() => {
  refs.getUser.mockReset()
  refs.getUser.mockResolvedValue(null)
  getSupabaseFn.mockReset()
  getSupabaseFn.mockReturnValue({ from: refs.supabase.from })
  getAuthenticatedClientMock.mockReset()
  getAuthenticatedClientMock.mockImplementation(() => ({ from: refs.supabase.from }))
  tables.clear()
  inCallCount = 0
  refs.supabase.from.mockImplementation((t: string) => {
    return tables.get(t) ?? defaultChain
  })
})

describe('POST /api/share/[dreamId]', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await sharePOST(makeReq('/api/share/d1', 'POST', { dream: { id: 'd1' } }), { params: { dreamId: 'd1' } })
    expect(res.status).toBe(401)
  })

  it('returns 400 when dream id mismatches params', async () => {
    withAuth()
    const profileChain = chain()
    profileChain.single.mockResolvedValue({ data: { user_id: 'user-1', handle: 'starwalker' }, error: null })
    setTable('user_profiles', profileChain)
    const res = await sharePOST(
      authReq(makeReq('/api/share/d1', 'POST', { dream: { id: 'd2' } })),
      { params: { dreamId: 'd1' } },
    )
    expect(res.status).toBe(400)
    expect((await res.json()).error).toContain('Invalid dream data')
  })

  it('returns 500 when database unavailable', async () => {
    withAuth()
    getAuthenticatedClientMock.mockReturnValue(null)
    const res = await sharePOST(authReq(makeReq('/api/share/d1', 'POST', { dream: { id: 'd1' } })), { params: { dreamId: 'd1' } })
    expect(res.status).toBe(500)
  })

  it('returns 400 when profile not found', async () => {
    withAuth()
    const c = chain()
    c.single.mockResolvedValue({ data: null, error: { message: 'not found' } })
    setTable('user_profiles', c)
    const res = await sharePOST(authReq(makeReq('/api/share/d1', 'POST', { dream: { id: 'd1', extraction: {} } })), { params: { dreamId: 'd1' } })
    expect(res.status).toBe(400)
  })

  it('shares dream successfully', async () => {
    withAuth()
    const profileChain = chain()
    profileChain.single.mockResolvedValue({ data: { user_id: 'user-1', handle: 'starwalker' }, error: null })
    setTable('user_profiles', profileChain)

    const sharedChain = chain()
    sharedChain.single.mockResolvedValue({ data: { id: 's1', share_handle: 'starwalker', symbols: ['water'], themes: ['depth'], emotions: ['peace'] }, error: null })
    setTable('shared_dreams', sharedChain)

    const res = await sharePOST(authReq(makeReq('/api/share/d1', 'POST', {
      dream: {
        id: 'd1',
        extraction: {
          symbols: [{ name: 'Water' }],
          themes: [{ name: 'Depth' }],
          emotions: [{ name: 'Peace' }],
        },
      },
    })), { params: { dreamId: 'd1' } })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.sharedDream.share_handle).toBe('starwalker')
  })
})

describe('GET /api/feed', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await feedGET(makeReq('/api/feed'))
    expect(res.status).toBe(401)
  })

  it('returns 500 when database unavailable', async () => {
    withAuth()
    getSupabaseFn.mockReturnValue(null)
    const res = await feedGET(authReq(makeReq('/api/feed')))
    expect(res.status).toBe(500)
  })

  it('returns empty array when no dreams', async () => {
    withAuth()
    const c = chain()
    c.range.mockResolvedValue({ data: [], error: null })
    setTable('shared_dreams', c)
    const res = await feedGET(authReq(makeReq('/api/feed')))
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.dreams).toEqual([])
    expect(json.hasMore).toBe(false)
  })

  it('returns dreams with reaction counts aggregated', async () => {
    withAuth()
    const c = chain()
    c.range.mockResolvedValue({ data: [{ id: 'd1', user_id: 'u1', dream_id: 'dr1', dream_data: {}, symbols: [], themes: [], emotions: [], share_handle: 'star', created_at: '2026-03-01' }], error: null })
    setTable('shared_dreams', c)

    const reactionsChain = chain()
    reactionsChain.in.mockImplementation(function (col: string, ids: string[]) {
      const result = { data: ids.includes('d1') ? [{ dream_id: 'd1', emoji: '💭' }, { dream_id: 'd1', emoji: '💭' }] : [], error: null }
      return {
        then: (resolve: Function) => { resolve(result) },
        eq: () => Promise.resolve(result),
      }
    })
    setTable('dream_reactions', reactionsChain)
    setTableWithIn('dream_interpretations', { data: [], error: null })

    const res = await feedGET(authReq(makeReq('/api/feed')))
    const json = await res.json()
    expect(json.dreams[0].reactions).toEqual([{ emoji: '💭', count: 2 }])
  })

  it('respects page parameter', async () => {
    withAuth()
    const c = chain()
    c.range.mockResolvedValue({ data: [], error: null })
    setTable('shared_dreams', c)
    const res = await feedGET(authReq(makeReq('/api/feed?page=3')))
    const json = await res.json()
    expect(json.page).toBe(3)
  })
})

describe('GET /api/feed/friends', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await friendsGET(makeReq('/api/feed/friends'))
    expect(res.status).toBe(401)
  })

  it('returns empty when following no one', async () => {
    withAuth()
    const c = chain()
    c.eq.mockResolvedValue({ data: [], error: null })
    setTable('follows', c)
    const res = await friendsGET(authReq(makeReq('/api/feed/friends')))
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.dreams).toEqual([])
  })

  it('returns dreams from followed users', async () => {
    withAuth()
    const followsChain = chain()
    followsChain.eq.mockResolvedValue({ data: [{ following_id: 'u2' }], error: null })
    setTable('follows', followsChain)

    const dreamsChain = chain()
    dreamsChain.range.mockResolvedValue({
      data: [{ id: 'd1', user_id: 'u2', dream_id: 'dr1', dream_data: {}, symbols: [], themes: [], emotions: [], share_handle: 'luna', created_at: '2026-03-01' }],
      error: null,
    })
    setTable('shared_dreams', dreamsChain)

    setTableWithIn('dream_reactions', { data: [], error: null })
    setTableWithIn('dream_interpretations', { data: [], error: null })

    const res = await friendsGET(authReq(makeReq('/api/feed/friends')))
    const json = await res.json()
    expect(json.dreams[0].share_handle).toBe('luna')
  })
})

describe('GET /api/similar/[dreamId]', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await similarGET(makeReq('/api/similar/d1'), { params: { dreamId: 'd1' } })
    expect(res.status).toBe(401)
  })

  it('returns 404 when dream not found', async () => {
    withAuth()
    const c = chain()
    c.single.mockResolvedValue({ data: null, error: null })
    setTable('shared_dreams', c)
    const res = await similarGET(authReq(makeReq('/api/similar/d1')), { params: { dreamId: 'd1' } })
    expect(res.status).toBe(404)
  })

  it('returns 500 when database unavailable', async () => {
    withAuth()
    getSupabaseFn.mockReturnValue(null)
    const res = await similarGET(authReq(makeReq('/api/similar/d1')), { params: { dreamId: 'd1' } })
    expect(res.status).toBe(500)
  })

  it('sorts similar dreams by symbol/theme overlap descending', async () => {
    withAuth()
    const c = chain()
    c.single.mockResolvedValueOnce({ data: { symbols: ['water'], themes: ['depth'] }, error: null })
    c.limit.mockResolvedValueOnce({
      data: [
        { id: 'd2', user_id: 'u1', dream_id: 'dr2', dream_data: {}, symbols: ['water', 'ocean'], themes: ['depth'], emotions: [], share_handle: 'luna', created_at: '2026-03-01' },
        { id: 'd3', user_id: 'u2', dream_id: 'dr3', dream_data: {}, symbols: ['fire'], themes: ['power'], emotions: [], share_handle: 'sol', created_at: '2026-03-01' },
      ],
      error: null,
    })
    setTable('shared_dreams', c)

    setTableWithInDouble('dream_reactions',
      { data: [], error: null },
      { data: [], error: null }
    )
    setTableWithIn('dream_interpretations', { data: [], error: null })

    const res = await similarGET(authReq(makeReq('/api/similar/d1')), { params: { dreamId: 'd1' } })
    const json = await res.json()
    expect(json.dreams[0].share_handle).toBe('luna')
    expect(json.dreams[0].similarity).toBeGreaterThan(json.dreams[1].similarity)
  })
})

describe('GET /api/profile/[handle]', () => {
  it('returns profile with counts', async () => {
    const c = chain()
    c.single.mockResolvedValue({ data: { id: 'p1', user_id: 'u1', handle: 'starwalker' }, error: null })
    setTable('user_profiles', c)

    const followsChain = chain()
    followsChain.eq.mockResolvedValueOnce({ count: 10, error: null })
    followsChain.eq.mockResolvedValueOnce({ count: 5, error: null })
    setTable('follows', followsChain)

    const dreamsChain = chain()
    dreamsChain.eq.mockResolvedValueOnce({ count: 3, error: null })
    setTable('shared_dreams', dreamsChain)

    const res = await profileGET(makeReq('/api/profile/starwalker'), { params: { handle: 'starwalker' } })
    const json = await res.json()
    expect(json.profile.handle).toBe('starwalker')
    expect(json.profile.follower_count).toBe(10)
    expect(json.profile.following_count).toBe(5)
    expect(json.profile.shared_dream_count).toBe(3)
  })

  it('returns 404 when handle not found', async () => {
    const c = chain()
    c.single.mockResolvedValue({ data: null, error: {} })
    setTable('user_profiles', c)
    const res = await profileGET(makeReq('/api/profile/nobody'), { params: { handle: 'nobody' } })
    expect(res.status).toBe(404)
  })

  it('returns 500 when database unavailable', async () => {
    getSupabaseFn.mockReturnValue(null)
    const res = await profileGET(makeReq('/api/profile/starwalker'), { params: { handle: 'starwalker' } })
    expect(res.status).toBe(500)
  })
})

describe('POST /api/profile/follow/[handle]', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await followPOST(makeReq('/api/profile/follow/starwalker', 'POST'), { params: { handle: 'starwalker' } })
    expect(res.status).toBe(401)
  })

  it('returns 400 when following self', async () => {
    withAuth()
    const c = chain()
    c.single.mockResolvedValue({ data: { user_id: 'user-1' }, error: null })
    setTable('user_profiles', c)
    const res = await followPOST(authReq(makeReq('/api/profile/follow/starwalker', 'POST')), { params: { handle: 'starwalker' } })
    expect(res.status).toBe(400)
  })

  it('follows successfully when not already following', async () => {
    withAuth()
    const profileChain = chain()
    profileChain.single.mockResolvedValue({ data: { user_id: 'user-2' }, error: null })
    setTable('user_profiles', profileChain)

    const followsChain = chain()
    followsChain.single.mockResolvedValue({ data: null, error: null })
    setTable('follows', followsChain)

    const res = await followPOST(authReq(makeReq('/api/profile/follow/starwalker', 'POST')), { params: { handle: 'starwalker' } })
    expect(res.status).toBe(200)
    expect((await res.json()).following).toBe(true)
  })

  it('unfollows when already following', async () => {
    withAuth()
    const profileChain = chain()
    profileChain.single.mockResolvedValue({ data: { user_id: 'user-2' }, error: null })
    setTable('user_profiles', profileChain)

    const followsChain = chain()
    followsChain.single.mockResolvedValue({ data: { follower_id: 'user-1', following_id: 'user-2' }, error: null })
    setTable('follows', followsChain)

    const res = await followPOST(authReq(makeReq('/api/profile/follow/starwalker', 'POST')), { params: { handle: 'starwalker' } })
    expect(res.status).toBe(200)
    expect((await res.json()).following).toBe(false)
  })
})

describe('POST /api/dreams/[id]/react', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await reactPOST(makeReq('/api/dreams/d1/react', 'POST', { emoji: '💭' }), { params: { id: 'd1' } })
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid emoji', async () => {
    withAuth()
    const res = await reactPOST(authReq(makeReq('/api/dreams/d1/react', 'POST', { emoji: '❌' })), { params: { id: 'd1' } })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toContain('Invalid reaction')
  })

  it('adds reaction when not already reacted', async () => {
    withAuth()
    const c = chain()
    c.single.mockResolvedValue({ data: null, error: null })
    setTable('dream_reactions', c)
    const res = await reactPOST(authReq(makeReq('/api/dreams/d1/react', 'POST', { emoji: '💭' })), { params: { id: 'd1' } })
    expect(res.status).toBe(200)
    expect((await res.json()).reacted).toBe(true)
  })

  it('removes reaction when already reacted', async () => {
    withAuth()
    const c = chain()
    c.single.mockResolvedValue({ data: { id: 'r1' }, error: null })
    setTable('dream_reactions', c)
    const res = await reactPOST(authReq(makeReq('/api/dreams/d1/react', 'POST', { emoji: '💭' })), { params: { id: 'd1' } })
    expect(res.status).toBe(200)
    expect((await res.json()).reacted).toBe(false)
  })
})

describe('POST /api/dreams/[id]/interpret', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await interpretPOST(makeReq('/api/dreams/d1/interpret', 'POST', { text: 'Nice dream.' }), { params: { id: 'd1' } })
    expect(res.status).toBe(401)
  })

  it('returns 400 when text is empty', async () => {
    withAuth()
    const res = await interpretPOST(authReq(makeReq('/api/dreams/d1/interpret', 'POST', { text: '' })), { params: { id: 'd1' } })
    expect(res.status).toBe(400)
  })

  it('returns 400 when text exceeds 500 chars', async () => {
    withAuth()
    const res = await interpretPOST(authReq(makeReq('/api/dreams/d1/interpret', 'POST', { text: 'x'.repeat(501) })), { params: { id: 'd1' } })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toContain('500')
  })

  it('returns 400 when profile not found', async () => {
    withAuth()
    const c = chain()
    c.single.mockResolvedValue({ data: null, error: { message: 'not found' } })
    setTable('user_profiles', c)
    const res = await interpretPOST(authReq(makeReq('/api/dreams/d1/interpret', 'POST', { text: 'Nice dream.' })), { params: { id: 'd1' } })
    expect(res.status).toBe(400)
  })

  it('posts interpretation successfully', async () => {
    withAuth()
    const profileChain = chain()
    profileChain.single.mockResolvedValue({ data: { user_id: 'user-1', handle: 'starwalker' }, error: null })
    setTable('user_profiles', profileChain)

    const interpChain = chain()
    interpChain.single.mockResolvedValue({ data: { id: 'i1', handle: 'starwalker', text: 'Beautiful.' }, error: null })
    setTable('dream_interpretations', interpChain)

    const res = await interpretPOST(authReq(makeReq('/api/dreams/d1/interpret', 'POST', { text: 'Beautiful.' })), { params: { id: 'd1' } })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.interpretation.handle).toBe('starwalker')
    expect(json.interpretation.text).toBe('Beautiful.')
  })
})
