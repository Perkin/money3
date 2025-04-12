import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { toast } from 'react-toastify';
import userEvent from '@testing-library/user-event';
import SettingsForm from '..';
import { requestNotificationPermission, checkForDebts } from '@/utils/debtCheckUtils';

// Мокируем объект Notification
global.Notification = {
  permission: 'default'
} as unknown as typeof Notification;

// Мокируем модули
vi.mock('@/utils/debtCheckUtils', () => ({
  requestNotificationPermission: vi.fn(),
  checkForDebts: vi.fn()
}));

// Мокируем toast
vi.spyOn(toast, 'success').mockImplementation(() => 1);
vi.spyOn(toast, 'error').mockImplementation(() => 1);
vi.spyOn(toast, 'info').mockImplementation(() => 1);

describe('SettingsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Сбрасываем статус разрешения перед каждым тестом
    Object.defineProperty(Notification, 'permission', {
      writable: true,
      value: 'default'
    });
  });

  it('отображает форму настроек', () => {
    render(<SettingsForm />);
    
    expect(screen.getByRole('heading', { name: /настройки/i })).toBeInTheDocument();
    // Ищем label вместо текста
    expect(screen.getByText('Уведомления')).toBeInTheDocument();
    expect(screen.getByText(/статус:/i)).toBeInTheDocument();
  });

  it('отображает соответствующий статус уведомлений', () => {
    // Тестируем разные статусы
    Object.defineProperty(Notification, 'permission', { 
      writable: true, 
      value: 'granted' 
    });
    render(<SettingsForm />);
    
    // Проверяем статус в конкретном элементе
    const statusElement = screen.getByText(/статус:/i).parentElement;
    expect(statusElement).toHaveTextContent(/разрешены/i);
    
    // Очищаем DOM
    cleanup();
    
    // Меняем статус и проверяем еще раз
    Object.defineProperty(Notification, 'permission', { 
      writable: true,
      value: 'denied' 
    });
    render(<SettingsForm />);
    
    const statusElement2 = screen.getByText(/статус:/i).parentElement;
    expect(statusElement2).toHaveTextContent(/заблокированы/i);
  });

  it('запрашивает разрешение на уведомления при нажатии на кнопку', async () => {
    // Устанавливаем статус default, чтобы кнопка отображала "Разрешить уведомления"
    Object.defineProperty(Notification, 'permission', { 
      writable: true, 
      value: 'default' 
    });
    
    // Мокируем успешное получение разрешения
    (requestNotificationPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    
    render(<SettingsForm />);
    
    // Находим кнопку и проверяем текст на ней
    const buttonElement = screen.getByRole('button');
    expect(buttonElement).toHaveTextContent(/разрешить уведомления/i);
    
    await userEvent.click(buttonElement);
    
    await waitFor(() => {
      expect(requestNotificationPermission).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Разрешение на уведомления получено');
      expect(checkForDebts).toHaveBeenCalled();
    });
  });

  it('показывает предупреждение, если разрешение не получено', async () => {
    // Устанавливаем статус default, чтобы кнопка отображала "Разрешить уведомления"
    Object.defineProperty(Notification, 'permission', { 
      writable: true, 
      value: 'default' 
    });
    
    // Мокируем отказ в разрешении
    (requestNotificationPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    
    render(<SettingsForm />);
    
    // Находим кнопку по содержимому
    const buttonElement = screen.getByRole('button');
    expect(buttonElement).toHaveTextContent(/разрешить уведомления/i);
    
    await userEvent.click(buttonElement);
    
    await waitFor(() => {
      expect(requestNotificationPermission).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Разрешение на уведомления не получено');
      expect(checkForDebts).not.toHaveBeenCalled();
    });
  });

  it('проверяет долги при нажатии на кнопку "Проверить долги"', async () => {
    // Устанавливаем разрешение granted для тестирования кнопки
    Object.defineProperty(Notification, 'permission', { 
      writable: true, 
      value: 'granted' 
    });
    
    render(<SettingsForm />);
    const button = screen.getByRole('button', { name: /проверить долги/i });
    
    await userEvent.click(button);
    
    await waitFor(() => {
      expect(checkForDebts).toHaveBeenCalled();
      expect(toast.info).toHaveBeenCalledWith('Запрос на проверку долгов отправлен');
    });
  });
}); 