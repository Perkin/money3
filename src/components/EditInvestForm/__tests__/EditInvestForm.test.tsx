import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EditInvestForm from '../index';
import * as DbInvests from '@/db/DbInvests';
import * as DbUtils from '@/db/DbUtils';
import { toast } from 'react-toastify';

// Мокаем зависимости
vi.spyOn(DbInvests, 'updateInvest').mockResolvedValue(1);
vi.spyOn(DbUtils, 'updateRemoteData').mockResolvedValue(undefined);
vi.spyOn(toast, 'success').mockImplementation(() => 1);
vi.spyOn(toast, 'error').mockImplementation(() => 1);

// Создаем тестовые данные
const mockInvest = {
  id: 1,
  money: 10000,
  incomeRatio: 0.05,
  createdDate: new Date('2023-05-15'),
  closedDate: null,
  isActive: 1 as 0 | 1,
  updatedAt: new Date('2023-05-15')
};

describe('EditInvestForm', () => {
  const mockOnClose = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('должен отображать форму с заполненными полями', () => {
    render(<EditInvestForm invest={mockInvest} onClose={mockOnClose} />);
    
    // Проверяем, что форма содержит поля с правильными значениями
    const moneyInput = screen.getByLabelText('Сумма:');
    expect(moneyInput).toBeInTheDocument();
    expect(moneyInput).toHaveValue(10000);
    
    const dateInput = screen.getByLabelText('Дата создания:');
    expect(dateInput).toBeInTheDocument();
    expect(dateInput).toHaveValue('2023-05-15');
    
    // Проверяем наличие кнопок
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Отмена' })).toBeInTheDocument();
  });
  
  it('должен вызывать onClose при нажатии на кнопку Отмена', () => {
    render(<EditInvestForm invest={mockInvest} onClose={mockOnClose} />);
    
    const cancelButton = screen.getByRole('button', { name: 'Отмена' });
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  
  it('должен вызывать updateInvest с правильными параметрами при отправке формы', async () => {
    render(<EditInvestForm invest={mockInvest} onClose={mockOnClose} />);
    
    // Изменяем значения в форме
    const moneyInput = screen.getByLabelText('Сумма:');
    fireEvent.change(moneyInput, { target: { value: '15000' } });
    
    const dateInput = screen.getByLabelText('Дата создания:');
    fireEvent.change(dateInput, { target: { value: '2023-06-01' } });
    
    // Отправляем форму
    const submitButton = screen.getByRole('button', { name: 'Сохранить' });
    fireEvent.click(submitButton);
    
    // Проверяем, что updateInvest вызван с правильными параметрами
    await waitFor(() => {
      expect(DbInvests.updateInvest).toHaveBeenCalledWith(1, {
        money: 15000,
        createdDate: expect.any(Date)
      });
      expect(DbUtils.updateRemoteData).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Инвестиция обновлена');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
  
  it('должен показывать ошибку при отправке формы с пустым полем суммы', async () => {
    const { container } = render(<EditInvestForm invest={mockInvest} onClose={mockOnClose} />);
    
    // Устанавливаем пустую строку в поле суммы (теперь будет NaN)
    const moneyInput = screen.getByLabelText('Сумма:');
    fireEvent.change(moneyInput, { target: { value: '' } });
    
    // Удаляем атрибут required для обхода валидации HTML
    moneyInput.removeAttribute('required');
    
    // Находим форму через container.querySelector
    const form = container.querySelector('form');
    expect(form).toBeInTheDocument();
    
    // Отправляем форму
    fireEvent.submit(form!);
    
    // Проверяем, что показана ошибка и не вызван updateInvest
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Заполните все поля');
      expect(DbInvests.updateInvest).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
  
  it('должен обрабатывать ошибку при обновлении инвестиции', async () => {
    // Мокаем updateInvest, чтобы он выбрасывал ошибку
    vi.spyOn(DbInvests, 'updateInvest').mockRejectedValueOnce(new Error('Тестовая ошибка'));
    
    render(<EditInvestForm invest={mockInvest} onClose={mockOnClose} />);
    
    // Отправляем форму
    const submitButton = screen.getByRole('button', { name: 'Сохранить' });
    fireEvent.click(submitButton);
    
    // Проверяем, что показана ошибка и не вызван onClose
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Ошибка: Тестовая ошибка');
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
}); 