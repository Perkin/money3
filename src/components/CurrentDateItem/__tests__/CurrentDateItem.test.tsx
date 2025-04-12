import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import CurrentDateItem from '../index'

describe('CurrentDateItem', () => {
  it('должен рендериться с правильным CSS классом', () => {
    const { container } = render(<CurrentDateItem />)
    
    // Находим элемент div, который должен иметь класс из CSS модуля
    const dateItemElement = container.querySelector('div')
    expect(dateItemElement).toBeInTheDocument()
    
    // Проверяем, что элемент имеет класс из CSS модуля
    // В тестах классы из CSS модулей преобразуются в строку вида "_класс_хеш"
    expect(dateItemElement?.className).toBeTruthy()
    expect(dateItemElement?.className).toContain('_')
    
    // Проверяем, что компонент не содержит текст
    expect(dateItemElement?.textContent).toBe('')
    
    // Проверяем, что компонент является пустым div элементом
    expect(dateItemElement?.childNodes.length).toBe(0)
  })
}) 