'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { pullState } from '@/lib/cloud-state'

// On load and on sign-in: bring this browser up to date with the account copy.
export default function CloudSync() {
  useEffect(() => {
    if (!supabase) return
    const run = () => pullState().then(changed => { if (changed) location.reload() }).catch(() => {})
    run()
    const { data } = supabase.auth.onAuthStateChange(event => { if (event === 'SIGNED_IN') run() })
    return () => data.subscription.unsubscribe()
  }, [])
  return null
}
