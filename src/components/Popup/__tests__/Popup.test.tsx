import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import Popup from '../index'

describe('Popup', () => {
  const mockOnClose = vi.fn()
  
  beforeEach(() => {
    mockOnClose.mockClear()
  })
  
  it('должен отображать переданные дочерние элементы', () => {
    render(
      <Popup onClose={mockOnClose}>
        <div data-testid="popup-content">Содержимое попапа</div>
      </Popup>
    )
    
    expect(screen.getByTestId('popup-content')).toBeInTheDocument()
    expect(screen.getByText('Содержимое попапа')).toBeInTheDocument()
  })
  
  it('должен вызывать onClose при клике на оверлей', () => {
    const { container } = render(
      <Popup onClose={mockOnClose}>
        <div>Содержимое попапа</div>
      </Popup>
    )
    
    // Находим оверлей (внешний div)
    const overlay = container.firstChild
    
    // Кликаем на оверлей
    if (overlay) {
      fireEvent.click(overlay)
    }
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })
  
  it('не должен вызывать onClose при клике на содержимое попапа', () => {
    render(
      <Popup onClose={mockOnClose}>
        <div data-testid="popup-content">Содержимое попапа</div>
      </Popup>
    )
    
    // Кликаем на содержимое попапа
    fireEvent.click(screen.getByTestId('popup-content'))
    
    expect(mockOnClose).not.toHaveBeenCalled()
  })
  
  it('должен вызывать onClose при нажатии клавиши Escape', () => {
    render(
      <Popup onClose={mockOnClose}>
        <div>Содержимое попапа</div>
      </Popup>
    )
    
    // Симулируем нажатие клавиши Escape
    fireEvent.keyDown(document, { key: 'Escape' })
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })
  
  it('не должен вызывать onClose при нажатии других клавиш', () => {
    render(
      <Popup onClose={mockOnClose}>
        <div>Содержимое попапа</div>
      </Popup>
    )
    
    // Симулируем нажатие другой клавиши
    fireEvent.keyDown(document, { key: 'Enter' })
    
    expect(mockOnClose).not.toHaveBeenCalled()
  })
}) 