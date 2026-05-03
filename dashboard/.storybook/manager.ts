import React, { useCallback } from 'react';
import { addons, types, useGlobals } from 'storybook/manager-api';

const MoonIcon = () =>
  React.createElement(
    'svg',
    {
      width: 14,
      height: 14,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
    React.createElement('path', {
      d: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
    }),
  );

const SunIcon = () =>
  React.createElement(
    'svg',
    {
      width: 14,
      height: 14,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
    React.createElement('circle', { cx: 12, cy: 12, r: 5 }),
    React.createElement('line', { x1: 12, y1: 1, x2: 12, y2: 3 }),
    React.createElement('line', { x1: 12, y1: 21, x2: 12, y2: 23 }),
    React.createElement('line', { x1: 4.22, y1: 4.22, x2: 5.64, y2: 5.64 }),
    React.createElement('line', { x1: 18.36, y1: 18.36, x2: 19.78, y2: 19.78 }),
    React.createElement('line', { x1: 1, y1: 12, x2: 3, y2: 12 }),
    React.createElement('line', { x1: 21, y1: 12, x2: 23, y2: 12 }),
    React.createElement('line', { x1: 4.22, y1: 19.78, x2: 5.64, y2: 18.36 }),
    React.createElement('line', { x1: 18.36, y1: 5.64, x2: 19.78, y2: 4.22 }),
  );

const ToggleTheme = () => {
  const [globals, updateGlobals] = useGlobals();
  const isDark = globals['darkMode'] !== false;

  const toggle = useCallback(() => {
    updateGlobals({ darkMode: !isDark });
  }, [isDark, updateGlobals]);

  return React.createElement(
    'button',
    {
      key: 'theme-toggle',
      onClick: toggle,
      title: isDark ? 'Switch to light mode' : 'Switch to dark mode',
      style: {
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'inherit',
      },
    },
    isDark ? React.createElement(SunIcon) : React.createElement(MoonIcon),
  );
};

addons.register('theme-toggle', () => {
  addons.add('theme-toggle/tool', {
    title: 'Toggle dark/light mode',
    type: types.TOOL,
    match: ({ viewMode }) => viewMode === 'story' || viewMode === 'docs',
    render: ToggleTheme,
  });
});
