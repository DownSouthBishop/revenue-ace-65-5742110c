import { create } from 'zustand'
import type { Client, DashTab } from '../types'

interface AppStore {
  // Auth
  userId: string | null
  setUserId: (id: string | null) => void

  // Active client
  activeClientId: string | null
  setActiveClientId: (id: string) => void

  // UI
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void

  activeTab: DashTab
  setActiveTab: (tab: DashTab) => void

  // Modals
  showAddClientModal: boolean
  setShowAddClientModal: (show: boolean) => void

  showConfirmDelete: { type: string; id: string; label: string } | null
  setShowConfirmDelete: (data: { type: string; id: string; label: string } | null) => void

  // Inline state
  configSaved: boolean
  setConfigSaved: (v: boolean) => void

  replyTexts: Record<string, string>
  setReplyText: (phone: string, text: string) => void

  reviewsSent: Record<string, boolean>
  markReviewSent: (phone: string) => void

  vmailOpen: Record<string, boolean>
  toggleVmail: (id: string) => void

  // Phone provisioning (onboarding + add client)
  phoneSearch: string
  setPhoneSearch: (v: string) => void
  phoneResults: PhoneResult[]
  setPhoneResults: (r: PhoneResult[]) => void
  phoneSearching: boolean
  setPhoneSearching: (v: boolean) => void
  selectedPhone: PhoneResult | null
  setSelectedPhone: (r: PhoneResult | null) => void
  phoneProvisioning: boolean
  setPhoneProvisioning: (v: boolean) => void

  // Connect tab
  connectSource: string
  setConnectSource: (s: string) => void
  connectCarrier: string
  setConnectCarrier: (c: string) => void
}

export interface PhoneResult {
  number: string
  locality: string
  region: string
  price: string
}

export const useAppStore = create<AppStore>((set, get) => ({
  userId: null,
  setUserId: (id) => set({ userId: id }),

  activeClientId: null,
  setActiveClientId: (id) => set({ activeClientId: id, activeTab: 'activity' }),

  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  activeTab: 'activity',
  setActiveTab: (tab) => set({ activeTab: tab, configSaved: false }),

  showAddClientModal: false,
  setShowAddClientModal: (show) => set({ showAddClientModal: show }),

  showConfirmDelete: null,
  setShowConfirmDelete: (data) => set({ showConfirmDelete: data }),

  configSaved: false,
  setConfigSaved: (v) => set({ configSaved: v }),

  replyTexts: {},
  setReplyText: (phone, text) => set((s) => ({ replyTexts: { ...s.replyTexts, [phone]: text } })),

  reviewsSent: {},
  markReviewSent: (phone) => set((s) => ({ reviewsSent: { ...s.reviewsSent, [phone]: true } })),

  vmailOpen: {},
  toggleVmail: (id) => set((s) => ({ vmailOpen: { ...s.vmailOpen, [id]: !s.vmailOpen[id] } })),

  phoneSearch: '',
  setPhoneSearch: (v) => set({ phoneSearch: v }),
  phoneResults: [],
  setPhoneResults: (r) => set({ phoneResults: r }),
  phoneSearching: false,
  setPhoneSearching: (v) => set({ phoneSearching: v }),
  selectedPhone: null,
  setSelectedPhone: (r) => set({ selectedPhone: r }),
  phoneProvisioning: false,
  setPhoneProvisioning: (v) => set({ phoneProvisioning: v }),

  connectSource: 'iphone',
  setConnectSource: (s) => set({ connectSource: s }),
  connectCarrier: 'att',
  setConnectCarrier: (c) => set({ connectCarrier: c }),
}))
