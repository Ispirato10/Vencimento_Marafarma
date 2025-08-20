# Firebase Studio - Controle de Vencimentos

Este é um aplicativo Next.js para controle de vencimentos de produtos, integrado com o Firebase Firestore para persistência de dados.

## Conectando seu Próprio Projeto Firebase

Para que o aplicativo funcione corretamente, ele precisa se conectar ao seu banco de dados Firestore. A configuração do Firebase agora é carregada a partir de variáveis de ambiente.

Siga os passos abaixo:

### 1. Obtenha as Credenciais do seu Projeto Firebase
- Acesse o **[Console do Firebase](https://console.firebase.google.com/)**.
- Selecione o seu projeto (ex: `ControledeVencimentosMarafarma`).
- Vá para **Configurações do Projeto** (clicando no ícone de engrenagem).
- Na aba **Geral**, role para baixo até a seção **"Seus aplicativos"**.
- **Se você ainda não tiver um aplicativo web, crie um:**
    - Clique no ícone de **Web** (`</>`).
    - Dê um apelido ao seu aplicativo (ex: "Controle de Vencimentos Web").
    - Clique em **"Registrar aplicativo"**.
- Na tela seguinte, o Firebase mostrará o objeto de configuração `firebaseConfig`. Copie os valores deste objeto.

### 2. Configure as Variáveis de Ambiente
- Na raiz do projeto, renomeie o arquivo `.env.local.example` para `.env.local`.
- Cole os valores que você copiou do seu console do Firebase no arquivo `.env.local`, substituindo os valores de exemplo.

### 3. Crie as Coleções no Firestore
- Acesse o **Firestore** no seu console do Firebase.
- Se for o primeiro acesso, clique em **"Criar banco de dados"**, selecione o **modo de produção** e escolha uma localização.
- Crie as duas coleções necessárias para o aplicativo: `catalog` e `products`.

#### Para a coleção `catalog`:
- **ID da coleção:** `catalog`
- Crie um documento de exemplo com os campos: `code` (string), `name` (string), `category` (string).

#### Para a coleção `products`:
- **ID da coleção:** `products`
- Crie um documento de exemplo com os campos: `code` (string), `name` (string), `category` (string), `batch` (string), `quantity` (number), `expirationDate` (string, formato `YYYY-MM-DDTHH:mm:ss.sssZ`).

### 4. Popule os Dados
- Após configurar o projeto e as coleções, você está pronto!
- Abra o aplicativo e vá para a página **Configurações**.
- Use os botões **Importar (XLSX)** para carregar seus dados de catálogo e estoque para o seu Firebase.

Com isso, seu aplicativo estará totalmente funcional e conectado ao **seu próprio** banco de dados na nuvem.
