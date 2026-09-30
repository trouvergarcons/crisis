import React, { useState } from 'react';
import { X, AlertCircle, Sparkles, Send } from 'lucide-react';
import { IncidentCreatePayload, IncidentType } from '../types';

interface IncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: IncidentCreatePayload) => Promise<void>;
}

export const IncidentModal: React.FC<IncidentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [peopleAffected, setPeopleAffected] = useState(15);
  const [estimatedCasualties, setEstimatedCasualties] = useState(2);
  const [incidentType, setIncidentType] = useState<IncidentType | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !location.trim()) {
      alert('Please fill out Title, Description, and Location');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        description,
        location,
        latitude: 37.7600 + (Math.random() - 0.5) * 0.05,
        longitude: -122.4200 + (Math.random() - 0.5) * 0.05,
        people_affected: Number(peopleAffected),
        estimated_casualties: Number(estimatedCasualties),
        incident_type: incidentType ? incidentType : undefined,
      });
      // reset
      setTitle('');
      setDescription('');
      setLocation('');
      setIncidentType('');
      onClose();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to report incident');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Report Emergency Incident</h3>
              <p className="text-xs text-slate-400">Triggers multi-agent assessment and priority allocation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Incident Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chemical Vapor Leak at Pier 40"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Location Address *
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. 500 Townsend St, SOMA District"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Category
              </label>
              <select
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value as IncidentType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              >
                <option value="">Auto-infer with AI</option>
                <option value="building_collapse">Building Collapse</option>
                <option value="chemical_explosion">Chemical Explosion</option>
                <option value="fire">Fire</option>
                <option value="flood">Flood</option>
                <option value="road_accident">Road Accident</option>
                <option value="medical_emergency">Medical Emergency</option>
                <option value="earthquake">Earthquake</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                People at Risk
              </label>
              <input
                type="number"
                min="0"
                value={peopleAffected}
                onChange={(e) => setPeopleAffected(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Estimated Casualties
              </label>
              <input
                type="number"
                min="0"
                value={estimatedCasualties}
                onChange={(e) => setEstimatedCasualties(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Field Description & Details *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe observations, hazards, trapped victims, smoke, secondary collapses..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-5 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950/50 transition disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Evaluating...' : 'Dispatch to LangGraph'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
