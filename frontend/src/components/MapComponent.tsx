import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Incident, Resource } from '../types';

interface MapComponentProps {
  incidents: Incident[];
  resources: Resource[];
  selectedIncidentId?: string | null;
  onSelectIncident?: (id: string) => void;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  incidents,
  resources,
  selectedIncidentId,
  onSelectIncident,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered around San Francisco Bay Area (default coordinates of demo dataset)
    const map = L.map(mapContainerRef.current, {
      center: [37.7749, -122.4194],
      zoom: 12,
      zoomControl: true,
      attributionControl: false,
    });

    // Dark-themed tiles from CartoDB or standard OpenStreetMap
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    layerGroupRef.current = layerGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    // Add Incident Markers
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
        : '#22c55e'; // green

      const pulseClass = isCritical ? 'animate-ping opacity-75' : '';

      const markerHtml = `
        <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: ${color}; opacity: 0.3;" class="${pulseClass}"></div>
          <div style="width: 22px; height: 22px; border-radius: 50%; background-color: ${color}; border: 2px solid #ffffff; box-shadow: 0 0 10px ${color}; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; color: white;">
            !
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-incident-icon',
        html: markerHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([inc.latitude, inc.longitude], { icon: customIcon });

      const popupContent = `
        <div style="color: #0f172a; font-family: sans-serif; min-width: 180px; padding: 2px;">
          <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: ${color};">
            ${inc.priority_level} PRIORITY (${inc.priority_score})
          </div>
          <div style="font-size: 13px; font-weight: bold; margin-top: 2px;">${inc.title}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">📍 ${inc.location}</div>
          <div style="font-size: 11px; margin-top: 4px; display: flex; justify-content: space-between;">
            <span>People at Risk: <strong>${inc.people_affected}</strong></span>
            <span>Casualties: <strong>${inc.estimated_casualties}</strong></span>
          </div>
          <div style="font-size: 11px; margin-top: 4px; color: #0284c7;">
            Assigned Units: <strong>${inc.allocated_resources.length}</strong> (${inc.allocated_resources.join(', ') || 'None'})
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      if (onSelectIncident) {
        marker.on('click', () => onSelectIncident(inc.incident_id));
      }
      marker.addTo(layerGroup);
    });

    // Add Resource Markers
    resources.forEach((res) => {
      if (res.latitude === 0.0 && res.longitude === 0.0) return;

      const isUnavailable = res.status === 'unavailable';
      const isAssigned = res.status === 'assigned';

      const resColor = isUnavailable
        ? '#64748b' // gray
        : isAssigned
        ? '#3b82f6' // blue
        : '#10b981'; // green

      let emoji = '🚑';
      if (res.resource_type === 'fire_unit') emoji = '🚒';
      else if (res.resource_type === 'rescue_team') emoji = '🛟';
      else if (res.resource_type === 'medical_unit') emoji = '🏥';
      else if (res.resource_type === 'police_unit') emoji = '🚓';
      else if (res.resource_type === 'shelter') emoji = '⛺';

      const resMarkerHtml = `
        <div style="background-color: ${resColor}; border: 1.5px solid white; border-radius: 6px; padding: 2px 4px; font-size: 11px; font-weight: bold; color: white; display: flex; align-items: center; gap: 3px; box-shadow: 0 2px 5px rgba(0,0,0,0.3); white-space: nowrap;">
          <span>${emoji}</span>
          <span style="font-size: 9px;">${res.resource_id}</span>
        </div>
      `;

      const resIcon = L.divIcon({
        className: 'custom-resource-icon',
        html: resMarkerHtml,
        iconSize: [40, 20],
        iconAnchor: [20, 10],
      });

      const resMarker = L.marker([res.latitude, res.longitude], { icon: resIcon });

      const resPopup = `
        <div style="color: #0f172a; font-family: sans-serif; min-width: 160px; padding: 2px;">
          <div style="font-size: 12px; font-weight: bold;">${res.name} (${res.resource_id})</div>
          <div style="font-size: 11px; color: #475569;">Type: <strong>${res.resource_type}</strong></div>
          <div style="font-size: 11px; color: ${resColor}; font-weight: bold; margin-top: 2px;">
            Status: ${res.status.toUpperCase()}
          </div>
          <div style="font-size: 11px; margin-top: 2px; color: #64748b;">📍 ${res.location}</div>
          ${
            res.assigned_incident_id
              ? `<div style="font-size: 11px; margin-top: 2px; color: #2563eb;">Assigned to: ${res.assigned_incident_id}</div>`
              : ''
          }
        </div>
      `;

      resMarker.bindPopup(resPopup);
      resMarker.addTo(layerGroup);
    });
  }, [incidents, resources, onSelectIncident]);

  return (
    <div className="relative w-full h-[400px] rounded-xl overflow-hidden border border-slate-800 shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Legend */}
      <div className="absolute bottom-3 right-3 z-[1000] bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-lg p-2.5 text-[11px] shadow-lg text-slate-300 pointer-events-auto flex flex-col gap-1.5">
        <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1">Map Legend</div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span>Critical Incident</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
          <span>High Incident</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          <span>Assigned Unit</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Available Reserve</span>
        </div>
      </div>
    </div>
  );
};
