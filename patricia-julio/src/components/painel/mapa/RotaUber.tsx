"use client"

import { useEffect, useState } from "react"
import { Polyline, useMap } from "react-leaflet"

interface Props {
  origem: { lat: number; lon: number }
  destino: { lat: number; lon: number }
}

export function RotaUber({ origem, destino }: Props) {
  const map = useMap()
  const [geometry, setGeometry] = useState<[number, number][]>([])

  useEffect(() => {
    const fetchRota = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${origem.lon},${origem.lat};${destino.lon},${destino.lat}?overview=full&geometries=geojson`
        const res = await fetch(url)
        if (!res.ok) return
        
        const data = await res.json()
        const route = data?.routes?.[0]
        if (!route) return

        const coords = (route.geometry?.coordinates || []) as [number, number][]
        const geo = coords.map(([lon, lat]) => [lat, lon] as [number, number])
        setGeometry(geo)

        // Ajusta zoom pra mostrar a rota toda
        if (geo.length > 0) {
          map.fitBounds(geo, { padding: [80, 80], maxZoom: 14 })
        }
      } catch (err) {
        console.error("Erro ao buscar rota OSRM:", err)
      }
    }

    fetchRota()
  }, [origem, destino, map])

  if (geometry.length === 0) return null

  return (
    <>
      {/* Linha de sombra */}
      <Polyline
        positions={geometry}
        pathOptions={{
          color: "#2F4156",
          weight: 8,
          opacity: 0.3,
          lineCap: "round",
          lineJoin: "round",
        }}
      />
      
      {/* Linha principal */}
      <Polyline
        positions={geometry}
        pathOptions={{
          color: "#567C8D",
          weight: 5,
          opacity: 0.9,
          lineCap: "round",
          lineJoin: "round",
        }}
      />

      {/* Linha de destaque animada */}
      <Polyline
        positions={geometry}
        pathOptions={{
          color: "#F5EFEB",
          weight: 2,
          opacity: 0.6,
          lineCap: "round",
          lineJoin: "round",
          dashArray: "10, 10",
        }}
        className="rota-brilho"
      />

      <style jsx global>{`
        @keyframes dashAnimation {
          to {
            stroke-dashoffset: -20;
          }
        }
        
        .rota-brilho path {
          animation: dashAnimation 1s linear infinite;
        }
      `}</style>
    </>
  )
}
