import { useQuery } from '@tanstack/react-query'
import { championIcon, loadStaticData, type StaticData } from './ddragon'

/**
 * Données statiques du jeu (icônes, noms en français). Chargées une seule fois par session.
 */
export function useStaticData(): StaticData | undefined {
  const { data } = useQuery({ queryKey: ['ddragon'], queryFn: loadStaticData, staleTime: Infinity, gcTime: Infinity })
  return data
}

export function useChampion(championName: string): { name: string; icon: string | undefined } {
  const data = useStaticData()
  return {
    name: data?.champions.get(championName) ?? championName,
    icon: data ? championIcon(data.version, championName) : undefined,
  }
}
