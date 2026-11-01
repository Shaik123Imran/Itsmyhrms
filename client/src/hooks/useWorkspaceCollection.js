import { useCallback, useEffect, useState } from 'react'
import {
  getCollection,
  setCollection,
  subscribeToWorkspace,
} from '../services/workspaceStore'

export function useWorkspaceCollection(key) {
  const [value, setValue] = useState(() => getCollection(key, []))

  useEffect(() => {
    setValue(getCollection(key, []))

    const unsubscribe = subscribeToWorkspace((event) => {
      if (
        !event.detail?.key ||
        event.detail.key === key ||
        event.key === key
      ) {
        setValue(getCollection(key, []))
      }
    })

    return unsubscribe
  }, [key])

  const update = useCallback(
    (next) => {
      const current = getCollection(key, [])
      const resolved = typeof next === 'function' ? next(current) : next
      setCollection(key, resolved)
      setValue(resolved)
    },
    [key],
  )

  return [value, update]
}
