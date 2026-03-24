import { useState, useEffect, useCallback } from 'react'
import { supabase, clients as clientsApi } from '../lib/supabase'
import type { Client, ClientInsert, ClientUpdate } from '../types'

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await clientsApi.list()
    setClients(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const createClient = async (insert: ClientInsert): Promise<Client> => {
    const c = await clientsApi.create(insert)
    setClients(prev => [...prev, c])
    return c
  }

  const updateClient = async (id: string, updates: ClientUpdate): Promise<Client> => {
    const c = await clientsApi.update(id, updates)
    setClients(prev => prev.map(x => x.id === id ? c : x))
    return c
  }

  const deleteClient = async (id: string) => {
    await clientsApi.deactivate(id)
    setClients(prev => prev.filter(x => x.id !== id))
  }

  return { clients, loading, error, createClient, updateClient, deleteClient, reload: load }
}
