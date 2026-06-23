import { create } from 'zustand'
import type { MovementMode } from '../types'

export interface ReserveAttendeeDraft {
  name: string
  phone: string
  email: string
  isGroupLeader: boolean
}

const MAX_GROUP_SIZE = 10
const MIN_GROUP_MODE_SIZE = 2

function createBlankAttendee(): ReserveAttendeeDraft {
  return { name: '', phone: '', email: '', isGroupLeader: false }
}

function withRepresentativeFallback(attendees: ReserveAttendeeDraft[]): ReserveAttendeeDraft[] {
  if (attendees.length === 0 || attendees.some((attendee) => attendee.isGroupLeader)) return attendees
  return attendees.map((attendee, index) => ({ ...attendee, isGroupLeader: index === 0 }))
}

interface ReserveSelection {
  exhibitionId: number | null
  timeSlotId: number | null
  ticketTypeId: number | null
}

interface ReserveAttendeesState {
  groupSize: number
  movementMode: MovementMode
  attendees: ReserveAttendeeDraft[]
}

interface ReserveState extends ReserveSelection, ReserveAttendeesState {
  setSelection: (selection: Partial<ReserveSelection>) => void
  selectIndividualMode: (selfAttendee: ReserveAttendeeDraft) => void
  selectGroupMode: (selfAttendee: ReserveAttendeeDraft) => void
  setGroupSize: (size: number) => void
  updateAttendee: (index: number, patch: Partial<ReserveAttendeeDraft>) => void
  setRepresentative: (index: number) => void
  reset: () => void
}

const initialSelection: ReserveSelection = { exhibitionId: null, timeSlotId: null, ticketTypeId: null }

const initialAttendeesState: ReserveAttendeesState = {
  groupSize: 1,
  movementMode: 'INDIVIDUAL',
  attendees: [createBlankAttendee()],
}

export const useReserveStore = create<ReserveState>((set) => ({
  ...initialSelection,
  ...initialAttendeesState,

  setSelection: (selection) => set((state) => ({ ...state, ...selection })),

  // 개인: 본인 1명으로 확정하되 직접 수정 가능 (계정에 값이 없으면 빈 칸으로 시작)
  selectIndividualMode: (selfAttendee) =>
    set({ movementMode: 'INDIVIDUAL', groupSize: 1, attendees: [{ ...selfAttendee, isGroupLeader: false }] }),

  // 그룹: 본인(대표) + 빈 행 1개로 시작, 최소 2명
  selectGroupMode: (selfAttendee) =>
    set({
      movementMode: 'GROUP',
      groupSize: MIN_GROUP_MODE_SIZE,
      attendees: [{ ...selfAttendee, isGroupLeader: true }, createBlankAttendee()],
    }),

  setGroupSize: (size) =>
    set((state) => {
      const groupSize = Math.max(MIN_GROUP_MODE_SIZE, Math.min(MAX_GROUP_SIZE, size))
      const attendees = state.attendees.slice(0, groupSize)
      while (attendees.length < groupSize) {
        attendees.push(createBlankAttendee())
      }
      return { groupSize, attendees: withRepresentativeFallback(attendees) }
    }),

  updateAttendee: (index, patch) =>
    set((state) => ({
      attendees: state.attendees.map((attendee, i) => (i === index ? { ...attendee, ...patch } : attendee)),
    })),

  setRepresentative: (index) =>
    set((state) => ({
      attendees: state.attendees.map((attendee, i) => ({ ...attendee, isGroupLeader: i === index })),
    })),

  reset: () => set({ ...initialSelection, ...initialAttendeesState }),
}))
