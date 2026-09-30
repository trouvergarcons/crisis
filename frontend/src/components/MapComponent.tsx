import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { Incident, Resource } from '../types';
import { Layers, Navigation, Eye, EyeOff, Crosshair } from 'lucide-react';

interface MapComponentProps {
  incidents: Incident[];
  resources: Resource[];
  selectedIncidentId?: string | null;
  onSelectIncident?: (id: string) => void;
}

type MapStyle = 'dark' | 'satellite' | 'voyager';

export const MapComponent: React.FC<MapComponentProps> = ({
  incidents,
  resources,
  selectedIncidentId,
  onSelectIncident,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const incidentsLayerRef = useRef<L.LayerGroup | null>(null);
  const resourcesLayerRef = useRef<L.LayerGroup | null>(null);
  const vectorsLayerRef = useRef<L.LayerGroup | null>(null);

  const [mapStyle, setMapStyle] = useState<MapStyle>('dark');
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Tile layer configs (Watermark-free, zero API key required)
  const tileConfigs: Record<MapStyle, { url: string; attribution: string; maxZoom: number; subdomains?: string }> = {
    dark: {
      url: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri &bull; Situational Operations Grid',
      maxZoom: 16,
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri World Imagery',
      maxZoom: 18,
    },
    voyager: {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    },
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered around San Francisco Bay Area (default coordinates of demo dataset)
    const map = L.map(mapContainerRef.current, {
      center: [37.7749, -122.4194],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    // Add zoom control at bottom-left
    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    // Initial Dark Tile layer
    const cfg = tileConfigs.dark;
    const tileLayer = L.tileLayer(cfg.url, {
      maxZoom: cfg.maxZoom,
      subdomains: cfg.subdomains || 'abc',
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Separate Layer Groups for clean management
    const vectorsLayer = L.layerGroup().addTo(map);
    const incidentsLayer = L.layerGroup().addTo(map);
    const resourcesLayer = L.layerGroup().addTo(map);

    vectorsLayerRef.current = vectorsLayer;
    incidentsLayerRef.current = incidentsLayer;
    resourcesLayerRef.current = resourcesLayer;
    mapInstanceRef.current = map;

    // Track mouse coordinates for tactical HUD
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setCoords({
        lat: parseFloat(e.latlng.lat.toFixed(4)),
        lng: parseFloat(e.latlng.lng.toFixed(4)),
      });
    });

    map.on('mouseout', () => {
      setCoords(null);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when style changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const cfg = tileConfigs[mapStyle];

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newTileLayer = L.tileLayer(cfg.url, {
      maxZoom: cfg.maxZoom,
      subdomains: cfg.subdomains || 'abc',
    }).addTo(map);

    newTileLayer.bringToBack();
    tileLayerRef.current = newTileLayer;
  }, [mapStyle]);

  // Fit all active markers in view
  const handleFitBounds = useCallback(() => {
    if (!mapInstanceRef.current) return;
    const points: L.LatLngTuple[] = [];

    incidents.forEach((inc) => {
      if (inc.latitude !== 0 && inc.longitude !== 0 && inc.status !== 'resolved') {
        points.push([inc.latitude, inc.longitude]);
      }
    });

    resources.forEach((res) => {
      if (res.latitude !== 0 && res.longitude !== 0) {
        points.push([res.latitude, res.longitude]);
      }
    });

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [incidents, resources]);

  // Zoom to selected incident if specified
  useEffect(() => {
    if (!selectedIncidentId || !mapInstanceRef.current) return;
    const target = incidents.find((i) => i.incident_id === selectedIncidentId);
    if (target && target.latitude !== 0 && target.longitude !== 0) {
      mapInstanceRef.current.flyTo([target.latitude, target.longitude], 14, { duration: 1.2 });
    }
  }, [selectedIncidentId, incidents]);

  // Render Markers and Dispatch Vector Lines
  useEffect(() => {
    if (!mapInstanceRef.current || !incidentsLayerRef.current || !resourcesLayerRef.current || !vectorsLayerRef.current) {
      return;
    }

    const incLayer = incidentsLayerRef.current;
    const resLayer = resourcesLayerRef.current;
    const vecLayer = vectorsLayerRef.current;

    incLayer.clearLayers();
    resLayer.clearLayers();
    vecLayer.clearLayers();

    // Map of active incidents for quick lookup
    const incidentCoordsMap = new Map<string, { lat: number; lng: number; title: string; color: string }>();

    // 1. Render Incidents
    incidents.forEach((inc) => {
      if (inc.latitude === 0.0 && inc.longitude === 0.0) return;
      if (inc.status === 'resolved') return;

      const isCritical = inc.priority_level === 'CRITICAL';
      const isHigh = inc.priority_level === 'HIGH';
      const isMedium = inc.priority_level === 'MEDIUM';

      const color = isCritical
        ? '#ef4444' // red
        : isHigh
        ? '#f97316' // orange
        : isMedium
        ? '#eab308' // yellow
        : '#10b981'; // green

      incidentCoordsMap.set(inc.incident_id, {
        lat: inc.latitude,
        lng: inc.longitude,
        title: inc.title,
        color,
      });

      // Pulse ring for high & critical incidents
      const pulseHtml = isCritical
        ? `<div class="radar-ring-red" style="position: absolute; inset: -14px; border-radius: 50%; border: 2px solid ${color}; pointer-events: none;"></div>
           <div class="radar-ring-red" style="animation-delay: 1.1s; position: absolute; inset: -14px; border-radius: 50%; border: 1.5px solid ${color}; pointer-events: none;"></div>`
        : isHigh
        ? `<div class="radar-ring-orange" style="position: absolute; inset: -10px; border-radius: 50%; border: 2px solid ${color}; pointer-events: none;"></div>`
        : '';

      const markerHtml = `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          ${pulseHtml}
          <div style="
            position: relative;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: radial-gradient(circle at 35% 35%, #ffffff 0%, ${color} 60%, #000000 100%);
            border: 2px solid #ffffff;
            box-shadow: 0 0 16px ${color}, 0 0 30px ${color}80;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            font-weight: 900;
            color: #ffffff;
            text-shadow: 0 1px 3px rgba(0,0,0,0.8);
          ">
            !
          </div>
          ${
            inc.estimated_casualties > 0
              ? `<div style="
                  position: absolute;
                  top: -5px;
                  right: -5px;
                  background: #dc2626;
                  color: white;
                  font-size: 9px;
                  font-weight: 800;
                  padding: 1px 4px;
                  border-radius: 9999px;
                  border: 1px solid white;
                  box-shadow: 0 2px 5px rgba(0,0,0,0.5);
                ">+${inc.estimated_casualties}</div>`
              : ''
          }
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-incident-icon',
        html: markerHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([inc.latitude, inc.longitude], { icon: customIcon });

      const popupContent = `
        <div style="min-width: 220px; font-family: sans-serif;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px; margin-bottom: 6px;">
            <span style="font-size: 10px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; color: ${color}; display: flex; align-items: center; gap: 4px;">
              <span style="width: 7px; height: 7px; border-radius: 50%; background: ${color};"></span>
              ${inc.priority_level} PRIORITY
            </span>
            <span style="font-size: 11px; font-family: monospace; font-weight: 700; color: #94a3b8;">
              SCORE: ${inc.priority_score.toFixed(1)}
            </span>
          </div>

          <div style="font-size: 13px; font-weight: 700; color: #f8fafc; line-height: 1.3;">
            ${inc.title}
          </div>

          <div style="font-size: 11px; color: #94a3b8; margin-top: 3px; display: flex; align-items: center; gap: 4px;">
            <span>📍</span> <span>${inc.location}</span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 8px; background: rgba(0,0,0,0.3); padding: 6px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); font-size: 10px;">
            <div>
              <span style="color: #64748b; display: block;">At Risk:</span>
              <strong style="color: #f1f5f9; font-size: 12px;">${inc.people_affected}</strong>
            </div>
            <div>
              <span style="color: #64748b; display: block;">Casualties:</span>
              <strong style="color: ${inc.estimated_casualties > 0 ? '#f87171' : '#34d399'}; font-size: 12px;">
                ${inc.estimated_casualties}
              </strong>
            </div>
          </div>

          <div style="margin-top: 8px;">
            <div style="font-size: 10px; color: #38bdf8; font-weight: 600; text-transform: uppercase;">
              Assigned Field Units (${inc.allocated_resources.length}):
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
              ${
                inc.allocated_resources.length > 0
                  ? inc.allocated_resources
                      .map(
                        (r) =>
                          `<span style="background: rgba(56, 189, 248, 0.15); color: #7dd3fc; border: 1px solid rgba(56, 189, 248, 0.3); padding: 1px 5px; border-radius: 4px; font-size: 9px; font-family: monospace; font-weight: bold;">${r}</span>`
                      )
                      .join('')
                  : '<span style="color: #fbbf24; font-size: 10px; font-style: italic;">Resource deficit &bull; Standby for replan</span>'
              }
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 300 });
      if (onSelectIncident) {
        marker.on('click', () => onSelectIncident(inc.incident_id));
      }
      marker.addTo(incLayer);
    });

    // 2. Render Resources & Dispatch Vectors
    resources.forEach((res) => {
      if (res.latitude === 0.0 && res.longitude === 0.0) return;

      const isUnavailable = res.status === 'unavailable';
      const isAssigned = res.status === 'assigned';

      const resColor = isUnavailable
        ? '#64748b' // slate/gray
        : isAssigned
        ? '#0ea5e9' // sky blue
        : '#10b981'; // emerald green

      let iconSymbol = '🚑';
      let typeLabel = 'MED';
      if (res.resource_type === 'fire_unit') {
        iconSymbol = '🚒';
        typeLabel = 'FIRE';
      } else if (res.resource_type === 'rescue_team') {
        iconSymbol = '🛟';
        typeLabel = 'RESCUE';
      } else if (res.resource_type === 'medical_unit') {
        iconSymbol = '🏥';
        typeLabel = 'SURG';
      } else if (res.resource_type === 'police_unit') {
        iconSymbol = '🚓';
        typeLabel = 'TAC';
      } else if (res.resource_type === 'shelter') {
        iconSymbol = '⛺';
        typeLabel = 'SHELTER';
      }

      // Draw Dispatch Vector Polyline with Live ETA & Trajectory if assigned
      if (showVectors && isAssigned && res.assigned_incident_id) {
        const targetInc = incidentCoordsMap.get(res.assigned_incident_id);
        if (targetInc) {
          // Haversine distance in km
          const R = 6371;
          const dLat = ((targetInc.lat - res.latitude) * Math.PI) / 180;
          const dLon = ((targetInc.lng - res.longitude) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((res.latitude * Math.PI) / 180) *
              Math.cos((targetInc.lat * Math.PI) / 180) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distKm = parseFloat((R * c).toFixed(1));
          const etaMinutes = Math.max(2, Math.round((distKm / 45) * 60)); // emergency speed 45km/h

          const polyline = L.polyline(
            [
              [res.latitude, res.longitude],
              [targetInc.lat, targetInc.lng],
            ],
            {
              color: resColor,
              weight: 2.5,
              opacity: 0.85,
              className: 'animated-vector-line',
            }
          );

          polyline.bindTooltip(
            `<strong>${res.name} (${res.resource_id})</strong><br/>En Route: ${targetInc.title}<br/>📍 Distance: ${distKm} km | ⏱️ ETA: ${etaMinutes} min`,
            { sticky: true, className: 'tactical-tooltip' }
          );

          polyline.addTo(vecLayer);

          // Add Midpoint Live ETA Badge along vector
          const midLat = (res.latitude + targetInc.lat) / 2;
          const midLng = (res.longitude + targetInc.lng) / 2;
          const etaBadgeHtml = `
            <div style="
              background: rgba(11, 17, 33, 0.94);
              border: 1px solid ${resColor};
              border-radius: 9999px;
              padding: 1px 6px;
              font-family: monospace;
              font-size: 8px;
              font-weight: 800;
              color: #f1f5f9;
              white-space: nowrap;
              box-shadow: 0 2px 8px rgba(0,0,0,0.8);
              display: flex;
              align-items: center;
              gap: 3px;
              pointer-events: none;
            ">
              <span style="color: ${resColor}; font-size: 9px;">${iconSymbol}</span>
              <span style="color: #38bdf8;">${etaMinutes}m</span>
            </div>
          `;
          const etaIcon = L.divIcon({
            html: etaBadgeHtml,
            className: 'eta-badge-icon',
            iconSize: [52, 16],
            iconAnchor: [26, 8],
          });
          L.marker([midLat, midLng], { icon: etaIcon, interactive: false }).addTo(vecLayer);
        }
      }

      const resMarkerHtml = `
        <div style="
          background: rgba(15, 23, 42, 0.95);
          border: 1.5px solid ${resColor};
          box-shadow: 0 0 10px ${resColor}60, 0 4px 12px rgba(0,0,0,0.6);
          border-radius: 6px;
          padding: 2px 5px;
          font-size: 10px;
          color: white;
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
          cursor: pointer;
          backdrop-filter: blur(8px);
        ">
          <span style="font-size: 11px;">${iconSymbol}</span>
          <span style="font-family: monospace; font-weight: 800; color: #f1f5f9; font-size: 9px;">${res.resource_id}</span>
          <span style="
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: ${resColor};
            box-shadow: 0 0 5px ${resColor};
          "></span>
        </div>
      `;

      const resIcon = L.divIcon({
        className: 'custom-resource-icon',
        html: resMarkerHtml,
        iconSize: [60, 22],
        iconAnchor: [30, 11],
      });

      const resMarker = L.marker([res.latitude, res.longitude], { icon: resIcon });

      const resPopup = `
        <div style="min-width: 200px; font-family: sans-serif;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; margin-bottom: 6px;">
            <span style="font-size: 10px; font-family: monospace; font-weight: 800; color: ${resColor};">
              ${res.resource_id} &bull; ${typeLabel}
            </span>
            <span style="
              font-size: 9px;
              font-weight: 700;
              text-transform: uppercase;
              padding: 1px 6px;
              border-radius: 4px;
              background: ${resColor}25;
              color: ${resColor};
              border: 1px solid ${resColor}50;
            ">
              ${res.status}
            </span>
          </div>

          <div style="font-size: 13px; font-weight: 700; color: #f8fafc;">${res.name}</div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 3px;">📍 ${res.location}</div>

          ${
            res.assigned_incident_id
              ? `<div style="
                  margin-top: 8px;
                  background: rgba(14, 165, 233, 0.15);
                  border: 1px solid rgba(14, 165, 233, 0.3);
                  padding: 5px 8px;
                  border-radius: 6px;
                  font-size: 11px;
                  color: #7dd3fc;
                ">
                  <strong>Assigned to:</strong> ${res.assigned_incident_id}
                </div>`
              : `<div style="margin-top: 6px; font-size: 10px; color: #34d399;">
                  Ready in staging reserve. Available for emergency dispatch.
                </div>`
          }
        </div>
      `;

      resMarker.bindPopup(resPopup, { maxWidth: 280 });
      resMarker.addTo(resLayer);
    });
  }, [incidents, resources, showVectors, onSelectIncident]);

  // Metric counts for legend
  const criticalCount = incidents.filter((i) => i.priority_level === 'CRITICAL' && i.status !== 'resolved').length;
  const highCount = incidents.filter((i) => i.priority_level === 'HIGH' && i.status !== 'resolved').length;
  const assignedUnits = resources.filter((r) => r.status === 'assigned').length;
  const reserveUnits = resources.filter((r) => r.status === 'available').length;

  return (
    <div className="relative w-full h-[440px] rounded-xl overflow-hidden border border-sky-500/20 shadow-2xl shadow-black/80 hud-panel">
      {/* Corner Brackets for Tactical Defense Look */}
      <div className="corner-bracket-tl" />
      <div className="corner-bracket-tr" />
      <div className="corner-bracket-bl" />
      <div className="corner-bracket-br" />

      {/* Leaflet DOM Node */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Map HUD Controls: Style Switcher & Vector Lines Toggle */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2 pointer-events-auto">
        {/* Style Selector Buttons */}
        <div className="flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg p-1 shadow-lg text-[11px]">
          <span className="px-2 py-0.5 text-slate-400 font-semibold flex items-center gap-1">
            <Layers className="w-3 h-3 text-sky-400" />
            <span className="hidden sm:inline">LAYER:</span>
          </span>
          <button
            onClick={() => setMapStyle('dark')}
            className={`px-2 py-1 rounded font-medium transition ${
              mapStyle === 'dark'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Tactical Dark
          </button>
          <button
            onClick={() => setMapStyle('satellite')}
            className={`px-2 py-1 rounded font-medium transition ${
              mapStyle === 'satellite'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setMapStyle('voyager')}
            className={`px-2 py-1 rounded font-medium transition ${
              mapStyle === 'voyager'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Light
          </button>
        </div>

        {/* Dispatch Vector Toggle */}
        <button
          onClick={() => setShowVectors(!showVectors)}
          title="Toggle vector lines between assigned units and incident targets"
          className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border shadow-lg backdrop-blur-md transition ${
            showVectors
              ? 'bg-sky-950/80 border-sky-500/50 text-sky-300'
              : 'bg-slate-900/90 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          {showVectors ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">Dispatch Vectors</span>
        </button>
      </div>

      {/* Top Right Controls: Fit All Bounds */}
      <div className="absolute top-3 right-3 z-[1000] pointer-events-auto">
        <button
          onClick={handleFitBounds}
          title="Fit all incidents and field units in viewport"
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold shadow-lg backdrop-blur-md transition"
        >
          <Navigation className="w-3.5 h-3.5 text-sky-400" />
          <span>Fit All</span>
        </button>
      </div>

      {/* Bottom Left: Real-time Cursor Coordinates Telemetry HUD */}
      <div className="absolute bottom-3 left-14 z-[1000] pointer-events-none hidden md:flex items-center space-x-2 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 px-2.5 py-1 rounded text-[10px] font-mono text-slate-400 shadow-md">
        <Crosshair className="w-3 h-3 text-sky-400 animate-spin" style={{ animationDuration: '8s' }} />
        <span>
          LAT: <strong className="text-slate-200">{coords ? coords.lat : '37.7749'}°</strong> | LNG:{' '}
          <strong className="text-slate-200">{coords ? coords.lng : '-122.4194'}°</strong>
        </span>
      </div>

      {/* Bottom Right: High-Tech Glassmorphic Map Legend */}
      <div className="absolute bottom-3 right-3 z-[1000] bg-slate-950/90 border border-slate-800/90 backdrop-blur-xl rounded-xl p-3 text-[11px] shadow-2xl text-slate-300 pointer-events-auto flex flex-col gap-2 min-w-[170px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
          <span className="font-bold text-slate-100 uppercase tracking-wider text-[10px]">Spatial Telemetry</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
        </div>

        <div className="space-x-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="text-slate-300">Critical Priority</span>
          </div>
          <span className="font-mono text-xs font-bold text-red-400">{criticalCount}</span>
        </div>

        <div className="space-x-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_6px_#f97316]"></span>
            <span className="text-slate-300">High Priority</span>
          </div>
          <span className="font-mono text-xs font-bold text-orange-400">{highCount}</span>
        </div>

        <div className="space-x-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_6px_#38bdf8]"></span>
            <span className="text-slate-300">Assigned Units</span>
          </div>
          <span className="font-mono text-xs font-bold text-sky-400">{assignedUnits}</span>
        </div>

        <div className="space-x-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]"></span>
            <span className="text-slate-300">Ready Reserve</span>
          </div>
          <span className="font-mono text-xs font-bold text-emerald-400">{reserveUnits}</span>
        </div>
      </div>
    </div>
  );
};
