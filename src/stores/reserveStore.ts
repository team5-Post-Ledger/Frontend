import { create } from 'zustand'
import type { MovementMode } from '../types'

export interface ReserveAttendeeDraft {
  name: string
  phone: string
  email: string
  isGroupLeader: boolean
}

// 실제 인원 상한은 슬롯 정원이다(§3.2 time_slot 원자 UPDATE로 서버가 최종 검증).
// 여기서는 입력 폭주만 막는 안전 상한이며, GROUP 30명 같은 대규모 단체 예약을 막지 않는다.
const MAX_GROUP_SIZE = 200
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
  addAttendee: () => void
  removeAttendee: (index: number) => void
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

  // 개인: 본인 1명으로 시작하되 직접 수정 가능 (계정에 값이 없으면 빈 칸으로 시작).
  // INDIVIDUAL도 groupSize를 늘려 팀원을 추가할 수 있다 — 참석자별 QR 개별 발급, head_count=1(부록 A §5.3).
  selectIndividualMode: (selfAttendee) =>
    set({ movementMode: 'INDIVIDUAL', groupSize: 1, attendees: [{ ...selfAttendee, isGroupLeader: false }] }),

  // 그룹: 대표 1행만 필수로 시작한다(§5.3). 명단은 아는 만큼만 선택적으로 추가하고,
  // 대표만 QR을 발급받아 head_count=group_size로 단체 전체를 대표한다.
  selectGroupMode: (selfAttendee) =>
    set({
      movementMode: 'GROUP',
      groupSize: MIN_GROUP_MODE_SIZE,
      attendees: [{ ...selfAttendee, isGroupLeader: true }],
    }),

  setGroupSize: (size) =>
    set((state) => {
      if (state.movementMode === 'GROUP') {
        // GROUP은 인원수(head_count)와 명단행이 분리된다. 명단에 올린 인원보다 적게는 둘 수 없다.
        const minSize = Math.max(MIN_GROUP_MODE_SIZE, state.attendees.length)
        const groupSize = Math.max(minSize, Math.min(MAX_GROUP_SIZE, size))
        return { groupSize }
      }

      // INDIVIDUAL은 참석자별 개별 QR이라 groupSize === attendees.length로 항상 동기화한다.
      const groupSize = Math.max(1, Math.min(MAX_GROUP_SIZE, size))
      const attendees = state.attendees.slice(0, groupSize)
      while (attendees.length < groupSize) {
        attendees.push(createBlankAttendee())
      }
      return { groupSize, attendees }
    }),

  // 참석자 행 추가. INDIVIDUAL은 1행=1명이라 groupSize도 함께 늘어난다.
  // GROUP은 명단행만 늘리되, 명단이 기존 인원수를 넘어서면 인원수도 같이 끌어올린다.
  addAttendee: () =>
    set((state) => {
      if (state.attendees.length >= MAX_GROUP_SIZE) return state
      const attendees = withRepresentativeFallback([...state.attendees, createBlankAttendee()])
      const groupSize = state.movementMode === 'INDIVIDUAL' ? attendees.length : Math.max(state.groupSize, attendees.length)
      return { attendees, groupSize }
    }),

  // 참석자 행 삭제. 최소 1명은 유지하고, GROUP 대표 행은 삭제할 수 없다(§5.3 대표 정확히 1행).
  removeAttendee: (index) =>
    set((state) => {
      if (state.attendees.length <= 1) return state
      if (state.movementMode === 'GROUP' && state.attendees[index]?.isGroupLeader) return state
      const attendees = withRepresentativeFallback(state.attendees.filter((_, i) => i !== index))
      const groupSize = state.movementMode === 'INDIVIDUAL' ? attendees.length : state.groupSize
      return { attendees, groupSize }
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
