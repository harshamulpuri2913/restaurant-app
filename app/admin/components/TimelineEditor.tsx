/**
 * ============================================================================
 * TIMELINE EDITOR COMPONENT
 * ============================================================================
 * Form for editing order timeline and admin notes.
 * Allows admins to set expected completion time and add notes.
 * 
 * Features:
 * - Timeline input field
 * - Notes textarea
 * - Save/cancel actions
 */

'use client'

interface TimelineEditorProps {
  /** Current timeline value */
  timeline: string
  /** Current notes value */
  notes: string
  /** Callback when timeline changes */
  onTimelineChange: (value: string) => void
  /** Callback when notes change */
  onNotesChange: (value: string) => void
  /** Callback when save is clicked */
  onSave: () => void
  /** Callback when cancel is clicked */
  onCancel: () => void
}

export default function TimelineEditor({
  timeline,
  notes,
  onTimelineChange,
  onNotesChange,
  onSave,
  onCancel
}: TimelineEditorProps) {
  return (
    <div className="border-t-2 border-golden pt-4 space-y-4">
      {/* Timeline Input */}
      <div>
        <label className="block text-light-gold mb-2 font-traditional">
          Completion Timeline
        </label>
        <input
          type="text"
          value={timeline}
          onChange={(e) => onTimelineChange(e.target.value)}
          placeholder="e.g., Ready in 2 hours"
          className="w-full px-4 py-2 bg-traditional-brown border-2 border-golden rounded-lg text-cream"
        />
      </div>

      {/* Admin Notes */}
      <div>
        <label className="block text-light-gold mb-2 font-traditional">
          Admin Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Add notes..."
          rows={3}
          className="w-full px-4 py-2 bg-traditional-brown border-2 border-golden rounded-lg text-cream"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onSave}
          className="flex-1 bg-golden text-deep-brown py-2 rounded-lg font-bold hover:bg-light-gold transition-colors font-traditional"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-traditional-brown text-cream py-2 rounded-lg font-bold hover:bg-opacity-80 transition-colors font-traditional"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

