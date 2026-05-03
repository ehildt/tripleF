function parseType(value: unknown): 'boolean' | 'number' | 'string' {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') {
    if (value === 'true' || value === 'false') return 'boolean';
    if (/^-?\d+(\.\d+)?$/.test(value)) return 'number';
  }
  return 'string';
}

function getTypeColor(type: 'boolean' | 'number' | 'string'): string | null {
  switch (type) {
    case 'boolean':
      return 'harmony-1';
    case 'number':
      return 'harmony-2';
    case 'string':
      return null;
  }
}

export function getValueTypeGradient(value: unknown): string | null {
  const color = getTypeColor(parseType(value));
  return color ? `from-${color}/20 via-${color}/5 to-transparent` : null;
}
