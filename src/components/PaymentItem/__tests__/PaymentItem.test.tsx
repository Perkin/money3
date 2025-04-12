import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import PaymentItem from '../index'
import { Payment } from '@/db/DbPayments.ts'

// Мок модуля DbPayments
vi.mock('@/db/DbPayments.ts', () => ({
  closePayment: vi.fn().mockResolvedValue(1),
  Payment: vi.fn(),
  updatePayment: vi.fn().mockResolvedValue(1),
}))

// Мок модуля для calculatePayments и updateRemoteData
vi.mock('@/db/DbUtils.ts', () => ({
  calculatePayments: vi.fn().mockResolvedValue(undefined),
  updateRemoteData: vi.fn().mockResolvedValue(undefined),
}))

// Мок для react-toastify
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('PaymentItem', () => {
  const mockPayment: Payment = {
    id: 1,
    investId: 100,
    money: 1000,
    paymentDate: new Date('2023-01-15'),
    isPayed: 0,
    updatedAt: new Date('2023-01-01'),
  }

  const mockOnClosePayment = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render payment details correctly', () => {
    render(
      <PaymentItem 
        payment={mockPayment} 
        isEven={true} 
        isDebt={false}
        onClosePayment={mockOnClosePayment}
      />
    )
    
    // Проверяем формат даты, который фактически отображается в компоненте
    expect(screen.getByText('2023-Jan-15')).toBeInTheDocument()
    
    // Проверяем сумму в формате, который фактически отображается
    expect(screen.getByText('1,000 ₽')).toBeInTheDocument()
  })

  it('should display payment status based on isPayed', () => {
    const paidPayment: Payment = {
      ...mockPayment,
      isPayed: 1,
    }

    const { rerender } = render(
      <PaymentItem 
        payment={mockPayment} 
        isEven={false} 
        isDebt={false}
        onClosePayment={mockOnClosePayment}
      />
    )

    // Непогашенный платеж должен иметь кнопку закрытия
    expect(screen.getByTitle('Оплата произведена')).toBeInTheDocument()

    // Перерендер с погашенным платежом
    rerender(
      <PaymentItem 
        payment={paidPayment} 
        isEven={false} 
        isDebt={false}
        onClosePayment={mockOnClosePayment}
      />
    )

    // Погашенный платеж не должен иметь кнопку закрытия
    expect(screen.queryByTitle('Оплата произведена')).not.toBeInTheDocument()
  })

  it('should handle close payment button click', async () => {
    // Получаем модули с реальными реализациями
    const { closePayment } = await import('@/db/DbPayments.ts')
    const { calculatePayments, updateRemoteData } = await import('@/db/DbUtils.ts')
    
    // Сбрасываем моки перед тестом
    vi.mocked(closePayment).mockClear();
    vi.mocked(calculatePayments).mockClear();
    vi.mocked(updateRemoteData).mockClear();
    mockOnClosePayment.mockClear();

    render(
      <PaymentItem 
        payment={mockPayment} 
        isEven={false} 
        isDebt={false}
        onClosePayment={mockOnClosePayment}
      />
    )

    // Клик по кнопке закрытия платежа
    fireEvent.click(screen.getByTitle('Оплата произведена'))

    // Добавляем await, чтобы дождаться выполнения промисов
    await vi.waitFor(() => {
      // Проверка вызова функций
      expect(closePayment).toHaveBeenCalledWith(mockPayment.id)
      expect(calculatePayments).toHaveBeenCalled()
      expect(updateRemoteData).toHaveBeenCalled()
      expect(mockOnClosePayment).toHaveBeenCalled()
    })
  })

  it('should show edit form when edit button is clicked', () => {
    render(
      <PaymentItem 
        payment={mockPayment} 
        isEven={false} 
        isDebt={false}
        onClosePayment={mockOnClosePayment}
      />
    )

    // Клик по кнопке редактирования
    fireEvent.click(screen.getByTitle('Редактировать платёж'))

    // Проверяем, что форма редактирования отображается через поиск её элементов
    const formElement = screen.getByText('Сумма:').closest('form')
    expect(formElement).toBeInTheDocument()
    
    // Проверяем наличие полей формы редактирования
    expect(screen.getByText('Сумма:')).toBeInTheDocument()
    expect(screen.getByText('Дата платежа:')).toBeInTheDocument()
    expect(screen.getByText('Статус:')).toBeInTheDocument()
    
    // Проверяем наличие кнопок
    expect(screen.getByText('Сохранить')).toBeInTheDocument()
    expect(screen.getByText('Отмена')).toBeInTheDocument()
    
    // Проверяем, что инпуты с правильными значениями есть в форме
    const numberInput = screen.getByDisplayValue('1000')
    expect(numberInput).toBeInTheDocument()
    expect(numberInput.getAttribute('type')).toBe('number')
    
    const dateInput = screen.getByDisplayValue('2023-01-15')
    expect(dateInput).toBeInTheDocument()
    expect(dateInput.getAttribute('type')).toBe('date')
  })
}) 