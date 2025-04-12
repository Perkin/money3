import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import Filters from '../index'

describe('Filters', () => {
  it('должен корректно отображать чекбоксы с переданными значениями', () => {
    const mockSetActiveFilter = vi.fn()
    const mockSetShowPayed = vi.fn()
    
    render(
      <Filters 
        activeFilter={true} 
        setActiveFilter={mockSetActiveFilter} 
        showPayed={false} 
        setShowPayed={mockSetShowPayed} 
      />
    )
    
    // Получаем чекбоксы
    const activeFilterCheckbox = screen.getByLabelText('С закрытыми')
    const showPayedCheckbox = screen.getByLabelText('С оплаченными')
    
    // Проверяем исходное состояние чекбоксов
    expect(activeFilterCheckbox).toBeChecked()
    expect(showPayedCheckbox).not.toBeChecked()
  })
  
  it('должен вызывать функции обратного вызова при изменении состояния activeFilter', () => {
    const mockSetActiveFilter = vi.fn()
    const mockSetShowPayed = vi.fn()
    
    render(
      <Filters 
        activeFilter={false} 
        setActiveFilter={mockSetActiveFilter} 
        showPayed={false} 
        setShowPayed={mockSetShowPayed} 
      />
    )
    
    // Получаем чекбокс "С закрытыми"
    const activeFilterCheckbox = screen.getByLabelText('С закрытыми')
    
    // Имитируем клик по чекбоксу
    fireEvent.click(activeFilterCheckbox)
    
    // Проверяем, что функция обратного вызова была вызвана с правильным значением
    expect(mockSetActiveFilter).toHaveBeenCalledTimes(1)
    expect(mockSetActiveFilter).toHaveBeenCalledWith(true)
  })
  
  it('должен вызывать функции обратного вызова при изменении состояния showPayed', () => {
    const mockSetActiveFilter = vi.fn()
    const mockSetShowPayed = vi.fn()
    
    render(
      <Filters 
        activeFilter={false} 
        setActiveFilter={mockSetActiveFilter} 
        showPayed={false} 
        setShowPayed={mockSetShowPayed} 
      />
    )
    
    // Получаем чекбокс "С оплаченными"
    const showPayedCheckbox = screen.getByLabelText('С оплаченными')
    
    // Имитируем клик по чекбоксу
    fireEvent.click(showPayedCheckbox)
    
    // Проверяем, что функция обратного вызова была вызвана с правильным значением
    expect(mockSetShowPayed).toHaveBeenCalledTimes(1)
    expect(mockSetShowPayed).toHaveBeenCalledWith(true)
  })
}) 