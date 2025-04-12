import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import InvestForm from '../index';
import * as DbInvests from '@/db/DbInvests';
import * as DbUtils from '@/db/DbUtils';
import { toast } from 'react-toastify';

// Мокаем зависимости
vi.spyOn(DbInvests, 'addInvest').mockResolvedValue(1);
vi.spyOn(DbUtils, 'calculatePayments').mockResolvedValue(undefined);
vi.spyOn(DbUtils, 'updateRemoteData').mockResolvedValue(undefined);

// Мокаем toast
vi.spyOn(toast, 'success').mockImplementation(() => 1);
vi.spyOn(toast, 'error').mockImplementation(() => 1);

describe('InvestForm', () => {
  const mockDispatchEvent = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Мокаем window.dispatchEvent
    Object.defineProperty(window, 'dispatchEvent', {
      value: mockDispatchEvent,
      writable: true
    });
  });
  
  it('должен отображать форму со всеми необходимыми полями', () => {
    render(<InvestForm />);
    
    // Проверяем наличие полей формы
    const moneyInput = screen.getByPlaceholderText('Сколько инвестируем');
    expect(moneyInput).toBeInTheDocument();
    expect(moneyInput).toHaveAttribute('type', 'text');
    
    const selectRatio = screen.getByRole('combobox');
    expect(selectRatio).toBeInTheDocument();
    expect(selectRatio.children.length).toBe(2); // Должно быть 2 опции (2.5% и 5%)
    
    const dateInput = screen.getByPlaceholderText('Дата инвестиции');
    expect(dateInput).toBeInTheDocument();
    expect(dateInput).toHaveAttribute('type', 'date');
    
    const submitButton = screen.getByRole('button', { name: 'Добавить' });
    expect(submitButton).toBeInTheDocument();
  });
  
  it('должен показывать ошибку при отправке с пустыми полями', async () => {
    const { container } = render(<InvestForm />);
    
    // Ничего не вводим в поля формы, оставляем их пустыми
    
    // Используем querySelector для поиска формы вместо getByRole
    const form = container.querySelector('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form!);
    
    // Должен быть вызван toast.error
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Заполните все поля');
      // Проверяем наличие HTML5 валидации
      // Проверяем, что addInvest не был вызван
      expect(DbInvests.addInvest).not.toHaveBeenCalled();
    });
  });
  
  it('должен успешно добавлять инвестицию при корректном заполнении формы', async () => {
    render(<InvestForm />);
    
    // Заполняем поля формы
    const moneyInput = screen.getByPlaceholderText('Сколько инвестируем');
    fireEvent.change(moneyInput, { target: { value: '10000' } });
    
    const selectRatio = screen.getByRole('combobox');
    fireEvent.change(selectRatio, { target: { value: '0.05' } });
    
    const dateInput = screen.getByPlaceholderText('Дата инвестиции');
    fireEvent.change(dateInput, { target: { value: '2023-05-15' } });
    
    // Отправляем форму
    const submitButton = screen.getByRole('button', { name: 'Добавить' });
    fireEvent.click(submitButton);
    
    // Проверяем, что функции были вызваны с правильными параметрами
    await waitFor(() => {
      expect(DbInvests.addInvest).toHaveBeenCalledWith(10000, 0.05, expect.any(Date));
      expect(DbUtils.calculatePayments).toHaveBeenCalled();
      expect(DbUtils.updateRemoteData).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Инвестиция добавлена');
      expect(mockDispatchEvent).toHaveBeenCalledWith(expect.any(CustomEvent));
    });
  });
  
  it('должен обрабатывать ошибку при добавлении инвестиции', async () => {
    // Мокаем addInvest, чтобы он выбрасывал ошибку
    vi.spyOn(DbInvests, 'addInvest').mockRejectedValueOnce(new Error('Тестовая ошибка'));
    
    render(<InvestForm />);
    
    // Заполняем поля формы
    const moneyInput = screen.getByPlaceholderText('Сколько инвестируем');
    fireEvent.change(moneyInput, { target: { value: '10000' } });
    
    const selectRatio = screen.getByRole('combobox');
    fireEvent.change(selectRatio, { target: { value: '0.05' } });
    
    const dateInput = screen.getByPlaceholderText('Дата инвестиции');
    fireEvent.change(dateInput, { target: { value: '2023-05-15' } });
    
    // Отправляем форму
    const submitButton = screen.getByRole('button', { name: 'Добавить' });
    fireEvent.click(submitButton);
    
    // Проверяем, что toast.error был вызван с сообщением об ошибке
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Ошибка: Тестовая ошибка');
    });
  });

  it('должен показывать сообщение об ошибке, если не удалось добавить инвестицию', async () => {
    // Мокаем addInvest, чтобы он возвращал не целое число (неудача)
    vi.spyOn(DbInvests, 'addInvest').mockResolvedValueOnce(null as any);
    
    render(<InvestForm />);
    
    // Заполняем поля формы
    const moneyInput = screen.getByPlaceholderText('Сколько инвестируем');
    fireEvent.change(moneyInput, { target: { value: '10000' } });
    
    const selectRatio = screen.getByRole('combobox');
    fireEvent.change(selectRatio, { target: { value: '0.05' } });
    
    const dateInput = screen.getByPlaceholderText('Дата инвестиции');
    fireEvent.change(dateInput, { target: { value: '2023-05-15' } });
    
    // Отправляем форму
    const submitButton = screen.getByRole('button', { name: 'Добавить' });
    fireEvent.click(submitButton);
    
    // Проверяем, что toast.error был вызван с сообщением о неудаче
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Не удалось добавить инвестицию');
      
      // Проверяем, что calculatePayments и updateRemoteData не были вызваны
      expect(DbUtils.calculatePayments).not.toHaveBeenCalled();
      expect(DbUtils.updateRemoteData).not.toHaveBeenCalled();
      
      // Проверяем, что событие fetchInvests не было отправлено
      expect(mockDispatchEvent).not.toHaveBeenCalled();
    });
  });
}); 