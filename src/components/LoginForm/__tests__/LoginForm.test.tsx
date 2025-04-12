import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import LoginForm from '../index'
import { useUser } from '@/components/UserContext'
import { toast } from 'react-toastify'
import { API_URL } from '@/config'

// Мокаем необходимые зависимости
vi.mock('@/components/UserContext', () => ({
  useUser: vi.fn()
}))

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Мокаем fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Мокаем API_URL для тестов
vi.mock('@/config', () => ({
  API_URL: 'http://test-api.example.com'
}))

describe('LoginForm', () => {
  const mockLogin = vi.fn()
  const mockOnSuccess = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Настраиваем мок useUser
    vi.mocked(useUser).mockReturnValue({
      user: null,
      login: mockLogin,
      logout: vi.fn()
    })
    
    // Настраиваем мок fetch по умолчанию
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: 'test-token' })
    })
  })
  
  it('должен рендерить форму входа с полями и кнопкой', () => {
    render(<LoginForm onSuccess={mockOnSuccess} />)
    
    // Проверяем наличие полей формы
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/пароль/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument()
  })
  
  it('должен обновлять значения полей при вводе', () => {
    render(<LoginForm onSuccess={mockOnSuccess} />)
    
    // Получаем поля формы
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/пароль/i)
    
    // Вводим значения
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    
    // Проверяем, что значения обновились
    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('password123')
  })
  
  it('должен отображать сообщение об ошибке при пустых полях', async () => {
    render(<LoginForm onSuccess={mockOnSuccess} />)
    
    // Получаем форму и кнопку сабмита
    const form = screen.getByRole('button', { name: /войти/i }).closest('form')
    expect(form).toBeInTheDocument()
    
    // Отправляем форму напрямую
    if (form) {
      fireEvent.submit(form)
    }
    
    // Проверяем, что появилось сообщение об ошибке
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Заполните все поля')
    })
    
    // Проверяем, что запрос не был отправлен
    expect(mockFetch).not.toHaveBeenCalled()
  })
  
  it('должен вызывать API и обрабатывать успешный ответ', async () => {
    render(<LoginForm onSuccess={mockOnSuccess} />)
    
    // Заполняем поля формы
    fireEvent.change(screen.getByLabelText(/email/i), { 
      target: { value: 'test@example.com' } 
    })
    fireEvent.change(screen.getByLabelText(/пароль/i), { 
      target: { value: 'password123' } 
    })
    
    // Получаем форму и отправляем её
    const form = screen.getByRole('button', { name: /войти/i }).closest('form')
    expect(form).toBeInTheDocument()
    
    if (form) {
      fireEvent.submit(form)
    }
    
    // Проверяем, что запрос был отправлен с правильными данными
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: 'test@example.com', 
          password: 'password123' 
        }),
      })
    })
    
    // Проверяем, что функция login была вызвана с полученным токеном
    expect(mockLogin).toHaveBeenCalledWith('test-token')
    
    // Проверяем, что было показано сообщение об успехе
    expect(toast.success).toHaveBeenCalledWith('Вход выполнен успешно')
    
    // Проверяем, что был вызван callback onSuccess
    expect(mockOnSuccess).toHaveBeenCalled()
  })
  
  it('должен обрабатывать ошибку неверных учетных данных', async () => {
    // Настраиваем мок fetch для возврата ошибки неверных учетных данных
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'invalid_credentials' })
    })
    
    render(<LoginForm onSuccess={mockOnSuccess} />)
    
    // Заполняем поля формы
    fireEvent.change(screen.getByLabelText(/email/i), { 
      target: { value: 'test@example.com' } 
    })
    fireEvent.change(screen.getByLabelText(/пароль/i), { 
      target: { value: 'wrong-password' } 
    })
    
    // Получаем форму и отправляем её
    const form = screen.getByRole('button', { name: /войти/i }).closest('form')
    expect(form).toBeInTheDocument()
    
    if (form) {
      fireEvent.submit(form)
    }
    
    // Проверяем, что запрос был отправлен
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })
    
    // Проверяем, что было показано сообщение об ошибке
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Неверный email или пароль')
    })
    
    // Проверяем, что функция login не была вызвана
    expect(mockLogin).not.toHaveBeenCalled()
    
    // Проверяем, что callback onSuccess не был вызван
    expect(mockOnSuccess).not.toHaveBeenCalled()
  })
  
  it('должен обрабатывать ошибки валидации', async () => {
    // Настраиваем мок fetch для возврата ошибок валидации
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ 
        error: 'validation_errors',
        errors: {
          email: ['Введите корректный email']
        }
      })
    })
    
    render(<LoginForm onSuccess={mockOnSuccess} />)
    
    // Заполняем поля формы
    fireEvent.change(screen.getByLabelText(/email/i), { 
      target: { value: 'invalid-email' } 
    })
    fireEvent.change(screen.getByLabelText(/пароль/i), { 
      target: { value: 'password123' } 
    })
    
    // Получаем форму и отправляем её
    const form = screen.getByRole('button', { name: /войти/i }).closest('form')
    expect(form).toBeInTheDocument()
    
    if (form) {
      fireEvent.submit(form)
    }
    
    // Проверяем, что запрос был отправлен
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })
    
    // Ожидаем, что сообщение об ошибке валидации отобразится
    await waitFor(() => {
      expect(screen.getByText('Введите корректный email')).toBeInTheDocument()
    })
    
    // Проверяем, что функция login не была вызвана
    expect(mockLogin).not.toHaveBeenCalled()
    
    // Проверяем, что callback onSuccess не был вызван
    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  it('должен отображать ошибки валидации для пароля', async () => {
    // Настраиваем мок fetch для возврата ошибок валидации пароля
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ 
        error: 'validation_errors',
        errors: {
          password: ['Пароль должен содержать не менее 8 символов']
        }
      })
    })
    
    render(<LoginForm onSuccess={mockOnSuccess} />)
    
    // Заполняем поля формы
    fireEvent.change(screen.getByLabelText(/email/i), { 
      target: { value: 'test@example.com' } 
    })
    fireEvent.change(screen.getByLabelText(/пароль/i), { 
      target: { value: 'short' } 
    })
    
    // Получаем форму и отправляем её
    const form = screen.getByRole('button', { name: /войти/i }).closest('form')
    expect(form).toBeInTheDocument()
    
    if (form) {
      fireEvent.submit(form)
    }
    
    // Проверяем, что запрос был отправлен
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })
    
    // Ожидаем, что сообщение об ошибке валидации пароля отобразится
    await waitFor(() => {
      expect(screen.getByText('Пароль должен содержать не менее 8 символов')).toBeInTheDocument()
    })
    
    // Проверяем в отдельном ожидании для класса ошибки
    await waitFor(() => {
      const passwordInput = screen.getByLabelText(/пароль/i)
      // Используем регулярное выражение для проверки, что класс содержит errorInput
      // Это более гибкий подход, учитывающий CSS-модули
      expect(passwordInput.className).toMatch(/errorInput/)
    }, { timeout: 3000 })
    
    // Проверяем, что функция login не была вызвана
    expect(mockLogin).not.toHaveBeenCalled()
    
    // Проверяем, что callback onSuccess не был вызван
    expect(mockOnSuccess).not.toHaveBeenCalled()
  })
  
  it('должен обрабатывать неизвестную ошибку', async () => {
    // Мокируем fetch для выброса ошибки
    mockFetch.mockRejectedValue(new Error('Ошибка сети'))
    
    render(<LoginForm onSuccess={mockOnSuccess} />)
    
    // Заполняем поля формы
    fireEvent.change(screen.getByLabelText(/email/i), { 
      target: { value: 'test@example.com' } 
    })
    fireEvent.change(screen.getByLabelText(/пароль/i), { 
      target: { value: 'password123' } 
    })
    
    // Получаем форму и отправляем её
    const form = screen.getByRole('button', { name: /войти/i }).closest('form')
    expect(form).toBeInTheDocument()
    
    if (form) {
      fireEvent.submit(form)
    }
    
    // Проверяем, что запрос был отправлен
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })
    
    // Проверяем, что было показано сообщение об ошибке с правильным текстом
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Ошибка: Ошибка сети')
    })
    
    // Проверяем, что функция login не была вызвана
    expect(mockLogin).not.toHaveBeenCalled()
    
    // Проверяем, что callback onSuccess не был вызван
    expect(mockOnSuccess).not.toHaveBeenCalled()
  })
  
  it('должен обрабатывать общую ошибку от сервера', async () => {
    // Настраиваем мок fetch для возврата общей ошибки
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ 
        message: 'Сервер временно недоступен'
      })
    })
    
    render(<LoginForm onSuccess={mockOnSuccess} />)
    
    // Заполняем поля формы
    fireEvent.change(screen.getByLabelText(/email/i), { 
      target: { value: 'test@example.com' } 
    })
    fireEvent.change(screen.getByLabelText(/пароль/i), { 
      target: { value: 'password123' } 
    })
    
    // Получаем форму и отправляем её
    const form = screen.getByRole('button', { name: /войти/i }).closest('form')
    expect(form).toBeInTheDocument()
    
    if (form) {
      fireEvent.submit(form)
    }
    
    // Проверяем, что запрос был отправлен
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })
    
    // Проверяем, что было показано сообщение об ошибке с правильным текстом
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Ошибка: Сервер временно недоступен')
    })
    
    // Проверяем, что функция login не была вызвана
    expect(mockLogin).not.toHaveBeenCalled()
    
    // Проверяем, что callback onSuccess не был вызван
    expect(mockOnSuccess).not.toHaveBeenCalled()
  })
}) 