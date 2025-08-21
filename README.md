# Controle de Vencimentos Marafarma

Este é um aplicativo Next.js para controle de vencimentos de produtos, projetado para funcionar localmente no seu computador.

## Como Executar o Projeto

Para rodar o projeto em seu ambiente de desenvolvimento, siga os passos:

1.  **Instale as Dependências:**
    *   `npm install`

2.  **Inicie o Servidor de Desenvolvimento:**
    *   `npm run dev`
    *   Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## Como Gerar o Executável para Windows

Para empacotar a aplicação em um único arquivo `.exe` que pode ser distribuído e executado em outros computadores Windows sem a necessidade de instalar nada:

1.  **Instale as Dependências:**
    *   `npm install`

2.  **Execute o Comando de Empacotamento:**
    *   `npm run package`

Após a conclusão, você encontrará o arquivo `marafarma-vencimentos.exe` na pasta raiz do projeto. Este executável contém toda a aplicação e pode ser copiado e executado em qualquer computador Windows (64-bit).

## Funcionalidades

- **Cadastro de Produtos:** Foco no fluxo rápido de entrada de dados.
- **Painel de Vencimentos:** Resumos de produtos a vencer em 30, 60 e 90 dias.
- **Relatórios:** Filtre e exporte relatórios de vencimento em PDF.
- **Configurações Avançadas:**
  - Importe e exporte seu catálogo e estoque em formato XLSX.
  - Personalize a imagem da tela de abertura e o tema (claro/escuro).
  - Limpe dados de produtos vencidos.
- **Dados Locais:** Todos os dados são salvos localmente no seu computador, garantindo privacidade e funcionamento offline.
