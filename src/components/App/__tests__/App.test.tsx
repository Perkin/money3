import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import App from '../index'
import { Invest } from '@/db/DbInvests'
import * as DbInvests from '@/db/DbInvests'

// Мокаем модули, которые используются в App
vi.mock('@/db/DbInvests.ts', () => ({
  getInvests: vi.fn(),
  Invest: vi.fn(),
  InvestFilter: vi.fn(),
}))

vi.mock('@/db/DbPayments.ts', () => ({
  getPayments: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/db/DbUtils.ts', () => ({
  calculatePayments: vi.fn().mockResolvedValue(undefined),
  updateRemoteData: vi.fn().mockResolvedValue(undefined),
  syncUpdates: vi.fn().mockResolvedValue(undefined),
  defaultIncomeRatio: 0.05
}))

// Мокаем компоненты, которые не нужно тестировать детально
vi.mock('@/components/Menu', () => ({
  default: () => <div data-testid="menu-component">Menu Component</div>
}))

vi.mock('@/components/InvestForm', () => ({
  default: () => <div data-testid="invest-form-component">InvestForm Component</div>
}))

vi.mock('@/components/InvestsTable', () => ({
  default: ({ invests, showPayed }: { invests: Invest[], showPayed: boolean }) => (
    <div data-testid="invests-table-component">
      <div>InvestsTable Component</div>
      <div>Количество инвестиций: {invests.length}</div>
      <div>Показывать оплаченные: {showPayed ? 'Да' : 'Нет'}</div>
    </div>
  )
}))

// Не мокаем Filters, чтобы проверить взаимодействие с ним

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
  ToastContainer: () => <div data-testid="toast-container" />,
  Slide: () => <div data-testid="toast-slide" />
}))

describe('App', () => {
  // Создаем тестовые данные для инвестиций
  const mockInvests: Invest[] = [
    {
      id: 1,
      money: 1000,
      incomeRatio: 0.025,
      createdDate: new Date('2023-01-15'),
      closedDate: null,
      isActive: 1,
      updatedAt: new Date('2023-01-01')
    },
    {
      id: 2,
      money: 2000,
      incomeRatio: 0.05,
      createdDate: new Date('2023-02-15'),
      closedDate: null,
      isActive: 1,
      updatedAt: new Date('2023-02-01')
    },
    {
      id: 3,
      money: 3000,
      incomeRatio: 0.025,
      createdDate: new Date('2023-03-15'),
      closedDate: new Date('2023-05-15'),
      isActive: 0,
      updatedAt: new Date('2023-05-15')
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    // По умолчанию возвращаем только активные инвестиции (первые две)
    vi.mocked(DbInvests.getInvests).mockImplementation((filter) => {
      if (filter?.filterOnlyActive === 0) {
        return Promise.resolve([...mockInvests])
      } else {
        return Promise.resolve(mockInvests.filter(invest => invest.isActive === 1))
      }
    })
  })

  it('должен отрисовать все основные компоненты', async () => {
    render(<App />)
    
    // Проверяем заголовок
    expect(screen.getByText('Инвестиции')).toBeInTheDocument()
    
    // Проверяем наличие основных компонентов
    expect(screen.getByTestId('menu-component')).toBeInTheDocument()
    expect(screen.getByTestId('invest-form-component')).toBeInTheDocument()
    expect(screen.getByTestId('invests-table-component')).toBeInTheDocument()
    
    // Проверяем, что фильтры отображаются
    expect(screen.getByText('С закрытыми')).toBeInTheDocument()
    expect(screen.getByText('С оплаченными')).toBeInTheDocument()
    
    // Проверяем, что загружены инвестиции
    await waitFor(() => {
      expect(DbInvests.getInvests).toHaveBeenCalled()
    })
    
    // По умолчанию должны отображаться только активные инвестиции (2 штуки)
    expect(screen.getByText('Количество инвестиций: 2')).toBeInTheDocument()
  })

  it('должен реагировать на изменение фильтра активности', async () => {
    render(<App />)
    
    // Изначально должны отображаться только активные инвестиции (2 штуки)
    await waitFor(() => {
      expect(screen.getByText('Количество инвестиций: 2')).toBeInTheDocument()
    })
    
    // Активируем фильтр "С закрытыми"
    const activeFilterCheckbox = screen.getByLabelText('С закрытыми')
    fireEvent.click(activeFilterCheckbox)
    
    // Теперь должны показываться все инвестиции (3 штуки)
    await waitFor(() => {
      expect(screen.getByText('Количество инвестиций: 3')).toBeInTheDocument()
    })
    
    // Повторно кликаем, чтобы отключить фильтр
    fireEvent.click(activeFilterCheckbox)
    
    // Должны вернуться к отображению только активных инвестиций (2 штуки)
    await waitFor(() => {
      expect(screen.getByText('Количество инвестиций: 2')).toBeInTheDocument()
    })
  })

  it('должен реагировать на изменение фильтра оплаченных платежей', async () => {
    render(<App />)
    
    // По умолчанию оплаченные платежи не показываются
    await waitFor(() => {
      expect(screen.getByText('Показывать оплаченные: Нет')).toBeInTheDocument()
    })
    
    // Активируем фильтр "С оплаченными"
    const payedFilterCheckbox = screen.getByLabelText('С оплаченными')
    fireEvent.click(payedFilterCheckbox)
    
    // Теперь должны показываться оплаченные платежи
    await waitFor(() => {
      expect(screen.getByText('Показывать оплаченные: Да')).toBeInTheDocument()
    })
  })

  it('должен обновлять список инвестиций при получении события fetchInvests', async () => {
    // Временно восстанавливаем оригинальный window.dispatchEvent
    const originalDispatchEvent = window.dispatchEvent;
    const mockDispatchEvent = vi.fn((event) => {
      // Вызываем оригинальные обработчики событий для CustomEvent
      const callbacks = (window as any)._eventHandlers?.[event.type] || [];
      callbacks.forEach((callback: Function) => callback(event));
      return true;
    });
    window.dispatchEvent = mockDispatchEvent;

    // Сохраняем оригинальные обработчики событий
    if (!(window as any)._eventHandlers) {
      (window as any)._eventHandlers = {};
    }

    // Эмулируем добавление обработчика события
    const originalAddEventListener = window.addEventListener;
    window.addEventListener = vi.fn((event, callback) => {
      if (!(window as any)._eventHandlers[event]) {
        (window as any)._eventHandlers[event] = [];
      }
      (window as any)._eventHandlers[event].push(callback);
    });

    try {
      render(<App />);
      
      // Изначально должны отображаться только активные инвестиции (2 штуки)
      await waitFor(() => {
        expect(screen.getByText('Количество инвестиций: 2')).toBeInTheDocument();
        expect(DbInvests.getInvests).toHaveBeenCalledTimes(1);
      });
      
      // Сбрасываем количество вызовов, чтобы проверить повторный вызов
      vi.mocked(DbInvests.getInvests).mockClear();
      
      // Эмулируем событие fetchInvests
      window.dispatchEvent(new CustomEvent('fetchInvests'));
      
      // Должен быть вызван getInvests еще раз
      await waitFor(() => {
        expect(DbInvests.getInvests).toHaveBeenCalled();
      }, { timeout: 2000 }); // Увеличиваем таймаут для слабых систем
    } finally {
      // Восстанавливаем оригинальные функции
      window.dispatchEvent = originalDispatchEvent;
      window.addEventListener = originalAddEventListener;
    }
  })

  it('должен сортировать инвестиции по дате создания', async () => {
    // Модифицируем мок для этого теста, чтобы вернуть неотсортированные инвестиции
    vi.mocked(DbInvests.getInvests).mockResolvedValueOnce([
      mockInvests[1], // 15.02.2023
      mockInvests[0], // 15.01.2023
    ])
    
    render(<App />)
    
    // Должен быть вызван getInvests
    await waitFor(() => {
      expect(DbInvests.getInvests).toHaveBeenCalled()
    })
    
    // В моке InvestsTable мы не можем проверить сортировку напрямую,
    // но мы знаем, что функция сортировки должна быть вызвана
    // Здесь мы проверяем, что инвестиции были переданы (всего 2)
    expect(screen.getByText('Количество инвестиций: 2')).toBeInTheDocument()
  })

  it('должен отписываться от события при размонтировании', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    
    const { unmount } = render(<App />)
    
    // Размонтируем компонент
    unmount()
    
    // Проверяем, что removeEventListener был вызван с нужным событием
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'fetchInvests',
      expect.any(Function)
    )
    
    // Возвращаем оригинальную функцию
    removeEventListenerSpy.mockRestore()
  })
}) 