'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Store } from '@/lib/types'

// Fix Leaflet default icon issue in Next.js
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const userIcon = L.divIcon({
  html: '<div style="width:16px;height:16px;background:#4A8C5C;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  className: '',
})

const storeIcon = L.divIcon({
  html: '<div style="width:32px;height:32px;background:#2B3A2B;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:14px">🍽</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
  className: '',
})

interface MapViewProps {
  stores: Store[]
  userLocation?: { lat: number; lng: number } | null
  listingCounts?: Record<string, number>
  onStoreClick?: (store: Store) => void
}

export default function MapView({ stores, userLocation, listingCounts, onStoreClick }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // CDO center
    const center: [number, number] = userLocation
      ? [userLocation.lat, userLocation.lng]
      : [8.4542, 124.6319]

    const map = L.map(containerRef.current, {
      zoomControl: false,
    }).setView(center, 14)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Update markers when stores or location changes
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer)
      }
    })

    // Add user location marker
    if (userLocation) {
      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<b>You are here</b>')
    }

    // Add store markers
    stores.forEach((store) => {
      if (!store.latitude || !store.longitude) return

      const count = listingCounts?.[store.id] ?? 0
      const categoryEmoji =
        store.category === 'bakery' ? '🍞' :
        store.category === 'restaurant' ? '🍽' :
        store.category === 'grocery' ? '🛒' :
        store.category === 'cafe' ? '☕' : '🏪'

      const icon = L.divIcon({
        html: `<div style="width:36px;height:36px;background:#2B3A2B;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:16px">${categoryEmoji}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
        className: '',
      })

      const marker = L.marker([store.latitude, store.longitude], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:'DM Sans',sans-serif;min-width:160px">
            <b style="font-size:14px;color:#2B3A2B">${store.name}</b>
            <br><span style="font-size:11px;color:#5C6B3C">${store.category}</span>
            <br><span style="font-size:11px;color:#666">${store.address}</span>
            ${count > 0 ? `<br><span style="font-size:12px;color:#C9A84C;font-weight:600">${count} deal${count > 1 ? 's' : ''} available</span>` : ''}
          </div>
        `)

      if (onStoreClick) {
        marker.on('click', () => onStoreClick(store))
      }
    })
  }, [stores, userLocation, listingCounts, onStoreClick])

  return (
    <div
      ref={containerRef}
      className="w-full rounded-2xl overflow-hidden"
      style={{ height: 'calc(100vh - 220px)' }}
    />
  )
}
