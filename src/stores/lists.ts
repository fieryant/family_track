import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { ShoppingList } from '../types'

const STORAGE_KEY = 'family_track_current_list'

export const useListsStore = defineStore('lists', () => {
  const lists = ref<ShoppingList[]>([])
  const currentListId = ref<string | null>(localStorage.getItem(STORAGE_KEY))
  const loading = ref(false)
  const error = ref<string | null>(null)

  const currentList = computed(() => lists.value.find(l => l.id === currentListId.value) ?? null)

  watch(currentListId, (id) => {
    if (id) localStorage.setItem(STORAGE_KEY, id)
    else localStorage.removeItem(STORAGE_KEY)
  })

  async function fetch() {
    if (!isSupabaseConfigured) {
      if (lists.value.length === 0) {
        lists.value = [{
          id: 'default-list',
          name: 'Family List',
          created_by: 'offline',
          invite_code: 'FAMILY',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          _role: 'owner',
          _memberCount: 1,
        }]
      }
      if (!currentListId.value || !lists.value.find(l => l.id === currentListId.value)) {
        currentListId.value = lists.value[0].id
      }
      return
    }

    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase!
        .from('shopping_lists')
        .select('*, list_members(role, user_id)')
        .order('created_at', { ascending: true })

      if (err) throw err

      const { data: { user } } = await supabase!.auth.getUser()

      lists.value = (data ?? []).map((row: any) => {
        const myMembership = (row.list_members as { role: string; user_id: string }[])
          ?.find(m => m.user_id === user?.id)
        const { list_members: _lm, ...rest } = row
        return {
          ...rest,
          _role: (myMembership?.role as 'owner' | 'editor') ?? 'editor',
          _memberCount: (row.list_members as unknown[])?.length ?? 0,
        } as ShoppingList
      })

      if (currentListId.value && !lists.value.find(l => l.id === currentListId.value)) {
        currentListId.value = lists.value[0]?.id ?? null
      }
      if (!currentListId.value && lists.value.length > 0) {
        currentListId.value = lists.value[0].id
      }
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function createList(name: string): Promise<ShoppingList | null> {
    if (!isSupabaseConfigured) {
      const newList: ShoppingList = {
        id: 'list-' + Date.now(),
        name,
        created_by: 'offline',
        invite_code: Math.random().toString(36).slice(2, 8).toUpperCase(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        _role: 'owner',
        _memberCount: 1,
      }
      lists.value.push(newList)
      currentListId.value = newList.id
      return newList
    }

    loading.value = true
    error.value = null
    try {
      const { data: { user } } = await supabase!.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: listData, error: listErr } = await supabase!
        .from('shopping_lists')
        .insert({ name, created_by: user.id })
        .select()
        .single()

      if (listErr) throw listErr

      const { error: memberErr } = await supabase!
        .from('list_members')
        .insert({ list_id: listData.id, user_id: user.id, role: 'owner' })

      if (memberErr) throw memberErr

      const newList: ShoppingList = { ...listData, _role: 'owner', _memberCount: 1 }
      lists.value.push(newList)
      currentListId.value = newList.id
      return newList
    } catch (e: any) {
      error.value = e.message
      return null
    } finally {
      loading.value = false
    }
  }

  async function joinList(inviteCode: string): Promise<boolean> {
    const code = inviteCode.trim().toUpperCase()

    if (!isSupabaseConfigured) {
      const found = lists.value.find(l => l.invite_code === code)
      if (found) {
        currentListId.value = found.id
        return true
      }
      error.value = 'No list found with that code'
      return false
    }

    loading.value = true
    error.value = null
    try {
      const { data: { user } } = await supabase!.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: listData, error: findErr } = await supabase!
        .from('shopping_lists')
        .select('*')
        .eq('invite_code', code)
        .single()

      if (findErr || !listData) {
        error.value = 'No list found with that code'
        return false
      }

      const alreadyMember = lists.value.find(l => l.id === listData.id)
      if (alreadyMember) {
        currentListId.value = listData.id
        return true
      }

      const { error: memberErr } = await supabase!
        .from('list_members')
        .insert({ list_id: listData.id, user_id: user.id, role: 'editor' })

      if (memberErr) throw memberErr

      const joined: ShoppingList = { ...listData, _role: 'editor', _memberCount: 0 }
      lists.value.push(joined)
      currentListId.value = joined.id
      return true
    } catch (e: any) {
      error.value = e.message
      return false
    } finally {
      loading.value = false
    }
  }

  async function leaveList(listId: string) {
    if (!isSupabaseConfigured) {
      lists.value = lists.value.filter(l => l.id !== listId)
      if (currentListId.value === listId) currentListId.value = lists.value[0]?.id ?? null
      return
    }

    const { data: { user } } = await supabase!.auth.getUser()
    if (!user) return

    await supabase!.from('list_members')
      .delete()
      .eq('list_id', listId)
      .eq('user_id', user.id)

    lists.value = lists.value.filter(l => l.id !== listId)
    if (currentListId.value === listId) currentListId.value = lists.value[0]?.id ?? null
  }

  async function deleteList(listId: string) {
    if (!isSupabaseConfigured) {
      lists.value = lists.value.filter(l => l.id !== listId)
      if (currentListId.value === listId) currentListId.value = lists.value[0]?.id ?? null
      return
    }

    await supabase!.from('shopping_lists').delete().eq('id', listId)
    lists.value = lists.value.filter(l => l.id !== listId)
    if (currentListId.value === listId) currentListId.value = lists.value[0]?.id ?? null
  }

  async function addMemberByEmail(listId: string, email: string): Promise<string | null> {
    if (!isSupabaseConfigured) {
      return 'Email invites require a Supabase connection'
    }

    const { data, error } = await supabase!.rpc('add_list_member_by_email', {
      p_list_id: listId,
      p_email: email,
    })

    if (error) return error.message
    if (data?.error) return data.error as string

    // Bump member count locally
    const idx = lists.value.findIndex(l => l.id === listId)
    if (idx !== -1) {
      lists.value[idx] = {
        ...lists.value[idx],
        _memberCount: (lists.value[idx]._memberCount ?? 1) + 1,
      }
    }

    return null // null = success
  }

  async function renameList(listId: string, name: string) {
    const idx = lists.value.findIndex(l => l.id === listId)
    if (idx === -1) return
    lists.value[idx] = { ...lists.value[idx], name }

    if (isSupabaseConfigured) {
      await supabase!.from('shopping_lists').update({ name }).eq('id', listId)
    }
  }

  function setCurrentList(id: string) {
    currentListId.value = id
  }

  return {
    lists,
    currentListId,
    currentList,
    loading,
    error,
    fetch,
    createList,
    joinList,
    leaveList,
    deleteList,
    renameList,
    addMemberByEmail,
    setCurrentList,
  }
})
