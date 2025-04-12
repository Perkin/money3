import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import User from '../index'
import { useUser } from '../../UserContext'

// Мокаем хук useUser
vi.mock('../../UserContext', () => ({
  useUser: vi.fn()
}))

describe('User', () => {
  it('должен отображать имя пользователя, когда пользователь авторизован', () => {
    // Настраиваем мок useUser для возврата пользователя
    vi.mocked(useUser).mockReturnValue({
      user: { username: 'testuser', email: 'test@example.com' },
      login: vi.fn(),
      logout: vi.fn()
    })
    
    render(<User />)
    
    // Проверяем, что имя пользователя отображается
    expect(screen.getByText('testuser')).toBeInTheDocument()
  })
  
  it('должен отображать пустой блок, когда пользователь не авторизован', () => {
    // Настраиваем мок useUser для возврата null пользователя
    vi.mocked(useUser).mockReturnValue({
      user: null,
      login: vi.fn(),
      logout: vi.fn()
    })
    
    const { container } = render(<User />)
    
    // Проверяем, что блок пустой (не содержит текст)
    const userBlock = container.firstChild
    expect(userBlock).toBeInTheDocument()
    expect(userBlock?.textContent).toBe('')
  })
  
  it('должен использовать CSS класс для стилизации', () => {
    // Настраиваем мок useUser для возврата пользователя
    vi.mocked(useUser).mockReturnValue({
      user: { username: 'testuser', email: 'test@example.com' },
      login: vi.fn(),
      logout: vi.fn()
    })
    
    const { container } = render(<User />)
    
    // Проверяем, что применен CSS класс
    const userElement = container.firstChild as HTMLElement
    expect(userElement.className).toMatch(/userName/)
  })
}) 