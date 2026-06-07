/** Derived design values shared across modules (traffic, CBR, MR, k). */
import { useProject } from './project'
import { designTrafficMSA, type DesignTrafficResult } from '@/lib/traffic'
import { designCBR, cbrToMr, cbrToK, orn31SubgradeClass } from '@/lib/subgrade'

export interface Derived {
  traffic: DesignTrafficResult
  designCBR: number
  cbrSource: string
  mr: number
  k: number
  ornSubgrade: { cls: string; label: string }
}

export function useDerived(): Derived {
  const traffic = useProject((s) => s.traffic)
  const subgrade = useProject((s) => s.subgrade)

  const t = designTrafficMSA({
    initialCommercialVehiclesPerDay: traffic.initialCVPD,
    growthRatePct: traffic.growthRatePct,
    designLifeYears: traffic.designLifeYears,
    laneDistributionFactor: traffic.laneDistributionFactor,
    vehicleDamageFactor: traffic.vdf,
  })

  const computed = designCBR({ samples: subgrade.samples, method: subgrade.method, percentile: subgrade.percentile })
  const cbr = subgrade.manualCBR != null && subgrade.manualCBR > 0 ? subgrade.manualCBR : computed.designCBR
  const cbrSource = subgrade.manualCBR != null && subgrade.manualCBR > 0 ? 'Manual override' : computed.method

  return {
    traffic: t,
    designCBR: cbr,
    cbrSource,
    mr: cbrToMr(cbr, subgrade.mrCorrelation),
    k: cbrToK(cbr),
    ornSubgrade: orn31SubgradeClass(cbr),
  }
}
