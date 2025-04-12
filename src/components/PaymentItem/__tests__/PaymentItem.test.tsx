import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import PaymentItem from '../index'
import { Payment } from '@/db/DbPayments.ts'
import { toast } from 'react-toastify'

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

// Мок для EditPaymentForm
vi.mock('@/components/EditPaymentForm', () => ({
  default: ({ payment, onClose }: { payment: Payment, onClose: () => void }) => (
    <div data-testid="edit-payment-form">
      <div>Редактирование платежа {payment.id}</div>
      <button onClick={onClose} data-testid="close-edit-form">Закрыть</button>
    </div>
  )
}))

// Мок для Popup
vi.mock('@/components/Popup', () => ({
  default: ({ children, onClose }: { children: React.ReactNode, onClose: () => void }) => (
    <div data-testid="popup">
      <button data-testid="close-popup" onClick={onClose}>X</button>
      {children}
    </div>
  )
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
    
    // Проверяем формат даты с учетом русской локали
    expect(screen.getByText('2023-янв-15')).toBeInTheDocument()
    
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
      expect(toast.success).toHaveBeenCalledWith('Долг оплачен')
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

    // Проверяем, что форма редактирования отображается
    expect(screen.getByTestId('edit-payment-form')).toBeInTheDocument()
    expect(screen.getByText(`Редактирование платежа ${mockPayment.id}`)).toBeInTheDocument()
  })

  // Новый тест: закрытие формы редактирования
  it('should close edit form when close button is clicked', () => {
    render(
      <PaymentItem 
        payment={mockPayment} 
        isEven={false} 
        isDebt={false}
        onClosePayment={mockOnClosePayment}
      />
    )

    // Открываем форму редактирования
    fireEvent.click(screen.getByTitle('Редактировать платёж'))
    expect(screen.getByTestId('edit-payment-form')).toBeInTheDocument()

    // Закрываем форму
    fireEvent.click(screen.getByTestId('close-edit-form'))
    
    // Проверяем, что форма закрылась и вызван колбэк
    expect(screen.queryByTestId('edit-payment-form')).not.toBeInTheDocument()
    expect(mockOnClosePayment).toHaveBeenCalled()
  })

  // Новый тест: обработка ошибок при закрытии платежа
  it('should handle errors when closing payment', async () => {
    // Мокаем closePayment, чтобы он возвращал ошибку
    const { closePayment } = await import('@/db/DbPayments.ts')
    const { toast } = await import('react-toastify')
    
    vi.mocked(closePayment).mockRejectedValueOnce(new Error('Тестовая ошибка'));

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

    // Проверяем обработку ошибки
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Ошибка: Тестовая ошибка')
      expect(mockOnClosePayment).not.toHaveBeenCalled()
    })
  })

  // Новый тест: отображение стилей для просроченного платежа
  it('should apply special styles for overdue payments', () => {
    // Создаем DOM-элемент для проверки стилей
    const containerDiv = document.createElement('div');
    document.body.appendChild(containerDiv);

    const { container: renderContainer } = render(
      <PaymentItem 
        payment={mockPayment} 
        isEven={false} 
        isDebt={true}
        onClosePayment={mockOnClosePayment}
      />,
      { container: containerDiv }
    )

    // Находим элемент с данными платежа
    const dataItem = renderContainer.querySelector('[class*="dataItem"]');
    expect(dataItem).not.toBeNull();
    
    // Проверяем наличие класса для просроченного платежа
    // Используем contains вместо toHaveClass, так как классы модульные и имеют хэш
    expect(dataItem?.className).toContain('debt');
  })

  // Новый тест: обработка неуспешного закрытия платежа
  it('should handle unsuccessful payment closing', async () => {
    // Мокаем closePayment, чтобы он возвращал неправильный ID
    const { closePayment } = await import('@/db/DbPayments.ts')
    const { toast } = await import('react-toastify')
    
    vi.mocked(closePayment).mockResolvedValueOnce(999); // Другой ID

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

    // Проверяем обработку ошибки
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Не удалось оплатить платеж')
      expect(mockOnClosePayment).not.toHaveBeenCalled()
    })
  })

  // Новый тест: обработка ошибки, которая не является экземпляром Error
  it('should handle error that is not an Error instance', async () => {
    // Мокаем closePayment, чтобы он возвращал ошибку не экземпляр Error
    const { closePayment } = await import('@/db/DbPayments.ts')
    const { toast } = await import('react-toastify')
    
    vi.mocked(closePayment).mockRejectedValueOnce('Строковая ошибка');

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

    // Проверяем обработку ошибки
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Ошибка: Неизвестная ошибка')
      expect(mockOnClosePayment).not.toHaveBeenCalled()
    })
  })
}) 