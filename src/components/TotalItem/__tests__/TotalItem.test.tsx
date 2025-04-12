import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TotalItem from '../index';

describe('TotalItem', () => {
    it('should render with title and amount', () => {
        const amount = 1000;
        render(<TotalItem amount={amount} title="Итого" isDebt={false} />);
        
        expect(screen.getByText('Итого')).toBeInTheDocument();
        // Используем гибкий поиск текста с учетом формата "Число ₽"
        expect(screen.getByText((content) => 
            content.includes('1,000') && content.includes('₽') && 
            content.indexOf('1,000') < content.indexOf('₽')
        )).toBeInTheDocument();
    });

    it('should apply debt style when isDebt is true', () => {
        const { container } = render(<TotalItem amount={500} title="Долг" isDebt={true} />);
        
        // Проверяем, что класс содержит подстроку "debt"
        const dataItem = container.querySelector('[class*="dataItem"]');
        expect(dataItem?.className).toContain('debt');
    });

    it('should not apply debt style when isDebt is false', () => {
        const { container } = render(<TotalItem amount={500} title="Доход" isDebt={false} />);
        
        // Проверяем, что класс не содержит подстроку "debt"
        const dataItem = container.querySelector('[class*="dataItem"]');
        expect(dataItem?.className).not.toContain('debt');
    });

    it('should handle zero amount correctly', () => {
        const amount = 0;
        render(<TotalItem amount={amount} title="Нулевая сумма" isDebt={false} />);
        
        // Используем гибкий поиск текста с учетом формата "Число ₽"
        expect(screen.getByText((content) => 
            content.includes('0') && content.includes('₽') &&
            content.indexOf('0') < content.indexOf('₽')
        )).toBeInTheDocument();
    });

    it('should handle negative amount correctly', () => {
        const amount = -1000;
        render(<TotalItem amount={amount} title="Отрицательная сумма" isDebt={false} />);
        
        // Используем гибкий поиск текста с учетом формата "-Число ₽"
        expect(screen.getByText((content) => 
            content.includes('-1,000') && content.includes('₽') &&
            content.indexOf('-1,000') < content.indexOf('₽')
        )).toBeInTheDocument();
    });
}); 