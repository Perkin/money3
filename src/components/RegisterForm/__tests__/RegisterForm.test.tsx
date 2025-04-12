import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { toast } from 'react-toastify';
import userEvent from '@testing-library/user-event';
import RegisterForm from '..';
import { API_URL } from '@/config';

// Создаем мок-функцию для login
const mockLogin = vi.fn();

// Мокируем модули
vi.mock('@/components/UserContext', () => ({
  useUser: () => ({
    login: mockLogin
  })
}));

// Мокируем fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Мокируем toast
vi.spyOn(toast, 'success').mockImplementation(() => 1);
vi.spyOn(toast, 'error').mockImplementation(() => 1);

describe('RegisterForm', () => {
  const onSuccessMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('отображает форму регистрации', () => {
    render(<RegisterForm onSuccess={onSuccessMock} />);
    
    expect(screen.getByRole('heading', { name: /регистрация/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/имя пользователя/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Пароль:')).toBeInTheDocument();
    expect(screen.getByLabelText('Подтвердите пароль:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /зарегистрироваться/i })).toBeInTheDocument();
  });

  it('проверяет заполнение всех полей при отправке формы', async () => {
    render(<RegisterForm onSuccess={onSuccessMock} />);
    
    const form = document.querySelector('form');
    expect(form).not.toBeNull();
    if (form) {
      fireEvent.submit(form);
    }
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Заполните все поля');
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  it('проверяет совпадение паролей', async () => {
    render(<RegisterForm onSuccess={onSuccessMock} />);
    
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/имя пользователя/i), 'testuser');
    await userEvent.type(screen.getByLabelText('Пароль:'), 'password123');
    await userEvent.type(screen.getByLabelText('Подтвердите пароль:'), 'different123');
    
    const form = document.querySelector('form');
    expect(form).not.toBeNull();
    if (form) {
      fireEvent.submit(form);
    }
    
    await waitFor(() => {
      expect(screen.getByText('Пароли не совпадают')).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  it('успешно регистрирует пользователя', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ token: 'test-token' })
    };
    mockFetch.mockResolvedValueOnce(mockResponse as unknown as Response);
    
    render(<RegisterForm onSuccess={onSuccessMock} />);
    
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/имя пользователя/i), 'testuser');
    await userEvent.type(screen.getByLabelText('Пароль:'), 'password123');
    await userEvent.type(screen.getByLabelText('Подтвердите пароль:'), 'password123');
    
    const form = document.querySelector('form');
    expect(form).not.toBeNull();
    if (form) {
      fireEvent.submit(form);
    }
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123'
        })
      });
      
      expect(mockLogin).toHaveBeenCalledWith('test-token');
      expect(toast.success).toHaveBeenCalledWith('Регистрация выполнена успешно');
      expect(onSuccessMock).toHaveBeenCalled();
    });
  });

  it('показывает ошибку, если пользователь уже существует', async () => {
    const mockResponse = {
      ok: false,
      json: () => Promise.resolve({ 
        error: 'user_exists'
      })
    };
    mockFetch.mockResolvedValueOnce(mockResponse as unknown as Response);
    
    render(<RegisterForm onSuccess={onSuccessMock} />);
    
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/имя пользователя/i), 'testuser');
    await userEvent.type(screen.getByLabelText('Пароль:'), 'password123');
    await userEvent.type(screen.getByLabelText('Подтвердите пароль:'), 'password123');
    
    const form = document.querySelector('form');
    expect(form).not.toBeNull();
    if (form) {
      fireEvent.submit(form);
    }
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Такой пользователь уже существует');
    });
  });

  it('показывает ошибки валидации от сервера', async () => {
    const mockResponse = {
      ok: false,
      json: () => Promise.resolve({ 
        error: 'validation_errors',
        errors: {
          email: ['Некорректный формат email']
        }
      })
    };
    mockFetch.mockResolvedValueOnce(mockResponse as unknown as Response);
    
    render(<RegisterForm onSuccess={onSuccessMock} />);
    
    await userEvent.type(screen.getByLabelText(/email/i), 'invalid-email');
    await userEvent.type(screen.getByLabelText(/имя пользователя/i), 'testuser');
    await userEvent.type(screen.getByLabelText('Пароль:'), 'password123');
    await userEvent.type(screen.getByLabelText('Подтвердите пароль:'), 'password123');
    
    const form = document.querySelector('form');
    expect(form).not.toBeNull();
    if (form) {
      fireEvent.submit(form);
    }
    
    await waitFor(() => {
      expect(screen.getByText('Некорректный формат email')).toBeInTheDocument();
    });
  });

  it('обрабатывает неизвестную ошибку от сервера', async () => {
    // Создаем объект Error для имитации ошибки сети
    const testError = new Error('Ошибка соединения');
    mockFetch.mockRejectedValueOnce(testError);
    
    render(<RegisterForm onSuccess={onSuccessMock} />);
    
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/имя пользователя/i), 'testuser');
    await userEvent.type(screen.getByLabelText('Пароль:'), 'password123');
    await userEvent.type(screen.getByLabelText('Подтвердите пароль:'), 'password123');
    
    const form = document.querySelector('form');
    expect(form).not.toBeNull();
    if (form) {
      fireEvent.submit(form);
    }
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Ошибка: Ошибка соединения');
    });
  });

  it('отображает ошибки для всех полей формы', async () => {
    const mockResponse = {
      ok: false,
      json: () => Promise.resolve({ 
        error: 'validation_errors',
        errors: {
          username: ['Имя пользователя уже занято'],
          password: ['Пароль должен содержать не менее 8 символов']
        }
      })
    };
    mockFetch.mockResolvedValueOnce(mockResponse as unknown as Response);
    
    render(<RegisterForm onSuccess={onSuccessMock} />);
    
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/имя пользователя/i), 'testuser');
    await userEvent.type(screen.getByLabelText('Пароль:'), 'pass123');
    await userEvent.type(screen.getByLabelText('Подтвердите пароль:'), 'pass123');
    
    const form = document.querySelector('form');
    expect(form).not.toBeNull();
    if (form) {
      fireEvent.submit(form);
    }
    
    // Ждем отображения ошибок от сервера
    await waitFor(() => {
      // Проверяем ошибку для имени пользователя
      expect(screen.getByText('Имя пользователя уже занято')).toBeInTheDocument();
      
      // Проверяем ошибку для пароля
      expect(screen.getByText('Пароль должен содержать не менее 8 символов')).toBeInTheDocument();
    });
  });

  it('обрабатывает общую ошибку от сервера', async () => {
    const errorMessage = 'Ошибка сервера';
    const mockResponse = {
      ok: false,
      json: () => Promise.resolve({ 
        message: errorMessage
      })
    };
    mockFetch.mockResolvedValueOnce(mockResponse as unknown as Response);
    
    render(<RegisterForm onSuccess={onSuccessMock} />);
    
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/имя пользователя/i), 'testuser');
    await userEvent.type(screen.getByLabelText('Пароль:'), 'password123');
    await userEvent.type(screen.getByLabelText('Подтвердите пароль:'), 'password123');
    
    const form = document.querySelector('form');
    expect(form).not.toBeNull();
    if (form) {
      fireEvent.submit(form);
    }
    
    // Ждем вызова toast.error с нужным сообщением
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(`Ошибка: ${errorMessage}`);
    }, { timeout: 3000 });
  });
}); 