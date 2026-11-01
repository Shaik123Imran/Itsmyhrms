import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getDashboardData,
  subscribeToWorkspace,
} from '../services/dashboardService'

export function useDashboardData(user, rangeDays) {
  const [state, setState] = useState({
    loading: true,
    error: null,
    data: null,
  })
  const requestRef = useRef(0)

  const load = useCallback(
    async (showLoader = true) => {
      if (!user) {
        return
      }

      const requestId = requestRef.current + 1
      requestRef.current = requestId

      if (showLoader) {
        setState((current) => ({
          ...current,
          loading: true,
          error: null,
        }))
      }

      try {
        const data = await getDashboardData(user, { rangeDays })
        if (requestRef.current !== requestId) {
          return
        }
        setState({ loading: false, error: null, data })
      } catch (error) {
        if (requestRef.current !== requestId) {
          return
        }
        setState((current) => ({
          ...current,
          loading: false,
          error: error instanceof Error ? error.message : 'Unable to load dashboard.',
        }))
      }
    },
    [user, rangeDays],
  )

  useEffect(() => {
    load(true)
  }, [load])

  useEffect(() => {
    const unsubscribe = subscribeToWorkspace(() => {
      load(false)
    })
    return unsubscribe
  }, [load])

  return {
    ...state,
    refresh: () => load(false),
    retry: () => load(true),
  }
}
