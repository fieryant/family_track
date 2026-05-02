<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useListsStore } from '../stores/lists'
import { useSessionStore } from '../stores/session'
import { useShopListStore } from '../stores/shopList'
import ShareListDialog from '../components/ShareListDialog.vue'
import type { ShoppingList } from '../types'

const listsStore = useListsStore()
const sessionStore = useSessionStore()
const shopListStore = useShopListStore()
const router = useRouter()

const showCreate = ref(false)
const newListName = ref('')
const creating = ref(false)

const showJoin = ref(false)
const joinCode = ref('')
const joining = ref(false)

const shareTarget = ref<ShoppingList | null>(null)

const confirmDeleteId = ref<string | null>(null)

const editTarget = ref<ShoppingList | null>(null)
const editName = ref('')
const savingEdit = ref(false)

async function handleCreate() {
  const name = newListName.value.trim()
  if (!name) return
  creating.value = true
  const created = await listsStore.createList(name)
  creating.value = false
  if (created) {
    newListName.value = ''
    showCreate.value = false
  }
}

async function handleJoin() {
  const code = joinCode.value.trim()
  if (!code) return
  joining.value = true
  const ok = await listsStore.joinList(code)
  joining.value = false
  if (ok) {
    joinCode.value = ''
    showJoin.value = false
  }
}

async function selectList(id: string) {
  if (listsStore.currentListId === id) {
    router.push('/')
    return
  }
  listsStore.setCurrentList(id)
  // Reset session and list state so they reload for the new list
  sessionStore.activeSession = null
  shopListStore.clearList()
  router.push('/')
}

function openEdit(list: ShoppingList) {
  editTarget.value = list
  editName.value = list.name
}

async function handleEdit() {
  if (!editTarget.value) return
  const name = editName.value.trim()
  if (!name || name === editTarget.value.name) {
    editTarget.value = null
    return
  }
  savingEdit.value = true
  await listsStore.renameList(editTarget.value.id, name)
  savingEdit.value = false
  editTarget.value = null
}

async function handleDelete(list: ShoppingList) {
  confirmDeleteId.value = null
  if (list._role === 'owner') {
    await listsStore.deleteList(list.id)
  } else {
    await listsStore.leaveList(list.id)
  }
}

onMounted(() => listsStore.fetch())
</script>

<template>
  <div class="w-full space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold text-white">My Lists</h2>
      <div class="flex gap-2">
        <button
          type="button"
          class="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
          @click="showJoin = true"
        >
          Join
        </button>
        <button
          type="button"
          class="rounded-xl bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300"
          @click="showCreate = true"
        >
          + New List
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="listsStore.loading" class="flex justify-center py-10">
      <div class="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400"></div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="listsStore.lists.length === 0"
      class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-slate-900/60 px-6 py-16 text-center"
    >
      <div class="mb-4 text-5xl opacity-50">📋</div>
      <h3 class="text-lg font-semibold text-slate-200">No lists yet</h3>
      <p class="mt-2 max-w-xs text-sm text-slate-400">Create your first shopping list or join one with an invite code.</p>
      <button
        type="button"
        class="mt-6 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
        @click="showCreate = true"
      >
        Create a List
      </button>
    </div>

    <!-- List cards -->
    <div v-else class="space-y-3">
      <div
        v-for="list in listsStore.lists"
        :key="list.id"
        class="group relative rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-lg shadow-black/20 transition"
        :class="list.id === listsStore.currentListId ? 'border-cyan-400/40 bg-cyan-400/5' : 'hover:border-white/20'"
      >
        <!-- Active indicator -->
        <div
          v-if="list.id === listsStore.currentListId"
          class="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-cyan-400/15 px-2 py-0.5 text-[10px] font-semibold text-cyan-300"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
          Active
        </div>

        <div class="flex items-start gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-xl">
            🛒
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate font-semibold text-white">{{ list.name }}</p>
            <p class="mt-0.5 text-xs text-slate-400">
              <span class="capitalize">{{ list._role }}</span>
              <span class="mx-1.5 opacity-40">·</span>
              {{ list._memberCount }} {{ list._memberCount === 1 ? 'member' : 'members' }}
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="mt-3 flex items-center gap-2">
          <button
            type="button"
            class="flex-1 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
            @click="shareTarget = list"
          >
            Share Code
          </button>
          <button
            v-if="list._role === 'owner'"
            type="button"
            class="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
            @click="openEdit(list)"
            aria-label="Rename list"
          >
            Edit
          </button>
          <button
            v-if="list.id !== listsStore.currentListId"
            type="button"
            class="flex-1 rounded-xl bg-cyan-400/15 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-400/25"
            @click="selectList(list.id)"
          >
            Switch to this
          </button>
          <button
            v-else
            type="button"
            class="flex-1 rounded-xl bg-emerald-400/15 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/25"
            @click="router.push('/')"
          >
            Open List
          </button>
          <button
            type="button"
            class="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-400 transition hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-300"
            @click="confirmDeleteId = list.id"
          >
            {{ list._role === 'owner' ? 'Delete' : 'Leave' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Error -->
    <p v-if="listsStore.error" class="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
      {{ listsStore.error }}
    </p>

    <!-- ── Create dialog ───────────────────────────────────────────────────── -->
    <Teleport to="body">
      <div
        v-if="showCreate"
        class="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
        @click.self="showCreate = false"
      >
        <div class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"></div>
        <div class="relative w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
          <h3 class="mb-4 text-base font-bold text-white">New Shopping List</h3>
          <input
            v-model="newListName"
            type="text"
            placeholder="e.g. Weekly Groceries"
            maxlength="50"
            class="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
            @keydown.enter="handleCreate"
            @keydown.escape="showCreate = false"
          />
          <div class="mt-4 flex gap-2">
            <button
              type="button"
              class="flex-1 rounded-xl border border-white/10 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5"
              @click="showCreate = false"
            >
              Cancel
            </button>
            <button
              type="button"
              :disabled="!newListName.trim() || creating"
              class="flex-1 rounded-xl bg-cyan-400 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-40"
              @click="handleCreate"
            >
              <span v-if="creating">Creating…</span>
              <span v-else>Create</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Join dialog ────────────────────────────────────────────────────── -->
    <Teleport to="body">
      <div
        v-if="showJoin"
        class="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
        @click.self="showJoin = false"
      >
        <div class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"></div>
        <div class="relative w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
          <h3 class="mb-1 text-base font-bold text-white">Join a List</h3>
          <p class="mb-4 text-xs text-slate-400">Enter the 6-character invite code shared by the list owner.</p>
          <input
            v-model="joinCode"
            type="text"
            placeholder="e.g. ABC123"
            maxlength="6"
            class="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-center font-mono text-lg uppercase tracking-widest text-white placeholder-slate-500 outline-none focus:border-fuchsia-400/50 focus:ring-2 focus:ring-fuchsia-400/20"
            @keydown.enter="handleJoin"
            @keydown.escape="showJoin = false"
          />
          <p v-if="listsStore.error" class="mt-2 text-xs text-red-400">{{ listsStore.error }}</p>
          <div class="mt-4 flex gap-2">
            <button
              type="button"
              class="flex-1 rounded-xl border border-white/10 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5"
              @click="showJoin = false"
            >
              Cancel
            </button>
            <button
              type="button"
              :disabled="joinCode.trim().length !== 6 || joining"
              class="flex-1 rounded-xl bg-fuchsia-500 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-400 disabled:opacity-40"
              @click="handleJoin"
            >
              <span v-if="joining">Joining…</span>
              <span v-else>Join</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Confirm delete/leave dialog ───────────────────────────────────── -->
    <Teleport to="body">
      <div
        v-if="confirmDeleteId"
        class="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
        @click.self="confirmDeleteId = null"
      >
        <div class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"></div>
        <div class="relative w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
          <template v-if="listsStore.lists.find(l => l.id === confirmDeleteId) as ShoppingList | undefined">
            <h3 class="mb-2 text-base font-bold text-white">
              {{ listsStore.lists.find(l => l.id === confirmDeleteId)?._role === 'owner' ? 'Delete list?' : 'Leave list?' }}
            </h3>
            <p class="mb-5 text-sm text-slate-400">
              <span v-if="listsStore.lists.find(l => l.id === confirmDeleteId)?._role === 'owner'">
                This will permanently delete <strong class="text-white">{{ listsStore.lists.find(l => l.id === confirmDeleteId)?.name }}</strong> and all its shopping history. This cannot be undone.
              </span>
              <span v-else>
                You will lose access to <strong class="text-white">{{ listsStore.lists.find(l => l.id === confirmDeleteId)?.name }}</strong>. You can rejoin later with the invite code.
              </span>
            </p>
            <div class="flex gap-2">
              <button
                type="button"
                class="flex-1 rounded-xl border border-white/10 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5"
                @click="confirmDeleteId = null"
              >
                Cancel
              </button>
              <button
                type="button"
                class="flex-1 rounded-xl bg-red-500 py-3 text-sm font-semibold text-white transition hover:bg-red-400"
                @click="handleDelete(listsStore.lists.find(l => l.id === confirmDeleteId)!)"
              >
                {{ listsStore.lists.find(l => l.id === confirmDeleteId)?._role === 'owner' ? 'Delete' : 'Leave' }}
              </button>
            </div>
          </template>
        </div>
      </div>
    </Teleport>

    <!-- ── Edit dialog ───────────────────────────────────────────────────── -->
    <Teleport to="body">
      <div
        v-if="editTarget"
        class="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
        @click.self="editTarget = null"
      >
        <div class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"></div>
        <div class="relative w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
          <h3 class="mb-4 text-base font-bold text-white">Rename List</h3>
          <input
            v-model="editName"
            type="text"
            placeholder="List name"
            maxlength="50"
            class="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
            @keydown.enter="handleEdit"
            @keydown.escape="editTarget = null"
          />
          <div class="mt-4 flex gap-2">
            <button
              type="button"
              class="flex-1 rounded-xl border border-white/10 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5"
              @click="editTarget = null"
            >
              Cancel
            </button>
            <button
              type="button"
              :disabled="!editName.trim() || savingEdit"
              class="flex-1 rounded-xl bg-cyan-400 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-40"
              @click="handleEdit"
            >
              <span v-if="savingEdit">Saving…</span>
              <span v-else>Save</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Share dialog ───────────────────────────────────────────────────── -->
    <ShareListDialog
      v-if="shareTarget"
      :list="shareTarget"
      @close="shareTarget = null"
    />
  </div>
</template>
