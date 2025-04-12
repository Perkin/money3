import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import MenuButton from '../index'

describe('MenuButton', () => {
  it('должен корректно рендерить переданный текст', () => {
    render(<MenuButton onClick={() => {}}>Тестовая кнопка</MenuButton>)
    
    expect(screen.getByText('Тестовая кнопка')).toBeInTheDocument()
    expect(screen.getByRole('button')).toHaveTextContent('Тестовая кнопка')
  })
  
  it('должен вызывать функцию onClick при клике', () => {
    const mockOnClick = vi.fn()
    render(<MenuButton onClick={mockOnClick}>Кликни меня</MenuButton>)
    
    const button = screen.getByText('Кликни меня')
    fireEvent.click(button)
    
    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })
  
  it('должен корректно рендерить дочерние элементы', () => {
    render(
      <MenuButton onClick={() => {}}>
        <span data-testid="child-element">Тестовый элемент</span>
      </MenuButton>
    )
    
    expect(screen.getByTestId('child-element')).toBeInTheDocument()
    expect(screen.getByRole('button')).toContainElement(screen.getByTestId('child-element'))
  })
  
  it('должен иметь тип "button"', () => {
    render(<MenuButton onClick={() => {}}>Кнопка</MenuButton>)
    
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })
}) 