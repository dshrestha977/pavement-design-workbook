/**
 * Global project state (Zustand) with localStorage persistence. Holds every
 * input across the workbook so data flows between modules, and survives reload.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ProjectMeta {
  name: string
  client: string
  location: string
  designer: string
  date: string
  roadClass: string
  notes: string
}

export interface TrafficState {
  initialCVPD: number
  growthRatePct: number
  designLifeYears: number
  laneDistributionFactor: number
  vdf: number
  directionalDistribution: number
}

export interface SubgradeState {
  samples: number[]
  method: 'mean' | 'percentile'
  percentile: number
  mrCorrelation: 'irc' | 'aashto'
  manualCBR: number | null
}

export interface MaterialsState {
  acModulus: number
  baseModulus: number
  subbaseModulus: number
  a1: number
  a2: number
  a3: number
  m2: number
  m3: number
  fck: number
  flexuralStrength: number
  concreteEc: number
}

export interface AashtoFlexState {
  reliabilityPct: number
  s0: number
  p0: number
  pt: number
  minSurfaceMm: number
  minBaseMm: number
  minSubbaseMm: number
}

export interface AashtoRigidState {
  reliabilityPct: number
  s0: number
  p0: number
  pt: number
  J: number
  Cd: number
}

export interface Irc37State {
  epsilonT: number
  epsilonV: number
  Va: number
  Vbe: number
  acMm: number
  baseMm: number
  subbaseMm: number
  reliability: 0 | 80 | 90 // 0 = auto from msa
}

export interface Irc58State {
  slabThicknessMm: number
  wheelLoadKn: number
  tyrePressureMPa: number
  deltaT: number
  slabLengthMm: number
  laneWidthMm: number
  axleRepetitions: number
  feStress: number | null
}

export interface CombinedState {
  mode: 'flexible' | 'rigid'
  snEffective: number
  overlayCoeff: number
  slabEffectiveMm: number
}

export interface ProjectData {
  meta: ProjectMeta
  traffic: TrafficState
  subgrade: SubgradeState
  materials: MaterialsState
  aashtoFlex: AashtoFlexState
  aashtoRigid: AashtoRigidState
  irc37: Irc37State
  irc58: Irc58State
  combined: CombinedState
}

export type ThemeMode = 'dark' | 'light'

export interface ProjectStore extends ProjectData {
  theme: ThemeMode
  patch: <K extends keyof ProjectData>(section: K, value: Partial<ProjectData[K]>) => void
  setSamples: (samples: number[]) => void
  toggleTheme: () => void
  reset: () => void
}

const today = new Date().toISOString().slice(0, 10)

export const defaultData: ProjectData = {
  meta: {
    name: 'New Pavement Project',
    client: '',
    location: 'Nepal',
    designer: '',
    date: today,
    roadClass: 'National Highway',
    notes: '',
  },
  traffic: {
    initialCVPD: 1500,
    growthRatePct: 6,
    designLifeYears: 15,
    laneDistributionFactor: 0.75,
    vdf: 4.5,
    directionalDistribution: 0.5,
  },
  subgrade: {
    samples: [4, 5, 5, 6, 7, 8],
    method: 'percentile',
    percentile: 90,
    mrCorrelation: 'irc',
    manualCBR: null,
  },
  materials: {
    acModulus: 3000,
    baseModulus: 300,
    subbaseModulus: 150,
    a1: 0.44,
    a2: 0.14,
    a3: 0.11,
    m2: 1.0,
    m3: 1.0,
    fck: 40,
    flexuralStrength: 4.5,
    concreteEc: 30000,
  },
  aashtoFlex: {
    reliabilityPct: 90,
    s0: 0.45,
    p0: 4.2,
    pt: 2.5,
    minSurfaceMm: 50,
    minBaseMm: 150,
    minSubbaseMm: 150,
  },
  aashtoRigid: {
    reliabilityPct: 95,
    s0: 0.35,
    p0: 4.5,
    pt: 2.5,
    J: 3.2,
    Cd: 1.0,
  },
  irc37: {
    epsilonT: 150,
    epsilonV: 350,
    Va: 3,
    Vbe: 11.5,
    acMm: 140,
    baseMm: 250,
    subbaseMm: 200,
    reliability: 0,
  },
  irc58: {
    slabThicknessMm: 280,
    wheelLoadKn: 80,
    tyrePressureMPa: 0.8,
    deltaT: 13,
    slabLengthMm: 4500,
    laneWidthMm: 3500,
    axleRepetitions: 1_000_000,
    feStress: null,
  },
  combined: {
    mode: 'flexible',
    snEffective: 3.0,
    overlayCoeff: 0.44,
    slabEffectiveMm: 220,
  },
}

export const useProject = create<ProjectStore>()(
  persist(
    (set) => ({
      ...defaultData,
      theme: 'dark',
      patch: (section, value) =>
        set((state) => ({
          [section]: { ...(state[section] as unknown as Record<string, unknown>), ...value },
        }) as unknown as Partial<ProjectStore>),
      setSamples: (samples) => set((state) => ({ subgrade: { ...state.subgrade, samples } })),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      reset: () => set({ ...defaultData }),
    }),
    {
      name: 'paveworks-project-v1',
      version: 1,
    },
  ),
)
