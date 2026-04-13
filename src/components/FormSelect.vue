<template>
  <div class="block">
    <div class="text-sm font-medium text-slate-200 mb-2">{{ label }}</div>

    <!-- Trigger -->
    <button
      ref="triggerRef"
      type="button"
      class="flex w-full items-center justify-between gap-2 rounded-2xl border border-white/10 bg-slate-800/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
      @click="toggle"
    >
      <span :class="selectedLabel ? 'text-slate-100' : 'text-slate-500'">
        {{ selectedLabel || placeholder }}
      </span>
      <svg
        class="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200"
        :class="open ? 'rotate-180' : ''"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>

    <!-- Dropdown portal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 scale-95 -translate-y-1"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100 scale-100 translate-y-0"
        leave-to-class="opacity-0 scale-95 -translate-y-1"
      >
        <div
          v-if="open"
          ref="dropdownRef"
          :style="dropdownStyle"
          class="fixed z-300 overflow-hidden rounded-2xl border border-white/10 bg-slate-800 shadow-2xl shadow-black/50 ring-1 ring-white/5"
        >
          <div class="max-h-60 overflow-y-auto overscroll-contain py-1">
            <button
              v-for="opt in options"
              :key="String(opt.value)"
              type="button"
              class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition"
              :class="
                isSelected(opt.value)
                  ? 'bg-cyan-400/10 text-cyan-300'
                  : 'text-slate-200 hover:bg-white/5 hover:text-slate-100'
              "
              @click="select(opt.value)"
            >
              <span
                class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition"
                :class="
                  isSelected(opt.value)
                    ? 'border-cyan-400 bg-cyan-400'
                    : 'border-slate-600'
                "
              >
                <svg v-if="isSelected(opt.value)" class="h-2.5 w-2.5 text-slate-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              {{ opt.label }}
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  modelValue: { default: '' },
  options: { type: Array, default: () => [] }, // [{ value, label }]
  placeholder: { type: String, default: 'Select…' },
})

const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const triggerRef = ref(null)
const dropdownRef = ref(null)
const dropdownStyle = ref({})

const selectedLabel = computed(() => {
  const found = props.options.find(o => String(o.value) === String(props.modelValue))
  return found?.label ?? ''
})

function isSelected(value) {
  return String(value) === String(props.modelValue)
}

function updatePosition() {
  const trigger = triggerRef.value
  if (!trigger) return
  const rect = trigger.getBoundingClientRect()
  const viewportH = window.innerHeight
  const spaceBelow = viewportH - rect.bottom - 8
  const spaceAbove = rect.top - 8
  const dropH = Math.min(props.options.length * 44 + 8, 248)

  const style = {
    left: `${rect.left}px`,
    width: `${rect.width}px`,
  }

  if (spaceBelow >= dropH || spaceBelow >= spaceAbove) {
    style.top = `${rect.bottom + 4}px`
  } else {
    style.top = `${rect.top - dropH - 4}px`
  }

  dropdownStyle.value = style
}

async function toggle() {
  if (open.value) {
    open.value = false
    return
  }
  open.value = true
  await nextTick()
  updatePosition()
}

function select(value) {
  emit('update:modelValue', value)
  open.value = false
}

function onClickOutside(e) {
  if (!open.value) return
  if (triggerRef.value?.contains(e.target)) return
  if (dropdownRef.value?.contains(e.target)) return
  open.value = false
}

function onKeydown(e) {
  if (e.key === 'Escape' && open.value) open.value = false
}

function onScroll() {
  if (open.value) updatePosition()
}

watch(open, (val) => {
  if (val) {
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKeydown)
    document.addEventListener('scroll', onScroll, true)
  } else {
    document.removeEventListener('mousedown', onClickOutside)
    document.removeEventListener('keydown', onKeydown)
    document.removeEventListener('scroll', onScroll, true)
  }
})

onUnmounted(() => {
  document.removeEventListener('mousedown', onClickOutside)
  document.removeEventListener('keydown', onKeydown)
  document.removeEventListener('scroll', onScroll, true)
})
</script>
