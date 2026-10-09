import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { formatCurrency, formatDate, paymentMethodLabel } from '../utils/format.js';
import { Button, Badge, ProgressBar } from '../components/common/index.jsx';

describe('format utils', () => {
  it('formats INR currency', () => {
    expect(formatCurrency(1500)).toContain('1,500');
  });

  it('formats dates', () => {
    expect(formatDate('2026-01-05')).toMatch(/Jan/);
  });

  it('labels payment methods', () => {
    expect(paymentMethodLabel('upi')).toBe('UPI');
    expect(paymentMethodLabel('bank_transfer')).toBe('Bank Transfer');
  });
});

describe('common components', () => {
  it('renders a button with text', () => {
    render(<Button>Hello</Button>);
    expect(screen.getByRole('button', { name: 'Hello' })).toBeInTheDocument();
  });

  it('renders a badge', () => {
    render(<Badge variant="income">Income</Badge>);
    expect(screen.getByText('Income')).toBeInTheDocument();
  });

  it('renders a progress bar', () => {
    const { container } = render(<ProgressBar value={50} />);
    expect(container.querySelector('.progress__bar')).toHaveStyle({ width: '50%' });
  });
});
