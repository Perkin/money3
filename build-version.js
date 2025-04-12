#!/usr/bin/env node

/**
 * Скрипт для генерации информации о версии при сборке
 * Запускается перед сборкой проекта
 * 
 * Использование:
 * node build-version.js [patch|minor|major]
 * 
 * Если указан аргумент (patch, minor или major), версия будет увеличена
 * В противном случае будет использована текущая версия из package.json
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Получаем текущую директорию для ES модулей
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Обрабатываем аргументы командной строки
const versionType = process.argv[2]; // patch, minor или major

// Функция для получения текущей версии из package.json
function getCurrentVersion() {
    try {
        const packageJsonPath = resolve(__dirname, 'package.json');
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
        return packageJson.version || '1.0.0';
    } catch (error) {
        console.error('Ошибка при чтении package.json:', error);
        return '1.0.0';
    }
}

// Функция для обновления версии в package.json
function updateVersion(versionType) {
    if (!versionType) return getCurrentVersion();
    
    try {
        const packageJsonPath = resolve(__dirname, 'package.json');
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
        const currentVersion = packageJson.version || '1.0.0';
        
        // Разбиваем версию на части
        const parts = currentVersion.split('.').map(Number);
        
        switch(versionType.toLowerCase()) {
            case 'major':
                parts[0] += 1;
                parts[1] = 0;
                parts[2] = 0;
                break;
            case 'minor':
                parts[1] += 1;
                parts[2] = 0;
                break;
            case 'patch':
                parts[2] += 1;
                break;
            default:
                console.log(`Неизвестный тип версии: ${versionType}. Используем текущую версию.`);
        }
        
        const newVersion = parts.join('.');
        packageJson.version = newVersion;
        
        // Записываем обновленный package.json
        writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4) + '\n', 'utf8');
        
        console.log(`Версия обновлена: ${currentVersion} -> ${newVersion}`);
        return newVersion;
    } catch (error) {
        console.error('Ошибка при обновлении версии:', error);
        return getCurrentVersion();
    }
}

// Обновление файла версии
function updateVersionFile(version) {
    const versionFilePath = resolve(__dirname, 'src/version.ts');
    const buildDate = new Date().toISOString();
    
    try {
        // Создаем новое содержимое файла версии
        const versionFileContent = `// Автоматически сгенерированный файл - ${new Date().toLocaleString()}
export const APP_VERSION = '${version}';
export const BUILD_DATE = '${buildDate}';

// Формат версии: 1.0.0
// Первое число - мажорная версия (значительные изменения)
// Второе число - минорная версия (новые функции)
// Третье число - патч (исправления ошибок)

export default {
    version: APP_VERSION,
    buildDate: BUILD_DATE,
    toString: () => \`v\${APP_VERSION}\`
};
`;
        
        writeFileSync(versionFilePath, versionFileContent, 'utf8');
        console.log(`Файл версии обновлен: 
- Версия: ${version}
- Дата сборки: ${buildDate}
`);
    } catch (error) {
        console.error('Ошибка при обновлении файла версии:', error);
    }
}

// Обновление service-worker.js с новой версией
function updateServiceWorker(version) {
    const swPath = resolve(__dirname, 'public/service-worker.js');
    
    try {
        let swContent = readFileSync(swPath, 'utf8');

        // Заменяем версию приложения
        swContent = swContent.replace(
            /const APP_VERSION = ['"][^'"]+['"]/,
            `const APP_VERSION = '${version}'`
        );
        
        writeFileSync(swPath, swContent, 'utf8');
        console.log(`Service Worker обновлен до версии ${version}`);
    } catch (error) {
        console.error('Ошибка при обновлении Service Worker:', error);
    }
}

// Выполняем основную функцию
function main() {
    const version = updateVersion(versionType);
    updateVersionFile(version);
    updateServiceWorker(version);
}

// Запускаем основную функцию
main(); 