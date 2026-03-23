"use client";

import { useState } from 'react';

const DEFAULT_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#ef4444', // red
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
];

export default function ColorPicker({ value = '#10b981', onChange }) {
  const [customColor, setCustomColor] = useState(value);
  const [showCustom, setShowCustom] = useState(false);

  const handleColorSelect = (color) => {
    setCustomColor(color);
    onChange(color);
    setShowCustom(false);
  };

  const handleCustomColorChange = (e) => {
    const color = e.target.value;
    setCustomColor(color);
    onChange(color);
  };

  return (
    <div className="space-y-3">
      {/* Selected Color Preview */}
      <div className="flex items-center space-x-4">
        <div
          className="w-12 h-12 rounded-lg border border-gray-300"
          style={{ backgroundColor: customColor }}
        />
        <div>
          <div className="font-medium text-gray-900">{customColor}</div>
          <div className="text-sm text-gray-500">Selected color</div>
        </div>
      </div>

      {/* Default Colors */}
      <div>
        <div className="text-sm font-medium text-gray-700 mb-2">Quick Pick</div>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => handleColorSelect(color)}
              className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform ${
                customColor === color ? 'border-gray-900' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Custom Color Picker */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-gray-700">Custom Color</div>
          <button
            type="button"
            onClick={() => setShowCustom(!showCustom)}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            {showCustom ? 'Hide' : 'Show'} custom picker
          </button>
        </div>
        
        {showCustom && (
          <div className="space-y-3">
            <input
              type="color"
              value={customColor}
              onChange={handleCustomColorChange}
              className="w-full h-10 cursor-pointer rounded-lg border border-gray-300"
            />
            <input
              type="text"
              value={customColor}
              onChange={handleCustomColorChange}
              placeholder="#000000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm"
            />
          </div>
        )}
      </div>

      {/* Color Usage Info */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        <p>This color will be used for:</p>
        <ul className="list-disc list-inside mt-1 ml-2">
          <li>Department badges</li>
          <li>Profile theme accents</li>
          <li>Visual identification</li>
        </ul>
      </div>
    </div>
  );
}