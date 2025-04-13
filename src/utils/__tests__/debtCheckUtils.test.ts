import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { checkForDebts, requestNotificationPermission } from '../debtCheckUtils'

describe('debtCheckUtils', () => {
  // Сохраняем оригинальные объекты для восстановления
  const originalNavigator = { ...global.navigator };
  const originalNotification = global.Notification;
  
  // Подготовка моков перед каждым тестом
  beforeEach(() => {
    // Сбрасываем моки
    vi.clearAllMocks();
    
    // Восстанавливаем значения по умолчанию
    global.navigator = { ...originalNavigator };
  });
  
  // Восстановление оригинальных объектов после тестов
  afterEach(() => {
    vi.restoreAllMocks();
    
    // Восстанавливаем оригинальные объекты
    global.navigator = originalNavigator;
    
    if ('Notification' in global) {
      global.Notification = originalNotification;
    }
  });
  
  describe('checkForDebts', () => {
    it('должен отправлять сообщение service worker при успешной регистрации', async () => {
      // Мок для postMessage
      const postMessageMock = vi.fn();
      
      // Мок для service worker
      Object.defineProperty(global.navigator, 'serviceWorker', {
        configurable: true,
        value: {
          ready: Promise.resolve({
            active: {
              postMessage: postMessageMock
            }
          })
        }
      });
      
      // Мок для Notification
      global.Notification = {
        permission: 'granted'
      } as any;
      
      // Мок для console.log
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Вызываем функцию
      await checkForDebts();
      
      // Проверяем, что postMessage был вызван с правильным аргументом
      expect(postMessageMock).toHaveBeenCalledWith({ 
        type: 'check-debts',
        force: false
      });
      
      // Проверяем, что сообщение было залогировано
      expect(consoleSpy).toHaveBeenCalledWith('Запрос на проверку долгов отправлен через Service Worker');
    });
    
    it('должен передавать флаг force в сообщение service worker', async () => {
      // Мок для postMessage
      const postMessageMock = vi.fn();
      
      // Мок для service worker
      Object.defineProperty(global.navigator, 'serviceWorker', {
        configurable: true,
        value: {
          ready: Promise.resolve({
            active: {
              postMessage: postMessageMock
            }
          })
        }
      });
      
      // Мок для Notification
      global.Notification = {
        permission: 'granted'
      } as any;
      
      // Вызываем функцию с параметром force=true
      await checkForDebts(true);
      
      // Проверяем, что postMessage был вызван с правильным аргументом
      expect(postMessageMock).toHaveBeenCalledWith({ 
        type: 'check-debts',
        force: true
      });
    });
    
    it('должен обрабатывать отсутствие поддержки service worker', async () => {
      // Удаляем serviceWorker из navigator
      // @ts-ignore - игнорируем ошибки TypeScript для теста
      delete global.navigator.serviceWorker;
      
      // Мок для Notification
      global.Notification = {
        permission: 'granted'
      } as any;
      
      // Мок для console.log
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Вызываем функцию
      await checkForDebts();
      
      // Проверяем сообщение в логе
      expect(consoleSpy).toHaveBeenCalledWith('Запрос на проверку долгов выполнен через обычные уведомления');
    });
    
    it('должен обрабатывать ошибки при отправке сообщения service worker', async () => {
      // Мок для service worker, который выбрасывает ошибку
      Object.defineProperty(global.navigator, 'serviceWorker', {
        configurable: true,
        value: {
          ready: Promise.reject(new Error('Тестовая ошибка'))
        }
      });
      
      // Мок для Notification
      global.Notification = {
        permission: 'granted'
      } as any;
      
      // Мок для console.warn и console.error
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Вызываем функцию
      await checkForDebts();
      
      // Проверяем, что предупреждение было залогировано
      expect(warnSpy).toHaveBeenCalledWith('Service Worker не активен, используем обычные уведомления:', expect.any(Error));
    });
    
    it('должен обрабатывать отсутствие активного service worker', async () => {
      // Мок для service worker без активного воркера
      Object.defineProperty(global.navigator, 'serviceWorker', {
        configurable: true,
        value: {
          ready: Promise.resolve({
            active: null
          })
        }
      });
      
      // Мок для Notification
      global.Notification = {
        permission: 'granted'
      } as any;
      
      // Мок для console.log и console.warn
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Вызываем функцию
      await checkForDebts();
      
      // Проверяем сообщение в логе
      expect(logSpy).toHaveBeenCalledWith('Запрос на проверку долгов выполнен через обычные уведомления');
    });
  });
  
  describe('requestNotificationPermission', () => {
    it('должен возвращать true при получении разрешения', async () => {
      // Мок для Notification.requestPermission
      global.Notification = {
        requestPermission: vi.fn().mockResolvedValue('granted'),
        permission: 'default'
      } as any;
      
      // Вызываем функцию
      const result = await requestNotificationPermission();
      
      // Проверяем результат
      expect(result).toBe(true);
      expect(Notification.requestPermission).toHaveBeenCalled();
    });
    
    it('должен возвращать false, если разрешение не предоставлено', async () => {
      // Мок для Notification.requestPermission
      global.Notification = {
        requestPermission: vi.fn().mockResolvedValue('denied'),
        permission: 'default'
      } as any;
      
      // Вызываем функцию
      const result = await requestNotificationPermission();
      
      // Проверяем результат
      expect(result).toBe(false);
    });
    
    it('должен обрабатывать отсутствие поддержки уведомлений', async () => {
      // Удаляем Notification из window
      // @ts-ignore - игнорируем ошибки TypeScript для теста
      delete global.Notification;
      
      // Мок для console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Вызываем функцию
      const result = await requestNotificationPermission();
      
      // Проверяем результат
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Уведомления не поддерживаются');
    });
    
    it('должен обрабатывать ошибки при запросе разрешения', async () => {
      // Мок для Notification.requestPermission, который выбрасывает ошибку
      global.Notification = {
        requestPermission: vi.fn().mockRejectedValue(new Error('Тестовая ошибка')),
        permission: 'default'
      } as any;
      
      // Мок для console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Вызываем функцию
      const result = await requestNotificationPermission();
      
      // Проверяем результат
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Ошибка при запросе разрешения на уведомления:', expect.any(Error));
    });
  });
}) 