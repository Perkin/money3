import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import InvestsTable from '../index';
import * as DbPayments from '@/db/DbPayments';
import { Invest } from '@/db/DbInvests';
import { Payment } from '@/db/DbPayments';

// Мокируем CurrentDateItem компонент
const CurrentDateItemMock = vi.fn();
CurrentDateItemMock.mockReturnValue(<div data-testid="current-date-item">Текущая дата</div>);
vi.mock('@/components/CurrentDateItem', () => ({
  default: (props: any) => CurrentDateItemMock(props)
}));

// Мокаем зависимость для получения платежей
vi.spyOn(DbPayments, 'getPayments').mockImplementation(async (filter) => {
  const investId = filter?.id;
  if (investId === 1) {
    return mockPayments.filter(payment => payment.investId === 1);
  } else if (investId === 2) {
    return mockPayments.filter(payment => payment.investId === 2);
  }
  return [];
});

// Готовим тестовые данные
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);

const mockInvests: Invest[] = [
  {
    id: 1,
    money: 10000,
    incomeRatio: 0.05,
    createdDate: new Date('2023-01-15'),
    closedDate: null,
    isActive: 1,
    updatedAt: new Date('2023-01-01')
  },
  {
    id: 2,
    money: 20000,
    incomeRatio: 0.025,
    createdDate: new Date('2023-02-15'),
    closedDate: null,
    isActive: 1,
    updatedAt: new Date('2023-02-01')
  }
];

const mockPayments: Payment[] = [
  {
    id: 101,
    investId: 1,
    money: 500,
    paymentDate: yesterday,
    isPayed: 0,
    updatedAt: yesterday
  },
  {
    id: 102,
    investId: 1,
    money: 500,
    paymentDate: tomorrow,
    isPayed: 0,
    updatedAt: yesterday
  },
  {
    id: 201,
    investId: 2,
    money: 500,
    paymentDate: yesterday,
    isPayed: 1, // Оплаченный платеж
    updatedAt: yesterday
  }
];

describe('InvestsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('должен отображать заголовки таблицы', async () => {
    render(<InvestsTable invests={[]} showPayed={false} />);
    
    // Проверяем отображение заголовков
    expect(screen.getByText('Создано')).toBeInTheDocument();
    expect(screen.getByText('Закрыто/Оплата')).toBeInTheDocument();
    expect(screen.getByText('Сумма')).toBeInTheDocument();
    expect(screen.getByText('Действия')).toBeInTheDocument();
  });

  it('должен загружать и отображать инвестиции с их платежами', async () => {
    render(<InvestsTable invests={mockInvests} showPayed={false} />);
    
    // Проверяем, что была попытка загрузить платежи
    await waitFor(() => {
      expect(DbPayments.getPayments).toHaveBeenCalledTimes(2);
      expect(DbPayments.getPayments).toHaveBeenCalledWith({ id: 1 });
      expect(DbPayments.getPayments).toHaveBeenCalledWith({ id: 2 });
    });
    
    // Проверяем отображение итоговых значений
    expect(screen.getByText('Итого')).toBeInTheDocument();
    expect(screen.getByText('Прибыль')).toBeInTheDocument();
    expect(screen.getByText('Долг')).toBeInTheDocument();
  });
  
  it('должен правильно фильтровать оплаченные платежи', async () => {
    // Сначала рендерим без отображения оплаченных платежей
    const { rerender } = render(<InvestsTable invests={mockInvests} showPayed={false} />);
    
    await waitFor(() => {
      expect(DbPayments.getPayments).toHaveBeenCalledTimes(2);
    });
    
    // Меняем флаг на отображение оплаченных платежей и перерендериваем
    rerender(<InvestsTable invests={mockInvests} showPayed={true} />);
    
    // Проверяем, что платежи загружаются повторно
    await waitFor(() => {
      expect(DbPayments.getPayments).toHaveBeenCalledTimes(4);
    });
  });
  
  it('должен правильно рассчитывать итоговые суммы', async () => {
    render(<InvestsTable invests={mockInvests} showPayed={false} />);
    
    await waitFor(() => {
      // Сумма активных инвестиций: 10000 + 20000 = 30000
      const totalElement = screen.getByText('Итого');
      const totalRow = totalElement.parentElement;
      expect(totalRow).toHaveTextContent(/30,000/);
      
      // Прибыль: 10000 * 0.05 + 20000 * 0.025 = 500 + 500 = 1000
      const incomeElement = screen.getByText('Прибыль');
      const incomeRow = incomeElement.parentElement;
      expect(incomeRow).toHaveTextContent(/1,000/);
      
      // Долг: 500 (просроченный неоплаченный платеж)
      const debtElement = screen.getByText('Долг');
      const debtRow = debtElement.parentElement;
      expect(debtRow).toHaveTextContent(/500/);
    });
  });
  
  it('должен правильно рассчитывать суммы для неактивных инвестиций', async () => {
    // Создаем набор инвестиций с активными и неактивными инвестициями
    const mixedInvests: Invest[] = [
      {
        id: 1,
        money: 10000,
        incomeRatio: 0.05,
        createdDate: new Date('2023-01-15'),
        closedDate: new Date('2023-02-15'),
        isActive: 0 as const, // Неактивная инвестиция
        updatedAt: new Date('2023-01-01')
      },
      {
        id: 2,
        money: 20000,
        incomeRatio: 0.025,
        createdDate: new Date('2023-02-15'),
        closedDate: null,
        isActive: 1 as const, // Активная инвестиция
        updatedAt: new Date('2023-02-01')
      },
      {
        id: 3,
        money: 15000,
        // @ts-ignore - Специально создаем incomeRatio: undefined для проверки значения по умолчанию
        incomeRatio: undefined, 
        createdDate: new Date('2023-03-15'),
        closedDate: null,
        isActive: 1 as const, // Активная инвестиция
        updatedAt: new Date('2023-03-01')
      }
    ];
    
    render(<InvestsTable invests={mixedInvests} showPayed={false} />);
    
    await waitFor(() => {
      // Сумма активных инвестиций: 0 (id=1 неактивна) + 20000 (id=2) + 15000 (id=3) = 35000
      const totalElement = screen.getByText('Итого');
      const totalRow = totalElement.parentElement;
      expect(totalRow).toHaveTextContent(/35,000/);
      
      // Прибыль: 0 (id=1 неактивна) + 20000 * 0.025 (id=2) + 15000 * 0.05 (id=3, используется значение по умолчанию) = 500 + 750 = 1250
      const incomeElement = screen.getByText('Прибыль');
      const incomeRow = incomeElement.parentElement;
      expect(incomeRow).toHaveTextContent(/1,250/);
    });
  });
  
  it('не должен отображать блок с долгом, если нет просроченных платежей', async () => {
    // Изменяем мок на отсутствие просроченных платежей
    vi.spyOn(DbPayments, 'getPayments').mockImplementation(async () => {
      return mockPayments.filter(p => p.paymentDate > today);
    });
    
    render(<InvestsTable invests={mockInvests} showPayed={false} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Долг')).not.toBeInTheDocument();
    });
  });

  it('отображает итоговую сумму в футере таблицы', () => {
    const mockInvests = [
      {
        id: 1,
        money: 10000,
        incomeRatio: 0.12,
        createdDate: new Date('2022-01-01'),
        closedDate: null,
        isActive: 1 as const,
        updatedAt: new Date()
      }
    ];
    
    render(<InvestsTable invests={mockInvests} showPayed={false} />);

    // Находим контейнер с заголовком "Итого"
    const totalElement = screen.getByText('Итого');
    const totalRow = totalElement.parentElement;
    
    // Проверяем наличие суммы в parentElement элемента с текстом "Итого"
    expect(totalRow).toHaveTextContent(/10,000/);
  });

  it('должен обрабатывать ошибки при загрузке платежей', async () => {
    // Мокируем консоль.error для перехвата вызова
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Мокируем getPayments чтобы он выбрасывал ошибку
    vi.spyOn(DbPayments, 'getPayments').mockRejectedValueOnce(new Error('Ошибка загрузки платежей'));
    
    render(<InvestsTable invests={[mockInvests[0]]} showPayed={false} />);
    
    // Проверяем, что ошибка была залогирована
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Ошибка при загрузке платежей:',
        expect.any(Error)
      );
    });
    
    // Восстанавливаем консоль
    consoleErrorSpy.mockRestore();
  });
  
  it('должен добавлять разделитель текущей даты между элементами', async () => {
    // Сбрасываем счетчик вызовов перед тестом
    CurrentDateItemMock.mockClear();
    
    // Создаем тестовые данные с инвестициями до и после текущего дня месяца
    const today = new Date();
    const todayDate = today.getDate();
    
    // Первая инвестиция с датой до текущего дня
    const firstDate = new Date(today);
    firstDate.setDate(todayDate - 2);
    
    // Вторая инвестиция с датой после или равной текущему дню
    const secondDate = new Date(today);
    secondDate.setDate(todayDate);
    
    const investsWithDatesSurroundingToday = [
      {
        id: 1,
        money: 10000,
        incomeRatio: 0.05,
        createdDate: firstDate,
        closedDate: null,
        isActive: 1 as const,
        updatedAt: new Date()
      },
      {
        id: 2,
        money: 20000,
        incomeRatio: 0.05,
        createdDate: secondDate,
        closedDate: null,
        isActive: 1 as const,
        updatedAt: new Date()
      }
    ];
    
    // Рендерим компонент
    render(<InvestsTable invests={investsWithDatesSurroundingToday} showPayed={false} />);
    
    // Ждем загрузки платежей
    await waitFor(() => {
      expect(DbPayments.getPayments).toHaveBeenCalledTimes(2);
    });
    
    // Проверяем, что CurrentDateItem был вызван 
    await waitFor(() => {
      // Проверяем, что компонент CurrentDateItem был вызван хотя бы один раз
      expect(CurrentDateItemMock).toHaveBeenCalled();
      
      // Визуально проверяем, что разделитель отображается
      expect(screen.getByTestId('current-date-item')).toBeInTheDocument();
    });
  });

  it('должен добавлять разделитель текущей даты перед первым элементом', async () => {
    // Сбрасываем счетчик вызовов перед тестом
    CurrentDateItemMock.mockClear();
    
    // Создаем тестовые данные с инвестицией после текущего дня месяца
    const today = new Date();
    const todayDate = today.getDate();
    
    // Инвестиция с датой равной или после текущего дня
    const afterDate = new Date(today);
    afterDate.setDate(todayDate + 1); // На день позже
    
    const investsAfterTodayDate = [
      {
        id: 1,
        money: 10000,
        incomeRatio: 0.05,
        createdDate: afterDate,
        closedDate: null,
        isActive: 1 as const,
        updatedAt: new Date()
      }
    ];
    
    // Рендерим компонент
    render(<InvestsTable invests={investsAfterTodayDate} showPayed={false} />);
    
    // Ждем загрузки платежей и отображения компонента
    await waitFor(() => {
      expect(DbPayments.getPayments).toHaveBeenCalled();
    }, { timeout: 5000 });
    
    // Проверяем отдельно, что CurrentDateItem был вызван
    expect(CurrentDateItemMock).toHaveBeenCalled();
    
    // Проверяем отдельно, что разделитель отображается
    const divider = screen.queryByTestId('current-date-item');
    expect(divider).toBeInTheDocument();
    
    // Проверяем отдельно наличие инвестиции - используем getAllByText и проверяем, что есть хотя бы один элемент
    const moneyElements = screen.getAllByText(/10,000/);
    expect(moneyElements.length).toBeGreaterThan(0);
  });

  it('должен рендерить инвестиции без разделителей, если даты не окружают текущий день', async () => {
    // Сбрасываем счетчик вызовов перед тестом
    CurrentDateItemMock.mockClear();
    
    // Создаем тестовые данные с обеими инвестициями до текущего дня месяца
    const today = new Date();
    const todayDate = today.getDate();
    
    // Первая инвестиция с датой до текущего дня
    const firstDate = new Date(today);
    firstDate.setDate(todayDate - 5);
    
    // Вторая инвестиция тоже с датой до текущего дня
    const secondDate = new Date(today);
    secondDate.setDate(todayDate - 2);
    
    const investsBeforeTodayDate = [
      {
        id: 1,
        money: 10000,
        incomeRatio: 0.05,
        createdDate: firstDate,
        closedDate: null,
        isActive: 1 as const,
        updatedAt: new Date()
      },
      {
        id: 2,
        money: 20000,
        incomeRatio: 0.05,
        createdDate: secondDate,
        closedDate: null,
        isActive: 1 as const,
        updatedAt: new Date()
      }
    ];
    
    // Рендерим компонент
    render(<InvestsTable invests={investsBeforeTodayDate} showPayed={false} />);
    
    // Ждем загрузки платежей
    await waitFor(() => {
      expect(DbPayments.getPayments).toHaveBeenCalled();
    }, { timeout: 5000 });
    
    // Проверяем, что CurrentDateItem НЕ был вызван, т.к. не нужны разделители
    expect(CurrentDateItemMock).not.toHaveBeenCalled();
    
    // Проверяем, что инвестиции отображаются
    expect(screen.getByText(/10,000/)).toBeInTheDocument();
    expect(screen.getByText(/20,000/)).toBeInTheDocument();
    
    // Проверяем, что нет разделителя
    expect(screen.queryByTestId('current-date-item')).not.toBeInTheDocument();
  });

  it('должен обрабатывать ошибки при работе с данными платежей', async () => {
    // Мокируем консоль.error для перехвата вызова
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Создаем инвестицию с некорректными данными
    const invalidInvest = {
      id: undefined, // намеренно делаем id undefined для вызова ошибки
      money: 10000,
      incomeRatio: 0.05,
      createdDate: new Date('2023-01-15'),
      closedDate: null,
      isActive: 1 as const,
      updatedAt: new Date('2023-01-01')
    };
    
    render(<InvestsTable invests={[invalidInvest as any]} showPayed={false} />);
    
    // Проверяем, что заголовки отображаются даже при ошибке
    expect(screen.getByText('Создано')).toBeInTheDocument();
    expect(screen.getByText('Закрыто/Оплата')).toBeInTheDocument();
    
    // Проверяем, что итоговые значения рассчитываются корректно
    expect(screen.getByText('Итого')).toBeInTheDocument();
    const totalElement = screen.getByText('Итого');
    const totalRow = totalElement.parentElement;
    expect(totalRow).toHaveTextContent(/10,000/);
    
    // Восстанавливаем консоль
    consoleErrorSpy.mockRestore();
  });
}); 