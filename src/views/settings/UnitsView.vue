<template>
  <div class="w-full space-y-4">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <router-link to="/settings" class="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-slate-800/60 text-slate-400 transition hover:text-slate-100">
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </router-link>
      <div class="flex-1">
        <h1 class="text-xl font-bold text-slate-100">Units</h1>
      </div>
      <button
        class="flex items-center gap-1.5 rounded-xl bg-sky-400/10 px-3 py-2 text-sm font-medium text-sky-300 transition hover:bg-sky-400/20"
        @click="openAdd"
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add
      </button>
    </div>

    <!-- Loading -->
    <div v-if="unitTypesStore.loading || unitsStore.loading" class="flex items-center justify-center py-12 text-slate-400 text-sm">Loading…</div>

    <!-- Grouped list -->
    <template v-else>
      <div v-if="unitsStore.units.length === 0" class="rounded-2xl border border-white/10 bg-slate-900/40 px-5 py-10 text-center text-slate-400 text-sm">
        No units yet. Add one above.
      </div>

      <div v-for="ut in unitTypesStore.sorted" :key="ut.id" class="space-y-2">
        <p class="px-1 text-xs font-semibold uppercase tracking-widest text-slate-500">{{ ut.label }}</p>
        <div
          v-for="unit in unitsStore.forType(ut.id)"
          :key="unit.id"
          class="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3"
        >
          <span class="w-12 text-center text-sm font-bold text-sky-300">{{ unit.symbol }}</span>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-slate-100">{{ unit.label }}</p>
            <p class="text-xs text-slate-500">base factor: {{ unit.base_factor }}</p>
          </div>
          <button class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-sky-400/10 hover:text-sky-300" @click="openEdit(unit)">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-400/10 hover:text-red-400" @click="confirmDelete(unit)">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
        <div v-if="unitsStore.forType(ut.id).length === 0" class="rounded-xl border border-white/5 bg-slate-900/30 px-4 py-3 text-xs text-slate-500">
          No units for this type yet.
        </div>
      </div>
    </template>

    <!-- Add / Edit Modal -->
    <Modal :show="showForm" @close="closeForm">
      <h2 class="mb-5 text-lg font-semibold text-slate-100">{{ editing ? 'Edit Unit' : 'Add Unit' }}</h2>
      <div class="space-y-4">
        <FormSelect v-model="form.unitTypeId" label="Unit Type" :options="unitTypeOptions" placeholder="Select a type…" />
        <FormInput v-model="form.symbol" label="Symbol" placeholder="e.g. kg" :maxlength="10" />
        <FormInput v-model="form.label" label="Label" placeholder="e.g. Kilogram" :maxlength="40" />
        <FormInput v-model="form.baseFactor" label="Base Factor" type="number" placeholder="e.g. 1000" />
      </div>
      <div class="mt-6 flex gap-3">
        <button class="flex-1 rounded-2xl border border-white/10 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5" @click="closeForm">Cancel</button>
        <button
          class="flex-1 rounded-2xl bg-sky-400/10 py-3 text-sm font-semibold text-sky-300 transition hover:bg-sky-400/20 disabled:opacity-40"
          :disabled="saving || !form.symbol.trim() || !form.label.trim() || !form.unitTypeId"
          @click="save"
        >
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </Modal>

    <!-- Delete Confirm Modal -->
    <Modal :show="showDelete" @close="showDelete = false">
      <h2 class="mb-2 text-lg font-semibold text-slate-100">Delete Unit?</h2>
      <p class="mb-6 text-sm text-slate-400">
        "<span class="text-slate-200">{{ deleteTarget?.label }}</span>" will be permanently removed.
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
import { ref, reactive, computed, onMounted } from 'vue'
import Modal from '../../components/Modal.vue'
import FormInput from '../../components/FormInput.vue'
import FormSelect from '../../components/FormSelect.vue'
import { useUnitTypesStore } from '../../stores/unitTypes'
import { useUnitsStore } from '../../stores/units'
import type { Unit } from '../../types'

const unitTypesStore = useUnitTypesStore()
const unitsStore = useUnitsStore()

const unitTypeOptions = computed(() =>
  unitTypesStore.sorted.map(ut => ({ value: ut.id, label: ut.label }))
)

const showForm = ref(false)
const showDelete = ref(false)
const saving = ref(false)
const editing = ref<Unit | null>(null)
const deleteTarget = ref<Unit | null>(null)

const form = reactive({ unitTypeId: '', symbol: '', label: '', baseFactor: '1' })

function openAdd() {
  editing.value = null
  form.unitTypeId = unitTypesStore.sorted[0]?.id ?? ''
  form.symbol = ''
  form.label = ''
  form.baseFactor = '1'
  showForm.value = true
}

function openEdit(unit: Unit) {
  editing.value = unit
  form.unitTypeId = unit.unit_type_id
  form.symbol = unit.symbol
  form.label = unit.label
  form.baseFactor = String(unit.base_factor)
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editing.value = null
}

async function save() {
  saving.value = true
  try {
    const payload = {
      unitTypeId: form.unitTypeId,
      symbol: form.symbol,
      label: form.label,
      baseFactor: Number(form.baseFactor),
    }
    if (editing.value) {
      await unitsStore.update(editing.value.id, payload)
    } else {
      await unitsStore.create(payload)
    }
    closeForm()
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

function confirmDelete(unit: Unit) {
  deleteTarget.value = unit
  showDelete.value = true
}

async function doDelete() {
  if (!deleteTarget.value) return
  saving.value = true
  try {
    await unitsStore.remove(deleteTarget.value.id)
    showDelete.value = false
    deleteTarget.value = null
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await unitTypesStore.fetch()
  await unitsStore.fetch()
})
</script>
