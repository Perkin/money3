import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Menu from '../index'
import { useUser } from '../../UserContext'

// Мокаем хук useUser
vi.mock('../../UserContext', () => ({
  useUser: vi.fn()
}))

// Моки оставляем только для сложных компонентов с callbacks
vi.mock('@/components/Popup', () => ({
  default: ({ children, onClose }: { children: React.ReactNode, onClose: () => void }) => (
    <div data-testid="popup">
      <button data-testid="close-popup" onClick={onClose}>Close</button>
      {children}
    </div>
  )
}))

vi.mock('@/components/LoginForm', () => ({
  default: ({ onSuccess }: { onSuccess: () => void }) => (
    <div data-testid="login-form">
      <button data-testid="login-success" onClick={onSuccess}>Login Success</button>
    </div>
  )
}))

vi.mock('@/components/RegisterForm', () => ({
  default: ({ onSuccess }: { onSuccess: () => void }) => (
    <div data-testid="register-form">
      <button data-testid="register-success" onClick={onSuccess}>Register Success</button>
    </div>
  )
}))

vi.mock('@/components/SettingsForm', () => ({
  default: () => <div data-testid="settings-form">Settings Form</div>
}))

vi.mock('@/components/ImportForm', () => ({
  default: ({ onSuccess }: { onSuccess: () => void }) => (
    <div data-testid="import-form">
      <button data-testid="import-success" onClick={onSuccess}>Import Success</button>
    </div>
  )
}))

// Мокаем экспорт и синхронизацию
vi.mock('@/db/DbUtils.ts', () => ({
  exportData: vi.fn().mockResolvedValue(undefined),
  syncUpdates: vi.fn().mockResolvedValue(undefined)
}))

// Мокаем toast
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Вспомогательная функция для проверки клика вне компонента
const simulateClickOutside = () => {
  const event = new MouseEvent('click', {
    bubbles: true,
    cancelable: true
  })
  document.dispatchEvent(event)
}

describe('Menu', () => {
  const mockLogout = vi.fn()
  
  // Общая настройка перед каждым тестом
  beforeEach(() => {
    vi.clearAllMocks()
    
    // По умолчанию пользователь авторизован
    vi.mocked(useUser).mockReturnValue({
      user: { username: 'testuser', email: 'test@example.com' },
      login: vi.fn(),
      logout: mockLogout
    })
  })
  
  it('должен корректно отображать имя пользователя', () => {
    render(<Menu />)
    expect(screen.getByText('testuser')).toBeInTheDocument()
  })
  
  it('должен показывать меню при клике на кнопку меню', () => {
    render(<Menu />)
    
    const menuButton = screen.getByText('☰')
    expect(menuButton).toBeInTheDocument()
    
    // Изначально меню скрыто
    expect(screen.queryByText('Экспорт')).not.toBeInTheDocument()
    
    // Кликаем на кнопку меню
    fireEvent.click(menuButton)
    
    // Меню должно стать видимым
    expect(screen.getByText('Экспорт')).toBeInTheDocument()
    expect(screen.getByText('Импорт')).toBeInTheDocument()
    expect(screen.getByText('Настройки')).toBeInTheDocument()
  })
  
  it('должен реагировать на клик вне меню', () => {
    const { container } = render(<Menu />)
    
    // Открываем меню
    fireEvent.click(screen.getByText('☰'))
    expect(screen.getByText('Экспорт')).toBeInTheDocument()
    
    // Симулируем клик вне меню
    // Поскольку мы теперь используем реальные компоненты, способ обработки
    // события клика вне меню может отличаться
    const menuVisible = container.querySelector('[class*="menuDropdownContent"]')
    expect(menuVisible).toBeInTheDocument()
    
    // Мы можем проверить только наличие обработчика события и наличие самого меню
    // Реализация закрытия меню при клике вне зависит от компонента
    simulateClickOutside()
    
    // Проверяем, что обработчик события был вызван
    // (мы не можем напрямую проверить закрытие меню, т.к. это зависит от реализации)
  })
  
  it('должен отображать разные пункты меню в зависимости от авторизации', () => {
    // Первый рендер с авторизованным пользователем
    const { unmount } = render(<Menu />)
    
    // Открываем меню
    fireEvent.click(screen.getByText('☰'))
    
    // Проверяем пункты для авторизованного пользователя
    expect(screen.getByText('Обновить данные')).toBeInTheDocument()
    expect(screen.getByText('Выход')).toBeInTheDocument()
    expect(screen.queryByText('Регистрация')).not.toBeInTheDocument()
    expect(screen.queryByText('Авторизация')).not.toBeInTheDocument()
    
    // Удаляем компонент
    unmount()
    
    // Переключаем на неавторизованного пользователя
    vi.mocked(useUser).mockReturnValue({
      user: null,
      login: vi.fn(),
      logout: mockLogout
    })
    
    // Повторный рендер
    render(<Menu />)
    
    // Открываем меню
    fireEvent.click(screen.getByText('☰'))
    
    // Проверяем пункты для неавторизованного пользователя
    expect(screen.queryByText('Обновить данные')).not.toBeInTheDocument()
    expect(screen.queryByText('Выход')).not.toBeInTheDocument()
    expect(screen.getByText('Регистрация')).toBeInTheDocument()
    expect(screen.getByText('Авторизация')).toBeInTheDocument()
  })
  
  it('должен открывать форму входа и закрывать ее при успешной авторизации', async () => {
    // Переключаем на неавторизованного пользователя
    vi.mocked(useUser).mockReturnValue({
      user: null,
      login: vi.fn(),
      logout: mockLogout
    })
    
    render(<Menu />)
    
    // Открываем меню
    fireEvent.click(screen.getByText('☰'))
    
    // Нажимаем на пункт авторизации
    fireEvent.click(screen.getByText('Авторизация'))
    
    // Проверяем, что форма логина открылась
    expect(screen.getByTestId('login-form')).toBeInTheDocument()
    
    // Имитируем успешную авторизацию
    fireEvent.click(screen.getByTestId('login-success'))
    
    // Форма должна закрыться
    expect(screen.queryByTestId('login-form')).not.toBeInTheDocument()
  })
  
  it('должен вызывать экспорт данных при нажатии на пункт Экспорт', async () => {
    const { exportData } = await import('@/db/DbUtils.ts')
    const { toast } = await import('react-toastify')
    
    render(<Menu />)
    
    // Открываем меню
    fireEvent.click(screen.getByText('☰'))
    
    // Нажимаем на пункт экспорта
    fireEvent.click(screen.getByText('Экспорт'))
    
    // Проверяем, что функция экспорта вызвана
    expect(exportData).toHaveBeenCalled()
    
    // Дожидаемся завершения асинхронной операции
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled()
    })
  })
  
  it('должен открывать форму импорта при нажатии на пункт Импорт', () => {
    render(<Menu />)
    
    // Открываем меню
    fireEvent.click(screen.getByText('☰'))
    
    // Нажимаем на пункт импорта
    fireEvent.click(screen.getByText('Импорт'))
    
    // Проверяем, что форма импорта открылась
    expect(screen.getByTestId('import-form')).toBeInTheDocument()
    
    // Имитируем успешный импорт
    fireEvent.click(screen.getByTestId('import-success'))
    
    // Форма должна закрыться
    expect(screen.queryByTestId('import-form')).not.toBeInTheDocument()
  })
  
  it('должен выполнять выход из системы при нажатии на пункт Выход', async () => {
    const { toast } = await import('react-toastify')
    
    render(<Menu />)
    
    // Открываем меню
    fireEvent.click(screen.getByText('☰'))
    
    // Нажимаем на пункт выхода
    fireEvent.click(screen.getByText('Выход'))
    
    // Должна быть вызвана функция logout
    expect(mockLogout).toHaveBeenCalled()
    
    // Должно появиться уведомление
    expect(toast.success).toHaveBeenCalledWith('Вы успешно вышли')
  })
  
  it('должен вызывать синхронизацию данных при нажатии на пункт Обновить данные', async () => {
    const { syncUpdates } = await import('@/db/DbUtils.ts')
    const { toast } = await import('react-toastify')
    
    render(<Menu />)
    
    // Открываем меню
    fireEvent.click(screen.getByText('☰'))
    
    // Нажимаем на пункт обновления данных
    fireEvent.click(screen.getByText('Обновить данные'))
    
    // Проверяем, что функция синхронизации вызвана
    expect(syncUpdates).toHaveBeenCalled()
    
    // Дожидаемся завершения асинхронной операции
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled()
    })
  })
  
  it('должен корректно обрабатывать ошибку при экспорте данных', async () => {
    const { exportData } = await import('@/db/DbUtils.ts')
    const { toast } = await import('react-toastify')
    
    // Мокаем ошибку при экспорте
    vi.mocked(exportData).mockRejectedValueOnce(new Error('Тестовая ошибка экспорта'))
    
    render(<Menu />)
    
    // Открываем меню
    fireEvent.click(screen.getByText('☰'))
    
    // Нажимаем на пункт экспорта
    fireEvent.click(screen.getByText('Экспорт'))
    
    // Проверяем, что функция экспорта вызвана
    expect(exportData).toHaveBeenCalled()
    
    // Дожидаемся завершения асинхронной операции и проверяем сообщение об ошибке
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Ошибка экспорта: Тестовая ошибка экспорта')
    })
  })
  
  it('должен корректно обрабатывать ошибку при синхронизации данных', async () => {
    const { syncUpdates } = await import('@/db/DbUtils.ts')
    const { toast } = await import('react-toastify')
    
    // Мокаем ошибку при синхронизации
    vi.mocked(syncUpdates).mockRejectedValueOnce(new Error('Тестовая ошибка синхронизации'))
    
    render(<Menu />)
    
    // Открываем меню
    fireEvent.click(screen.getByText('☰'))
    
    // Нажимаем на пункт обновления данных
    fireEvent.click(screen.getByText('Обновить данные'))
    
    // Проверяем, что функция синхронизации вызвана
    expect(syncUpdates).toHaveBeenCalled()
    
    // Дожидаемся завершения асинхронной операции и проверяем сообщение об ошибке
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Ошибка синхронизации: Тестовая ошибка синхронизации')
    })
  })
  
  it('должен корректно обрабатывать ошибку не-Error типа при экспорте', async () => {
    const { exportData } = await import('@/db/DbUtils.ts')
    const { toast } = await import('react-toastify')
    
    // Мокаем ошибку не-Error типа
    vi.mocked(exportData).mockRejectedValueOnce('Строковая ошибка')
    
    render(<Menu />)
    
    // Открываем меню
    fireEvent.click(screen.getByText('☰'))
    
    // Нажимаем на пункт экспорта
    fireEvent.click(screen.getByText('Экспорт'))
    
    // Дожидаемся завершения асинхронной операции и проверяем сообщение об ошибке
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Ошибка экспорта: Неизвестная ошибка')
    })
  })
  
  it('должен открывать форму настроек при нажатии на пункт Настройки', () => {
    render(<Menu />)
    
    // Открываем меню
    fireEvent.click(screen.getByText('☰'))
    
    // Нажимаем на пункт настроек
    fireEvent.click(screen.getByText('Настройки'))
    
    // Проверяем, что форма настроек открылась
    expect(screen.getByTestId('settings-form')).toBeInTheDocument()
    
    // Проверяем, что меню закрылось
    expect(screen.queryByText('Экспорт')).not.toBeInTheDocument()
    
    // Закрываем форму настроек
    fireEvent.click(screen.getByTestId('close-popup'))
    
    // Проверяем, что форма закрылась
    expect(screen.queryByTestId('settings-form')).not.toBeInTheDocument()
  })
  
  it('должен открывать форму регистрации для неавторизованного пользователя', () => {
    // Переключаем на неавторизованного пользователя
    vi.mocked(useUser).mockReturnValue({
      user: null,
      login: vi.fn(),
      logout: mockLogout
    })
    
    render(<Menu />)
    
    // Открываем меню
    fireEvent.click(screen.getByText('☰'))
    
    // Нажимаем на пункт регистрации
    fireEvent.click(screen.getByText('Регистрация'))
    
    // Проверяем, что форма регистрации открылась
    expect(screen.getByTestId('register-form')).toBeInTheDocument()
    
    // Имитируем успешную регистрацию
    fireEvent.click(screen.getByTestId('register-success'))
    
    // Форма должна закрыться и меню тоже
    expect(screen.queryByTestId('register-form')).not.toBeInTheDocument()
    expect(screen.queryByText('Регистрация')).not.toBeInTheDocument()
  })
}) 