# Guia de Migração: Do Navegador para o Desktop

Este documento fornece orientações para adaptar o armazenamento de dados deste aplicativo do `localStorage` do navegador para um sistema de arquivos local, um passo necessário para a migração para uma aplicação de desktop (usando tecnologias como Electron, Tauri, etc.) ou um backend em outra linguagem.

## Visão Geral

Atualmente, a aplicação utiliza o `localStorage` para persistir todos os dados: produtos, catálogo, configurações, etc. O `localStorage` é uma API exclusiva do navegador e não funcionará em um ambiente de desktop Node.js ou Python.

O objetivo é substituir as chamadas ao `localStorage` por operações de leitura e escrita no sistema de arquivos local.

## Localização do Código Relevante

Toda a lógica de persistência de dados está centralizada no arquivo:
**`src/context/data-context.tsx`**

As duas funções principais que precisam ser substituídas são `getStorageItem` e `setStorageItem`.

---

## Passo a Passo para a Migração (Ambiente Node.js - ex: Electron)

A migração envolve a reescrita das funções de armazenamento para usar o módulo `fs` (File System) do Node.js, que é acessível em ambientes como o Electron.

### 1. Importar o Módulo `fs`

No topo do arquivo `src/context/data-context.tsx`, você precisará importar o `fs` e também o `path` para lidar com os caminhos dos arquivos de forma segura.

```javascript
// Exemplo de como seria em um ambiente Node.js/Electron
import fs from 'fs';
import path from 'path';

// O ideal é usar o caminho de dados do aplicativo para armazenar os arquivos
// frameworks como Electron fornecem APIs para obter este caminho, ex: app.getPath('userData')
const DATA_PATH = './dados_app'; // Substitua pelo caminho de dados do usuário

// Garanta que o diretório de dados exista
if (!fs.existsSync(DATA_PATH)) {
  fs.mkdirSync(DATA_PATH);
}
```

### 2. Substituir `getStorageItem`

A função atual lê do `localStorage`. A nova versão deve ler de um arquivo JSON.

**Função Atual:**
```typescript
const getStorageItem = <T,>(key: string, fallback: T): T => {
    if (typeof window === 'undefined') {
        return fallback;
    }
    try {
        const item = window.localStorage.getItem(key);
        // ...lógica de parse...
    } catch (error) {
        // ...
    }
};
```

**Nova Função (Exemplo com `fs`):**
```typescript
const getStorageItem = <T,>(key: string, fallback: T): T => {
    try {
        const filePath = path.join(DATA_PATH, `${key}.json`);
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(fileContent);
        }
        return fallback;
    } catch (error) {
        console.warn(`Erro ao ler o arquivo "${key}.json":`, error);
        return fallback;
    }
};
```

### 3. Substituir `setStorageItem`

A função atual salva no `localStorage`. A nova versão deve escrever em um arquivo JSON.

**Função Atual:**
```typescript
const setStorageItem = (key: string, value: any) => {
    if (typeof window === 'undefined') {
        return false;
    }
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error: any) {
        // ...lógica de erro de quota...
    }
};
```

**Nova Função (Exemplo com `fs`):**
```typescript
const setStorageItem = (key: string, value: any) => {
    try {
        const filePath = path.join(DATA_PATH, `${key}.json`);
        const jsonString = JSON.stringify(value, null, 2); // O 2 é para formatação "pretty"
        fs.writeFileSync(filePath, jsonString, 'utf-8');
        return true;
    } catch (error: any) {
        console.error(`Erro ao salvar o arquivo "${key}.json":`, error);
        // Aqui você pode adicionar um alerta ao usuário, se necessário
        return false;
    }
};
```
---

## Alternativa para Ambiente Python (Ex: PySide, Tkinter)

Se a aplicação for migrada para um backend ou desktop em Python, a lógica seria semelhante, mas usando os módulos `os` e `json` do Python. As funções equivalentes seriam:

### 1. Configuração Inicial em Python

```python
import os
import json

# Define o diretório onde os dados serão salvos
DATA_PATH = 'dados_app'

# Garante que o diretório exista
if not os.path.exists(DATA_PATH):
    os.makedirs(DATA_PATH)
```

### 2. Função `get_storage_item` em Python

```python
def get_storage_item(key, fallback):
    """
    Lê um arquivo JSON de dados.
    Retorna o conteúdo ou o valor de fallback se o arquivo não existir ou ocorrer um erro.
    """
    file_path = os.path.join(DATA_PATH, f"{key}.json")
    if not os.path.exists(file_path):
        return fallback
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (IOError, json.JSONDecodeError) as e:
        print(f"Erro ao ler o arquivo {file_path}: {e}")
        return fallback
```

### 3. Função `set_storage_item` em Python

```python
def set_storage_item(key, value):
    """
    Salva dados em um arquivo JSON.
    Retorna True em caso de sucesso, False em caso de falha.
    """
    file_path = os.path.join(DATA_PATH, f"{key}.json")
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(value, f, indent=2, ensure_ascii=False)
        return True
    except IOError as e:
        print(f"Erro ao salvar o arquivo {file_path}: {e}")
        return False
```

## Conclusão

Ao substituir as duas funções `getStorageItem` e `setStorageItem` em `src/context/data-context.tsx` pelas equivalentes do ambiente de destino (Node.js ou Python), você efetivamente troca a camada de persistência de dados. O resto da aplicação, que consome os dados através do `DataContext`, continuará funcionando sem a necessidade de outras alterações, pois a lógica de negócio está desacoplada do método de armazenamento.
