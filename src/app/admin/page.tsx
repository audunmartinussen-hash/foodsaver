'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import type { Store, Profile } from '@/lib/types'

interface StoreWithOwner extends Store {
  owner?: Profile
}

export default function AdminPage() {
  const [pendingStores, setPendingStores] = useState<StoreWithOwner[]>([])
  const [approvedStores, setApprovedStores] = useState<StoreWithOwner[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pending' | 'approved'>('pending')
  const supabase = createClient()

  const fetchStores = async () => {
    // Fetch all stores (admin RLS policy allows this)
    const { data: allStores } = await supabase
      .from('stores')
      .select('*, owner:profiles!stores_owner_id_fkey(*)')
      .order('created_at', { ascending: false })

    if (allStores) {
      setPendingStores(allStores.filter((s: StoreWithOwner) => !s.is_approved))
      setApprovedStores(allStores.filter((s: StoreWithOwner) => s.is_approved))
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchStores()
  }, [])

  const handleApprove = async (storeId: string) => {
    const { error } = await supabase
      .from('stores')
      .update({ is_approved: true })
      .eq('id', storeId)

    if (!error) fetchStores()
  }

  const handleRevoke = async (storeId: string) => {
    const { error } = await supabase
      .from('stores')
      .update({ is_approved: false })
      .eq('id', storeId)

    if (!error) fetchStores()
  }

  const handleReject = async (storeId: string) => {
    const { error } = await supabase
      .from('stores')
      .update({ is_active: false, is_approved: false })
      .eq('id', storeId)

    if (!error) fetchStores()
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-gold">{pendingStores.length}</p>
          <p className="text-xs text-dark-green/50">Pending Approval</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-success">{approvedStores.length}</p>
          <p className="text-xs text-dark-green/50">Approved Stores</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('pending')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            tab === 'pending'
              ? 'bg-dark-green text-white'
              : 'bg-white text-dark-green/50 border border-dark-green/10'
          }`}
        >
          Pending ({pendingStores.length})
        </button>
        <button
          onClick={() => setTab('approved')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            tab === 'approved'
              ? 'bg-dark-green text-white'
              : 'bg-white text-dark-green/50 border border-dark-green/10'
          }`}
        >
          Approved ({approvedStores.length})
        </button>
      </div>

      {/* Store List */}
      {tab === 'pending' ? (
        pendingStores.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">✅</p>
            <p className="font-semibold text-dark-green">No pending approvals</p>
            <p className="text-sm text-dark-green/50 mt-1">All caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingStores.map((store) => (
              <Card key={store.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-display font-semibold text-sm">{store.name}</h3>
                    <p className="text-xs text-dark-green/50">{store.address}, {store.city}</p>
                    {store.owner && (
                      <p className="text-xs text-olive mt-0.5">Owner: {store.owner.full_name}</p>
                    )}
                  </div>
                  <Badge variant="olive">{store.category}</Badge>
                </div>
                {store.description && (
                  <p className="text-xs text-dark-green/60 mb-3">{store.description}</p>
                )}
                <p className="text-[10px] text-dark-green/30 mb-3">
                  Applied: {new Date(store.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleApprove(store.id)} className="flex-1">
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleReject(store.id)} className="flex-1 !text-error !border-error">
                    Reject
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : (
        approvedStores.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">🏪</p>
            <p className="text-dark-green/50">No approved stores yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {approvedStores.map((store) => (
              <Card key={store.id} className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <h3 className="font-display font-semibold text-sm">{store.name}</h3>
                    <p className="text-xs text-dark-green/50">{store.address}</p>
                    {store.owner && (
                      <p className="text-xs text-olive mt-0.5">Owner: {store.owner.full_name}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="olive">{store.category}</Badge>
                    <Badge variant="success">Approved</Badge>
                  </div>
                </div>
                <div className="mt-2">
                  <button
                    onClick={() => handleRevoke(store.id)}
                    className="text-xs text-error/70 hover:text-error underline"
                  >
                    Revoke approval
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  )
}
