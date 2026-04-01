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

export default function ColorPicker({ value = '#7C5CFF', onChange }) {
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

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  };

  const previewStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const colorBoxStyle = {
    width: 48,
    height: 48,
    borderRadius: 8,
    border: '1px solid #222634',
    backgroundColor: customColor,
  };

  const colorInfoStyle = {
    flex: 1,
  };

  const colorHexStyle = {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: 500,
    fontFamily: 'monospace',
  };

  const colorLabelStyle = {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
  };

  const sectionTitleStyle = {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: 500,
    marginBottom: 8,
  };

  const colorGridStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  };

  const colorButtonStyle = (color, isSelected) => ({
    width: 32,
    height: 32,
    borderRadius: '50%',
    backgroundColor: color,
    border: isSelected ? '2px solid #E5E7EB' : '1px solid #222634',
    cursor: 'pointer',
    transition: 'transform 0.2s, border-color 0.2s',
    boxSizing: 'border-box',
  });

  const toggleButtonStyle = {
    background: 'none',
    border: 'none',
    color: '#7C5CFF',
    fontSize: 12,
    cursor: 'pointer',
    padding: '4px 0',
    fontFamily: 'inherit',
    transition: 'color 0.2s',
  };

  const customPickerStyle = {
    marginTop: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  };

  const colorInputStyle = {
    width: '100%',
    height: 40,
    cursor: 'pointer',
    borderRadius: 8,
    border: '1px solid #222634',
    background: '#0B0D12',
  };

  const textInputStyle = {
    width: '100%',
    padding: '8px 12px',
    background: '#0B0D12',
    border: '1px solid #222634',
    borderRadius: 8,
    color: '#E5E7EB',
    fontSize: 13,
    fontFamily: 'monospace',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  };

  const infoBoxStyle = {
    background: '#0B0D12',
    border: '1px solid #222634',
    borderRadius: 8,
    padding: '12px',
    fontSize: 11,
    color: '#6B7280',
  };

  const infoListStyle = {
    listStyle: 'disc',
    marginTop: 6,
    paddingLeft: 16,
  };

  return (
    <div style={containerStyle}>
      <div style={previewStyle}>
        <div style={colorBoxStyle} />
        <div style={colorInfoStyle}>
          <div style={colorHexStyle}>{customColor}</div>
          <div style={colorLabelStyle}>Selected color</div>
        </div>
      </div>

      <div>
        <div style={sectionTitleStyle}>Quick Pick</div>
        <div style={colorGridStyle}>
          {DEFAULT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => handleColorSelect(color)}
              style={colorButtonStyle(color, customColor === color)}
              onMouseOver={(e) => (e.target.style.transform = 'scale(1.1)')}
              onMouseOut={(e) => (e.target.style.transform = 'scale(1)')}
              title={color}
            />
          ))}
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={sectionTitleStyle}>Custom Color</div>
          <button
            type="button"
            onClick={() => setShowCustom(!showCustom)}
            style={toggleButtonStyle}
            onMouseOver={(e) => (e.target.style.color = '#9b7cff')}
            onMouseOut={(e) => (e.target.style.color = '#7C5CFF')}
          >
            {showCustom ? 'Hide' : 'Show'} custom picker
          </button>
        </div>

        {showCustom && (
          <div style={customPickerStyle}>
            <input
              type="color"
              value={customColor}
              onChange={handleCustomColorChange}
              style={colorInputStyle}
            />
            <input
              type="text"
              value={customColor}
              onChange={handleCustomColorChange}
              placeholder="#000000"
              style={textInputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#7C5CFF')}
              onBlur={(e) => (e.target.style.borderColor = '#222634')}
            />
          </div>
        )}
      </div>

      <div style={infoBoxStyle}>
        <p style={{ margin: 0 }}>This color will be used for:</p>
        <ul style={infoListStyle}>
          <li>Department badges</li>
          <li>Profile theme accents</li>
          <li>Visual identification</li>
        </ul>
      </div>
    </div>
  );
}