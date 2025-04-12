import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, renderHook, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { UserProvider, useUser } from '..'
import { jwtDecode } from 'jwt-decode'

// Мокаем jwt-decode
vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn()
}))

// Мокаем syncUpdates
vi.mock('@/db/DbUtils', () => ({
  syncUpdates: vi.fn().mockResolvedValue(undefined)
}))

// Мокаем localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    })
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Мокаем dispatchEvent
const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')

describe('UserContext', () => {
  const mockUser = {
    username: 'testuser',
    email: 'test@example.com'
  }
  
  beforeEach(() => {
    vi.mocked(jwtDecode).mockReturnValue(mockUser)
    localStorageMock.clear()
    vi.clearAllMocks()
  })
  
  afterEach(() => {
    vi.clearAllMocks()
  })
  
  it('должен предоставлять пустого пользователя по умолчанию', () => {
    // Компонент для тестирования контекста
    const TestComponent = () => {
      const { user } = useUser()
      return <div>{user ? 'Пользователь: ' + user.username : 'Не авторизован'}</div>
    }
    
    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    )
    
    expect(screen.getByText('Не авторизован')).toBeInTheDocument()
  })
  
  it('должен восстанавливать пользователя из токена при монтировании', () => {
    // Устанавливаем токен в localStorage
    localStorageMock.setItem('token', 'test-token')
    
    // Компонент для тестирования контекста
    const TestComponent = () => {
      const { user } = useUser()
      return <div>{user ? 'Пользователь: ' + user.username : 'Не авторизован'}</div>
    }
    
    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    )
    
    // Должен быть вызван jwtDecode
    expect(jwtDecode).toHaveBeenCalledWith('test-token')
    
    // Текст должен отображать имя пользователя из мока
    expect(screen.getByText(`Пользователь: ${mockUser.username}`)).toBeInTheDocument()
  })
  
  it('должен авторизовать пользователя с помощью функции login', () => {
    // Компонент для тестирования контекста
    const TestComponent = () => {
      const { user, login } = useUser()
      return (
        <div>
          <div>{user ? 'Пользователь: ' + user.username : 'Не авторизован'}</div>
          <button onClick={() => login('new-token')}>Войти</button>
        </div>
      )
    }
    
    const { getByText } = render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    )
    
    // Изначально пользователь не авторизован
    expect(getByText('Не авторизован')).toBeInTheDocument()
    
    // Нажимаем кнопку входа
    act(() => {
      getByText('Войти').click()
    })
    
    // Должен быть установлен токен
    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'new-token')
    
    // Должен быть вызван jwtDecode
    expect(jwtDecode).toHaveBeenCalledWith('new-token')
    
    // Текст должен отображать имя пользователя из мока
    expect(getByText(`Пользователь: ${mockUser.username}`)).toBeInTheDocument()
  })
  
  it('должен разлогинивать пользователя с помощью функции logout', () => {
    // Устанавливаем токен для начального состояния
    localStorageMock.setItem('token', 'test-token')
    
    // Компонент для тестирования контекста
    const TestComponent = () => {
      const { user, logout } = useUser()
      return (
        <div>
          <div>{user ? 'Пользователь: ' + user.username : 'Не авторизован'}</div>
          <button onClick={logout}>Выйти</button>
        </div>
      )
    }
    
    const { getByText } = render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    )
    
    // Изначально пользователь авторизован
    expect(getByText(`Пользователь: ${mockUser.username}`)).toBeInTheDocument()
    
    // Нажимаем кнопку выхода
    act(() => {
      getByText('Выйти').click()
    })
    
    // Должен быть удален токен
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
    
    // Текст должен отображать, что пользователь не авторизован
    expect(getByText('Не авторизован')).toBeInTheDocument()
  })
  
  it('должен вызывать syncUpdates при авторизации пользователя', async () => {
    const { syncUpdates } = await import('@/db/DbUtils')
    
    // Компонент для тестирования контекста
    const TestComponent = () => {
      const { login } = useUser()
      return <button onClick={() => login('new-token')}>Войти</button>
    }
    
    const { getByText } = render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    )
    
    // Нажимаем кнопку входа
    act(() => {
      getByText('Войти').click()
    })
    
    // Должен быть вызван syncUpdates
    expect(syncUpdates).toHaveBeenCalled()
    
    // Должно быть вызвано событие fetchInvests после успешной синхронизации
    // Имитируем выполнение промиса
    await act(async () => {
      await Promise.resolve()
    })
    
    expect(dispatchEventSpy).toHaveBeenCalled()
    // Проверяем, что событие fetchInvests было отправлено
    expect(dispatchEventSpy.mock.calls[0][0].type).toBe('fetchInvests')
  })
  
  it('хук useUser должен выбрасывать ошибку при использовании вне провайдера', () => {
    // Перехватываем и подавляем ошибки в консоли
    const errorMock = vi.spyOn(console, 'error')
    errorMock.mockImplementation(() => {})
    
    // Ожидаем ошибку при использовании хука вне провайдера
    expect(() => {
      renderHook(() => useUser())
    }).toThrow('useUser должен использоваться внутри UserProvider')
    
    // Восстанавливаем консоль
    errorMock.mockRestore()
  })

  it('должен обрабатывать ошибку при декодировании JWT', () => {
    // Мокируем ошибку при декодировании JWT
    const errorMock = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(jwtDecode).mockImplementation(() => {
      throw new Error('Invalid token')
    })
    
    // Устанавливаем недействительный токен
    localStorageMock.setItem('token', 'invalid-token')
    
    // Компонент для тестирования контекста
    const TestComponent = () => {
      const { user } = useUser()
      return <div>{user ? 'Пользователь: ' + user.username : 'Не авторизован'}</div>
    }
    
    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    )
    
    // Проверяем, что ошибка была залогирована
    expect(errorMock).toHaveBeenCalledWith('Ошибка при декодировании JWT', expect.any(Error))
    
    // Проверяем, что токен был удален
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
    
    // Проверяем, что пользователь не авторизован
    expect(screen.getByText('Не авторизован')).toBeInTheDocument()
    
    // Восстанавливаем console.error
    errorMock.mockRestore()
  })
  
  it('должен обрабатывать ошибку при синхронизации данных', async () => {
    const { syncUpdates } = await import('@/db/DbUtils')
    
    // Мокируем ошибку при синхронизации
    const errorMock = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(syncUpdates).mockRejectedValue(new Error('Sync error'))
    
    // Компонент для тестирования контекста
    const TestComponent = () => {
      const { login } = useUser()
      return <button onClick={() => login('new-token')}>Войти</button>
    }
    
    const { getByText } = render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    )
    
    // Нажимаем кнопку входа
    act(() => {
      getByText('Войти').click()
    })
    
    // Ждем выполнения промиса
    await act(async () => {
      await Promise.resolve()
    })
    
    // Проверяем, что ошибка была залогирована
    expect(errorMock).toHaveBeenCalledWith('Ошибка при синхронизации:', expect.any(Error))
    
    // Проверяем, что dispatchEvent не был вызван, так как синхронизация завершилась с ошибкой
    expect(dispatchEventSpy).not.toHaveBeenCalled()
    
    // Восстанавливаем console.error
    errorMock.mockRestore()
  })
}) 