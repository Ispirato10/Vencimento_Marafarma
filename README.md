# Firebase Studio - Controle de Vencimentos

Este é um aplicativo Next.js para controle de vencimentos de produtos, integrado com o Firebase Firestore para persistência de dados.

## Primeiros Passos com o Firebase

Para que o aplicativo funcione corretamente, ele precisa se conectar ao banco de dados Firestore. As credenciais já estão no código, mas as "coleções" (que funcionam como tabelas) precisam ser criadas manualmente no seu console do Firebase.

Siga os passos abaixo:

### 1. Acesse o Firestore:
- Clique no link a seguir para ir direto para o seu banco de dados no Console do Firebase:
- **[Acessar Firestore do Projeto Marafarma](https://console.firebase.google.com/project/marafarma-424419/firestore)**

### 2. Crie o Banco de Dados (se for o primeiro acesso):
- Se você ainda não configurou o Firestore, clique em **"Criar banco de dados"**.
- Selecione **"Iniciar no modo de produção"** e clique em **"Avançar"**.
- Escolha uma localização (ex: `southamerica-east1` para São Paulo) e clique em **"Ativar"**.

### 3. Crie a Coleção `catalog`:
- Na tela principal do Firestore, clique em **"+ Iniciar coleção"**.
- **ID da coleção:** digite `catalog`.
- Clique em **Avançar**.
- O sistema pedirá para criar o primeiro "documento". Clique em **"ID automática"**.
- Adicione os seguintes campos para um item de exemplo:
  - `code` (string): `000`
  - `name` (string): `Item de Teste`
  - `category` (string): `Categoria Teste`
- Clique em **Salvar**.

### 4. Crie a Coleção `products`:
- Volte para a tela principal e clique novamente em **"+ Iniciar coleção"**.
- **ID da coleção:** digite `products`.
- Clique em **Avançar**.
- Clique em **"ID automática"** para o documento.
- Adicione os campos para um produto de exemplo:
  - `code` (string): `000`
  - `name` (string): `Produto de Teste`
  - `category` (string): `Categoria Teste`
  - `batch` (string): `LOTE01`
  - `quantity` (number): `10`
  - `expirationDate` (string): `2025-12-31T00:00:00.000Z`
- Clique em **Salvar**.

### 5. Popule os Dados
- Após criar as coleções, você está pronto!
- Abra o aplicativo e vá para a página **Configurações**.
- Use os botões **Importar (XLSX)** para carregar seus dados de catálogo e estoque de produtos para o Firebase.

Com isso, seu aplicativo estará totalmente funcional e conectado ao banco de dados na nuvem.
