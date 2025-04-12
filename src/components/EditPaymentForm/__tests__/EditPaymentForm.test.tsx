import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EditPaymentForm from '../index';
import * as DbPayments from '@/db/DbPayments';
import * as DbUtils from '@/db/DbUtils';
import { toast } from 'react-toastify';

// Мокаем зависимости
vi.spyOn(DbPayments, 'updatePayment').mockResolvedValue(1);
vi.spyOn(DbUtils, 'updateRemoteData').mockResolvedValue(undefined);
vi.spyOn(toast, 'success').mockImplementation(() => 1);
vi.spyOn(toast, 'error').mockImplementation(() => 1);

// Создаем тестовые данные
const mockPayment = {
  id: 101,
  investId: 1,
  money: 500,
  paymentDate: new Date('2023-05-15'),
  isPayed: 0 as 0 | 1,
  updatedAt: new Date('2023-05-01')
};

describe('EditPaymentForm', () => {
  const mockOnClose = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('должен отображать форму с заполненными полями', () => {
    render(<EditPaymentForm payment={mockPayment} onClose={mockOnClose} />);
    
    // Проверяем, что форма содержит поля с правильными значениями
    const moneyInput = screen.getByDisplayValue('500');
    expect(moneyInput).toBeInTheDocument();
    expect(moneyInput).toHaveAttribute('type', 'number');
    
    const dateInput = screen.getByDisplayValue('2023-05-15');
    expect(dateInput).toBeInTheDocument();
    expect(dateInput).toHaveAttribute('type', 'date');
    
    const statusSelect = screen.getByRole('combobox');
    expect(statusSelect).toBeInTheDocument();
    expect(statusSelect).toHaveValue('0');
    
    // Проверяем наличие опций в селекте
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveValue('0');
    expect(options[1]).toHaveValue('1');
    
    // Проверяем наличие кнопок
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Отмена' })).toBeInTheDocument();
  });
  
  it('должен вызывать onClose при нажатии на кнопку Отмена', () => {
    render(<EditPaymentForm payment={mockPayment} onClose={mockOnClose} />);
    
    const cancelButton = screen.getByRole('button', { name: 'Отмена' });
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  
  it('должен вызывать updatePayment с правильными параметрами при отправке формы', async () => {
    render(<EditPaymentForm payment={mockPayment} onClose={mockOnClose} />);
    
    // Изменяем значения в форме
    const moneyInput = screen.getByDisplayValue('500');
    fireEvent.change(moneyInput, { target: { value: '750' } });
    
    const dateInput = screen.getByDisplayValue('2023-05-15');
    fireEvent.change(dateInput, { target: { value: '2023-06-01' } });
    
    const statusSelect = screen.getByRole('combobox');
    fireEvent.change(statusSelect, { target: { value: '1' } });
    
    // Отправляем форму
    const submitButton = screen.getByRole('button', { name: 'Сохранить' });
    fireEvent.click(submitButton);
    
    // Проверяем, что updatePayment вызван с правильными параметрами
    await waitFor(() => {
      expect(DbPayments.updatePayment).toHaveBeenCalledWith(101, {
        money: 750,
        paymentDate: expect.any(Date),
        isPayed: 1
      });
      expect(DbUtils.updateRemoteData).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Платёж обновлен');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
  
  it('должен показывать ошибку при отправке формы с пустыми полями', async () => {
    const { container } = render(<EditPaymentForm payment={mockPayment} onClose={mockOnClose} />);
    
    // Очищаем поле суммы
    const moneyInput = screen.getByDisplayValue('500');
    fireEvent.change(moneyInput, { target: { value: '' } });
    
    // Удаляем атрибут required для обхода HTML-валидации
    moneyInput.removeAttribute('required');
    
    // Находим форму через container.querySelector и отправляем её
    const form = container.querySelector('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form!);
    
    // Проверяем, что показана ошибка и не вызван updatePayment
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Заполните все поля');
      expect(DbPayments.updatePayment).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
  
  it('должен обрабатывать ошибку при обновлении платежа', async () => {
    // Мокаем updatePayment, чтобы он выбрасывал ошибку
    vi.spyOn(DbPayments, 'updatePayment').mockRejectedValueOnce(new Error('Тестовая ошибка'));
    
    render(<EditPaymentForm payment={mockPayment} onClose={mockOnClose} />);
    
    // Отправляем форму
    const submitButton = screen.getByRole('button', { name: 'Сохранить' });
    fireEvent.click(submitButton);
    
    // Проверяем, что показана ошибка и не вызван onClose
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Ошибка: Тестовая ошибка');
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
  
  it('должен обрабатывать ошибку, которая не является экземпляром Error', async () => {
    // Мокаем updatePayment, чтобы он отклонял промис с объектом, который не является экземпляром Error
    vi.spyOn(DbPayments, 'updatePayment').mockRejectedValueOnce('Строковая ошибка');
    
    render(<EditPaymentForm payment={mockPayment} onClose={mockOnClose} />);
    
    // Отправляем форму
    const submitButton = screen.getByRole('button', { name: 'Сохранить' });
    fireEvent.click(submitButton);
    
    // Проверяем, что показана ошибка с сообщением "Неизвестная ошибка"
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Ошибка: Неизвестная ошибка');
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
}); 