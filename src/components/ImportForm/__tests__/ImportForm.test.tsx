import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { toast } from 'react-toastify';
import ImportForm from '..';
import { importData } from '@/db/DbUtils';

// Мокируем модули
vi.mock('@/db/DbUtils', () => ({
  importData: vi.fn()
}));

// Мокируем toast
vi.spyOn(toast, 'success').mockImplementation(() => 1);
vi.spyOn(toast, 'error').mockImplementation(() => 1);

describe('ImportForm', () => {
  // Мокируем window.dispatchEvent
  const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
  const onSuccessMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('отображает форму импорта', () => {
    render(<ImportForm onSuccess={onSuccessMock} />);
    
    expect(screen.getByRole('heading', { name: /импорт/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/json/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /импортировать/i })).toBeInTheDocument();
  });

  it('отправляет форму с валидным JSON и вызывает обработчик успеха', async () => {
    // Мокируем успешный импорт
    (importData as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);
    
    render(<ImportForm onSuccess={onSuccessMock} />);
    
    const validJson = JSON.stringify({ invests: [], payments: [] });
    fireEvent.change(screen.getByLabelText(/json/i), { target: { value: validJson } });
    
    const form = document.querySelector('form');
    expect(form).not.toBeNull();
    if (form) {
      fireEvent.submit(form);
    }
    
    await waitFor(() => {
      // Проверяем, что importData был вызван с правильными параметрами
      expect(importData).toHaveBeenCalledWith(JSON.parse(validJson), true);
      
      // Проверяем, что после успешного импорта вызваны нужные функции
      expect(toast.success).toHaveBeenCalledWith('Импорт завершен');
      expect(onSuccessMock).toHaveBeenCalled();
      expect(dispatchEventSpy).toHaveBeenCalled();
      
      // Проверяем, что dispatchEvent был вызван с правильным типом события
      const lastCall = dispatchEventSpy.mock.calls[0][0];
      expect(lastCall instanceof CustomEvent).toBe(true);
      expect((lastCall as CustomEvent).type).toBe('fetchInvests');
    });
  });

  it('показывает ошибку при попытке импорта невалидного JSON', async () => {
    render(<ImportForm onSuccess={onSuccessMock} />);
    
    const invalidJson = '{ this is not valid json }';
    fireEvent.change(screen.getByLabelText(/json/i), { target: { value: invalidJson } });
    
    const form = document.querySelector('form');
    expect(form).not.toBeNull();
    if (form) {
      fireEvent.submit(form);
    }
    
    await waitFor(() => {
      // Проверяем, что при ошибке парсинга JSON вызван toast.error
      expect(toast.error).toHaveBeenCalledWith('Не удалось распарсить данные');
      
      // Проверяем, что onSuccess не был вызван при ошибке
      expect(onSuccessMock).not.toHaveBeenCalled();
    });
  });
}); 