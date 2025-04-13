import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import InvestItem from '../index'
import { Invest } from '@/db/DbInvests'
import { Payment } from '@/db/DbPayments'
import * as DbInvests from '@/db/DbInvests'
import * as DbPayments from '@/db/DbPayments'
import * as DbUtils from '@/db/DbUtils'
import { toast } from 'react-toastify'

// Мокаем только основные функции, используемые в этом тесте
// Не дублируем моки, которые уже есть в глобальном setup.ts
vi.spyOn(DbInvests, 'closeInvest').mockResolvedValue(1);
vi.spyOn(DbPayments, 'closePayment').mockResolvedValue(1);
vi.spyOn(DbUtils, 'updateRemoteData').mockResolvedValue(undefined);
vi.spyOn(toast, 'success').mockImplementation(() => 1);
vi.spyOn(toast, 'error').mockImplementation(() => 1);
vi.spyOn(toast, 'info').mockImplementation(() => 1);

// Мокаем только компоненты, которые используются в этом тесте
vi.mock('@/components/PaymentItem', () => ({
  default: ({ payment, isDebt }: { payment: Payment, isDebt: boolean }) => (
    <div 
      data-testid={`payment-item-${payment.id}`} 
      className={isDebt ? 'debt' : ''}
    >
      Payment {payment.id} - {payment.money}₽
      {isDebt && <span data-testid="debt-marker">Просрочен</span>}
    </div>
  )
}))

vi.mock('@/components/EditInvestForm', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="edit-invest-form">
      <button onClick={onClose} data-testid="close-edit-form">Закрыть</button>
    </div>
  )
}))

vi.mock('@/components/Popup', () => ({
  default: ({ children, onClose }: { children: React.ReactNode, onClose: () => void }) => (
    <div data-testid="popup">
      <button data-testid="close-popup" onClick={onClose}>X</button>
      {children}
    </div>
  )
}))

describe('InvestItem', () => {
  // Настройка тестовых данных
  const today = new Date()
  const yesterdayDate = new Date(today)
  yesterdayDate.setDate(today.getDate() - 1)
  
  const tomorrowDate = new Date(today)
  tomorrowDate.setDate(today.getDate() + 1)
  
  // Создаем правильные объекты Invest согласно интерфейсу
  const mockActiveInvest: Invest = {
    id: 1,
    money: 10000,
    createdDate: new Date(today),
    updatedAt: new Date(today),
    incomeRatio: 0.15,
    isActive: 1,
    closedDate: null
  }
  
  const mockClosedInvest: Invest = {
    id: 2,
    money: 20000,
    createdDate: new Date('2023-01-01'),
    closedDate: new Date('2023-06-01'),
    updatedAt: new Date('2023-06-01'),
    incomeRatio: 0.2,
    isActive: 0
  }
  
  // Создаем правильные объекты Payment согласно интерфейсу
  const mockPayments: Payment[] = [
    {
      id: 101,
      investId: 1,
      money: 1500,
      paymentDate: new Date(yesterdayDate),
      isPayed: 0,
      updatedAt: new Date(today)
    },
    {
      id: 102,
      investId: 1,
      money: 1500,
      paymentDate: new Date(tomorrowDate),
      isPayed: 0,
      updatedAt: new Date(today)
    }
  ]
  
  const mockRefreshData = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
    // window.confirm уже замокан в setup.ts, нам нужно только переопределить его для отдельных тестов
    window.confirm = vi.fn(() => true)
  })
  
  it('должен отображать активную инвестицию с кнопками действий', () => {
    render(
      <InvestItem 
        invest={mockActiveInvest} 
        isEven={false} 
        payments={[]} 
        onRefreshData={mockRefreshData} 
      />
    )
    
    // Используем регулярное выражение для поиска суммы независимо от пробелов
    expect(screen.getByText(/10[,\s]000\s*₽/)).toBeInTheDocument()
    expect(screen.getByText(/15/)).toBeInTheDocument()
    
    // Проверяем наличие кнопок для активной инвестиции
    expect(screen.getByTitle('Редактировать инвестицию')).toBeInTheDocument()
    expect(screen.getByTitle('Закрыть инвестицию')).toBeInTheDocument()
  })
  
  it('должен отображать закрытую инвестицию без кнопок действий', () => {
    render(
      <InvestItem 
        invest={mockClosedInvest} 
        isEven={true} 
        payments={[]} 
        onRefreshData={mockRefreshData} 
      />
    )
    
    // Используем регулярное выражение для поиска суммы независимо от пробелов
    expect(screen.getByText(/20[,\s]000\s*₽/)).toBeInTheDocument()
    
    // Проверяем наличие процента в формате (20%), но более точно
    const moneyElement = screen.getByText(/20[,\s]000\s*₽/);
    expect(moneyElement.closest('div')).toHaveTextContent(/20\s*%/);
    
    // Проверяем отсутствие кнопок для закрытой инвестиции
    expect(screen.queryByTitle('Редактировать инвестицию')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Закрыть инвестицию')).not.toBeInTheDocument()
  })
  
  it('должен отображать связанные платежи', () => {
    render(
      <InvestItem 
        invest={mockActiveInvest} 
        isEven={false} 
        payments={mockPayments} 
        onRefreshData={mockRefreshData} 
      />
    )
    
    // Проверяем, что все платежи отображаются
    expect(screen.getByTestId('payment-item-101')).toBeInTheDocument()
    expect(screen.getByTestId('payment-item-102')).toBeInTheDocument()
  })
  
  it('должен открывать форму редактирования при клике на кнопку редактирования', () => {
    render(
      <InvestItem 
        invest={mockActiveInvest} 
        isEven={false} 
        payments={[]} 
        onRefreshData={mockRefreshData} 
      />
    )
    
    // Кликаем на кнопку редактирования
    fireEvent.click(screen.getByTitle('Редактировать инвестицию'))
    
    // Проверяем, что форма редактирования отображается
    expect(screen.getByTestId('edit-invest-form')).toBeInTheDocument()
  })
  
  it('должен закрывать форму редактирования при нажатии на кнопку закрытия', () => {
    render(
      <InvestItem 
        invest={mockActiveInvest} 
        isEven={false} 
        payments={[]} 
        onRefreshData={mockRefreshData} 
      />
    )
    
    // Открываем форму редактирования
    fireEvent.click(screen.getByTitle('Редактировать инвестицию'))
    
    // Проверяем, что форма редактирования отображается
    expect(screen.getByTestId('edit-invest-form')).toBeInTheDocument()
    
    // Закрываем форму редактирования
    fireEvent.click(screen.getByTestId('close-edit-form'))
    
    // Проверяем, что форма редактирования скрыта
    expect(screen.queryByTestId('edit-invest-form')).not.toBeInTheDocument()
    
    // Проверяем, что был вызван обработчик обновления данных
    expect(mockRefreshData).toHaveBeenCalled()
  })
  
  it('должен запрашивать подтверждение перед закрытием инвестиции', () => {
    render(
      <InvestItem 
        invest={mockActiveInvest} 
        isEven={false} 
        payments={[]} 
        onRefreshData={mockRefreshData} 
      />
    )
    
    // Кликаем на кнопку закрытия инвестиции
    fireEvent.click(screen.getByTitle('Закрыть инвестицию'))
    
    // Проверяем, что был вызван confirm
    expect(window.confirm).toHaveBeenCalledWith('Точно закрыть?')
    
    // При успешном confirm должен вызваться closeInvest
    expect(DbInvests.closeInvest).toHaveBeenCalledWith(1)
  })
  
  it('не должен закрывать инвестицию, если пользователь отклонил подтверждение', async () => {
    // Мокаем confirm, чтобы он возвращал false
    window.confirm = vi.fn(() => false)
    
    render(
      <InvestItem 
        invest={mockActiveInvest} 
        isEven={false} 
        payments={[]} 
        onRefreshData={mockRefreshData} 
      />
    )
    
    // Кликаем на кнопку закрытия инвестиции
    fireEvent.click(screen.getByTitle('Закрыть инвестицию'))
    
    // Проверяем, что был вызван confirm
    expect(window.confirm).toHaveBeenCalledWith('Точно закрыть?')
    
    // При отрицательном confirm НЕ должен вызваться closeInvest
    expect(DbInvests.closeInvest).not.toHaveBeenCalled()
  })

  it('должен успешно закрывать инвестицию и связанные платежи', async () => {
    // Сбрасываем моки
    vi.spyOn(toast, 'success').mockClear();
    mockRefreshData.mockClear();
    
    render(
      <InvestItem 
        invest={mockActiveInvest} 
        isEven={false} 
        payments={mockPayments} 
        onRefreshData={mockRefreshData} 
      />
    )
    
    // Кликаем на кнопку закрытия инвестиции
    fireEvent.click(screen.getByTitle('Закрыть инвестицию'))
    
    // Проверяем, что был вызван closeInvest с правильным ID
    expect(DbInvests.closeInvest).toHaveBeenCalledWith(1)
    
    // Ждем завершения асинхронных операций
    await waitFor(() => {
      // Проверяем, что были закрыты все связанные платежи
      expect(DbPayments.closePayment).toHaveBeenCalledWith(101)
      expect(DbPayments.closePayment).toHaveBeenCalledWith(102)
      
      // Проверяем уведомление об успешном закрытии инвестиции
      expect(toast.success).toHaveBeenCalledWith('Инвестиция закрыта')
      
      // Проверяем, что был вызван обработчик обновления данных
      expect(mockRefreshData).toHaveBeenCalled()
      
      // Проверяем, что данные были синхронизированы с сервером
      expect(DbUtils.updateRemoteData).toHaveBeenCalled()
    })
  })

  it('должен обрабатывать ошибку при закрытии инвестиции', async () => {
    // Мокаем closeInvest, чтобы он возвращал ошибку
    vi.spyOn(DbInvests, 'closeInvest').mockRejectedValueOnce(new Error('Ошибка закрытия инвестиции'))
    
    render(
      <InvestItem 
        invest={mockActiveInvest} 
        isEven={false} 
        payments={[]} 
        onRefreshData={mockRefreshData} 
      />
    )
    
    // Кликаем на кнопку закрытия инвестиции
    fireEvent.click(screen.getByTitle('Закрыть инвестицию'))
    
    // Ждем завершения асинхронных операций
    await waitFor(() => {
      // Проверяем, что была показана ошибка
      expect(toast.error).toHaveBeenCalledWith('Ошибка: Ошибка закрытия инвестиции')
      
      // Проверяем, что обработчик обновления данных не был вызван
      expect(mockRefreshData).not.toHaveBeenCalled()
    })
  })

  it('должен обрабатывать неуспешное закрытие инвестиции', async () => {
    // Мокаем closeInvest, чтобы он возвращал неправильный ID
    vi.spyOn(DbInvests, 'closeInvest').mockResolvedValueOnce(2)
    
    render(
      <InvestItem 
        invest={mockActiveInvest} 
        isEven={false} 
        payments={[]} 
        onRefreshData={mockRefreshData} 
      />
    )
    
    // Кликаем на кнопку закрытия инвестиции
    fireEvent.click(screen.getByTitle('Закрыть инвестицию'))
    
    // Ждем завершения асинхронных операций
    await waitFor(() => {
      // Проверяем, что была показана ошибка
      expect(toast.error).toHaveBeenCalledWith('Не удалось закрыть инвестицию')
      
      // Проверяем, что обработчик обновления данных не был вызван
      expect(mockRefreshData).not.toHaveBeenCalled()
    })
  })

  it('должен обрабатывать ошибку при закрытии связанного платежа', async () => {
    // Восстанавливаем успешное закрытие инвестиции
    vi.spyOn(DbInvests, 'closeInvest').mockResolvedValue(1)
    
    // Мокаем closePayment, чтобы он выбрасывал ошибку
    vi.spyOn(DbPayments, 'closePayment').mockRejectedValueOnce('Строковая ошибка')
    
    render(
      <InvestItem 
        invest={mockActiveInvest} 
        isEven={false} 
        payments={mockPayments} 
        onRefreshData={mockRefreshData} 
      />
    )
    
    // Кликаем на кнопку закрытия инвестиции
    fireEvent.click(screen.getByTitle('Закрыть инвестицию'))
    
    // Ждем завершения асинхронных операций
    await waitFor(() => {
      // Проверяем, что была показана ошибка (этот тест проверяет ветку error instanceof Error ? error.message : 'Неизвестная ошибка')
      expect(toast.error).toHaveBeenCalledWith('Ошибка: Неизвестная ошибка')
      
      // Проверяем, что продолжилось закрытие других платежей
      expect(DbPayments.closePayment).toHaveBeenCalledWith(102)
    })
  })

  it('должен обрабатывать неуспешное закрытие связанного платежа', async () => {
    // Восстанавливаем успешное закрытие инвестиции
    vi.spyOn(DbInvests, 'closeInvest').mockResolvedValue(1)
    
    // Мокаем closePayment, чтобы первый вызов возвращал неправильный ID, а второй - успешный
    vi.spyOn(DbPayments, 'closePayment')
      .mockResolvedValueOnce(999) // Неправильный ID
      .mockResolvedValueOnce(102) // Правильный ID
    
    render(
      <InvestItem 
        invest={mockActiveInvest} 
        isEven={false} 
        payments={mockPayments} 
        onRefreshData={mockRefreshData} 
      />
    )
    
    // Кликаем на кнопку закрытия инвестиции
    fireEvent.click(screen.getByTitle('Закрыть инвестицию'))
    
    // Ждем завершения асинхронных операций
    await waitFor(() => {
      // Проверяем, что была показана ошибка
      expect(toast.error).toHaveBeenCalledWith('Не удалось закрыть активный долг')
      
      // Проверяем, что продолжилось закрытие других платежей
      expect(DbPayments.closePayment).toHaveBeenCalledWith(102)
      
      // Проверяем, что для успешно закрытого платежа показано уведомление
      expect(toast.info).toHaveBeenCalledWith('Долг автоматически оплачен')
    })
  })

  // Новый тест: проверка корректного отображения просроченных платежей
  it('должен правильно определять и отображать просроченные платежи', () => {
    // Устанавливаем текущую дату
    const realToday = new Date();
    
    // Создаем просроченный и будущий платежи
    const overduePayment: Payment = {
      id: 201,
      investId: 1,
      money: 2000,
      paymentDate: new Date(realToday.getTime() - 86400000), // вчера
      isPayed: 0,
      updatedAt: realToday
    };
    
    const futurePayment: Payment = {
      id: 202,
      investId: 1,
      money: 2000,
      paymentDate: new Date(realToday.getTime() + 86400000), // завтра
      isPayed: 0,
      updatedAt: realToday
    };
    
    render(
      <InvestItem 
        invest={mockActiveInvest} 
        isEven={false} 
        payments={[overduePayment, futurePayment]} 
        onRefreshData={mockRefreshData} 
      />
    )
    
    // Проверяем, что просроченный платеж имеет маркер долга
    const overduePaymentElement = screen.getByTestId('payment-item-201');
    expect(overduePaymentElement).toBeInTheDocument();
    expect(screen.getByTestId('debt-marker')).toBeInTheDocument();
    
    // Проверяем, что будущий платеж не имеет маркера долга
    const futurePaymentElement = screen.getByTestId('payment-item-202');
    expect(futurePaymentElement).toBeInTheDocument();
    expect(futurePaymentElement).not.toContainElement(screen.queryByText('Просрочен'));
  })
  
  // Новый тест: проверка форматирования дат и сумм
  it('должен правильно форматировать даты и суммы с помощью утилит форматирования', () => {
    // Создаем инвестицию с конкретными датами
    const testInvest: Invest = {
      id: 3,
      money: 15000,
      createdDate: new Date('2023-05-15'),
      closedDate: new Date('2023-11-20'),
      updatedAt: new Date('2023-11-20'),
      incomeRatio: 0.18,
      isActive: 0
    };
    
    render(
      <InvestItem 
        invest={testInvest} 
        isEven={true} 
        payments={[]} 
        onRefreshData={mockRefreshData} 
      />
    )
    
    // Проверяем отображение дат в формате, который используется в приложении
    expect(screen.getByText('2023-май-15')).toBeInTheDocument();
    expect(screen.getByText('2023-нояб-20')).toBeInTheDocument();
    
    // Проверяем форматирование суммы
    expect(screen.getByText(/15,000 ₽/)).toBeInTheDocument();
    
    // Проверяем отображение процента
    expect(screen.getByText(/\(18%\)/)).toBeInTheDocument();
  })
}) 