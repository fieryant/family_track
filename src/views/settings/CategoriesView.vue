<template>
  <div class="w-full space-y-4">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <router-link to="/settings" class="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-slate-800/60 text-slate-400 transition hover:text-slate-100">
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </router-link>
      <div class="flex-1">
        <h1 class="text-xl font-bold text-slate-100">Categories</h1>
      </div>
      <button
        class="flex items-center gap-1.5 rounded-xl bg-fuchsia-400/10 px-3 py-2 text-sm font-medium text-fuchsia-300 transition hover:bg-fuchsia-400/20"
        @click="openAdd"
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add
      </button>
    </div>

    <!-- List -->
    <div v-if="store.loading" class="flex items-center justify-center py-12 text-slate-400 text-sm">Loading…</div>

    <div v-else-if="store.sorted.length === 0" class="rounded-2xl border border-white/10 bg-slate-900/40 px-5 py-10 text-center text-slate-400 text-sm">
      No categories yet. Add one above.
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="cat in store.sorted"
        :key="cat.id"
        class="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3"
      >
        <span class="text-xl w-8 text-center">{{ cat.icon || '📦' }}</span>
        <div class="flex-1 min-w-0">
          <p class="font-medium text-slate-100">{{ cat.name }}</p>
        </div>
        <button class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-sky-400/10 hover:text-sky-300" @click="openEdit(cat)">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-400/10 hover:text-red-400" @click="confirmDelete(cat)">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </div>
    </div>

    <!-- Add / Edit Modal -->
    <Modal :show="showForm" @close="closeForm">
      <h2 class="mb-5 text-lg font-semibold text-slate-100">{{ editing ? 'Edit Category' : 'Add Category' }}</h2>
      <div class="space-y-4">
        <FormInput v-model="form.name" label="Name" placeholder="e.g. Produce" :autofocus="true" :maxlength="60" />
        <FormInput v-model="form.icon" label="Icon (emoji)" placeholder="e.g. 🥬" :maxlength="8" />
      </div>
      <div class="mt-6 flex gap-3">
        <button class="flex-1 rounded-2xl border border-white/10 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5" @click="closeForm">Cancel</button>
        <button
          class="flex-1 rounded-2xl bg-fuchsia-400/10 py-3 text-sm font-semibold text-fuchsia-300 transition hover:bg-fuchsia-400/20 disabled:opacity-40"
          :disabled="saving || !form.name.trim()"
          @click="save"
        >
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </Modal>

    <!-- Delete Confirm Modal -->
    <Modal :show="showDelete" @close="showDelete = false">
      <h2 class="mb-2 text-lg font-semibold text-slate-100">Delete Category?</h2>
      <p class="mb-6 text-sm text-slate-400">
        "<span class="text-slate-200">{{ deleteTarget?.name }}</span>" will be permanently removed. Items in this category will become uncategorized.
      </p>
      <div class="flex gap-3">
        <button class="flex-1 rounded-2xl border border-white/10 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5" @click="showDelete = false">Cancel</button>
        <button class="flex-1 rounded-2xl bg-red-500/10 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-40" :disabled="saving" @click="doDelete">
          {{ saving ? 'Deleting…' : 'Delete' }}
        </button>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import Modal from '../../components/Modal.vue'
import FormInput from '../../components/FormInput.vue'
import { useCategoriesStore } from '../../stores/categories'
import type { Category } from '../../types'

const store = useCategoriesStore()

const showForm = ref(false)
const showDelete = ref(false)
const saving = ref(false)
const editing = ref<Category | null>(null)
const deleteTarget = ref<Category | null>(null)

const form = reactive({ name: '', icon: '' })

function openAdd() {
  editing.value = null
  form.name = ''
  form.icon = ''
  showForm.value = true
}

function openEdit(cat: Category) {
  editing.value = cat
  form.name = cat.name
  form.icon = cat.icon ?? ''
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editing.value = null
}

async function save() {
  saving.value = true
  try {
    if (editing.value) {
      await store.update(editing.value.id, { name: form.name, icon: form.icon })
    } else {
      await store.create({ name: form.name, icon: form.icon })
    }
    closeForm()
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

function confirmDelete(cat: Category) {
  deleteTarget.value = cat
  showDelete.value = true
}

async function doDelete() {
  if (!deleteTarget.value) return
  saving.value = true
  try {
    await store.remove(deleteTarget.value.id)
    showDelete.value = false
    deleteTarget.value = null
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

onMounted(() => store.fetch())
</script>
