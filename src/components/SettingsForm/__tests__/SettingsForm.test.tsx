import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SettingsForm from '..';

describe('SettingsForm', () => {
  it('отображает форму настроек', () => {
    render(<SettingsForm />);
    expect(screen.getByRole('heading', { name: /настройки/i })).toBeInTheDocument();
    expect(screen.getByText(/о приложении/i)).toBeInTheDocument();
    expect(screen.getByText(/версия:/i)).toBeInTheDocument();
    expect(screen.getByText(/дата сборки:/i)).toBeInTheDocument();
  });
}); 