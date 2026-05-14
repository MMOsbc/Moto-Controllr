Aplicativo MotoControllr
O MotoControllr é um aplicativo mobile desenvolvido em React Native para ajudar motociclistas no controle e organização das informações da moto. O aplicativo permite cadastrar várias motos, registrar abastecimentos, manutenções, trocas de pneus, gastos e acompanhar um checklist de segurança semanal. Os dados ficam sincronizados em nuvem utilizando Firebase.
##################################################
1. Visão Geral e Requisitos
Tema
O projeto foi desenvolvido com o objetivo de centralizar em um único aplicativo todas as informações importantes relacionadas ao uso e manutenção de motocicletas, facilitando o acompanhamento do veículo no dia a dia.
##################################################
2. Objetivos
•	Criar um painel principal com resumo das informações da moto e gráficos de gastos. 
•	Permitir o cadastro e gerenciamento de múltiplas motos. 
•	Registrar abastecimentos, manutenções, trocas de pneus e outros gastos. 
•	Disponibilizar um checklist semanal de segurança. 
•	Garantir funcionamento offline com sincronização automática quando houver conexão com a internet. 
##################################################
3. Principais Características
1.	Sistema de autenticação de usuários (cadastro e login). 
2.	Cadastro, edição e exclusão de motos. 
3.	Registro de abastecimentos, manutenções, pneus e gastos. 
4.	Checklist semanal de segurança. 
5.	Dashboard com gráficos de gastos e abastecimentos. 
6.	Funcionamento offline utilizando armazenamento local. 
7.	Sincronização em nuvem com Firebase Firestore. 
8.	Separação de dados por usuário. 
##################################################
Tecnologias Utilizadas
Tecnologia	Função
React Native 0.76	Desenvolvimento do aplicativo mobile
Expo ~52.0	Execução e build do projeto
Firebase 10	Autenticação e banco de dados
React Navigation 6	Navegação entre telas
AsyncStorage	Armazenamento local
Victory Native	Criação dos gráficos
React Native Reanimated	Animações
Expo Image Picker	Seleção de imagens
React Native Gesture Handler	Suporte aos gestos do Drawer
##################################################
Funcionalidades
Autenticação
O aplicativo possui telas de login e cadastro com validação de campos como e-mail, senha e nome. A autenticação é realizada utilizando Firebase Auth. Também foi implementado armazenamento local da sessão para melhorar o acesso e permitir suporte offline.
Gerenciamento de Motos
O usuário pode cadastrar várias motos informando nome, marca, modelo, placa, ano e foto. Também é possível editar, excluir e definir uma moto como ativa. A moto ativa é utilizada como referência nas demais telas do aplicativo.
Manutenções
Permite registrar serviços realizados na moto, informando data, tipo de manutenção, quilometragem e observações. O sistema também exibe o histórico completo de manutenções cadastradas.
Abastecimentos
O usuário pode registrar abastecimentos com informações como data, litros abastecidos, valor pago, quilometragem e tipo de combustível. O aplicativo calcula automaticamente o custo por litro e o consumo médio da moto.
Pneus
Controle de trocas de pneus dianteiros e traseiros, incluindo data da troca, quilometragem, marca e observações.
Gastos
Registro de gastos gerais relacionados à moto, separados por categorias como combustível, manutenção, pneus, seguro e outros.
Checklist de Segurança
O aplicativo possui um checklist semanal com itens básicos de verificação da moto, como óleo, pneus, freios, corrente e iluminação. Após a conclusão, o sistema registra a data e inicia uma contagem para o próximo checklist.
Dashboard
Tela principal com resumo das informações da moto ativa, total de gastos, último abastecimento e gráficos para visualização dos dados cadastrados.
##################################################
Demonstração
Nesta seção pode ser adicionado um vídeo ou GIF demonstrando o funcionamento do aplicativo, mostrando o fluxo de cadastro, login, registro de informações e visualização do dashboard.
################################################## 
Pré-requisitos
•	Node.js v24.15.0
•	Expo CLI 
•	Conta no Firebase 
•	Expo Go e um celular Android ou emulador Android
##################################################

Instalação e Execução
Após instalar todos os requisitos a cima destacados como necessários, siga os passos abaixo para executar o projeto.
1. Clonar o repositório
Clone o repositório do projeto utilizando o comando:
git clone https://github.com/seu-usuario/motocontrollr.git
cd motocontrollr
##################################################
2. Instalar as dependências
Dentro da pasta do projeto, execute:
npm install
Esse comando irá instalar todas as bibliotecas necessárias para o funcionamento do aplicativo.
##################################################
3. Configurar o Firebase
Para utilizar o sistema de autenticação e armazenamento em nuvem, é necessário configurar o Firebase.
Passos:
1.	Acesse o Firebase e crie um novo projeto. 
2.	Registre um aplicativo Web. 
3.	Copie as credenciais geradas. 
4.	Adicione as informações no arquivo services/firebase.js. 
Exemplo de configuração:
const firebaseConfig = {
  apiKey: 'SUA_API_KEY',
  authDomain: 'seu-projeto.firebaseapp.com',
  projectId: 'seu-projeto',
  storageBucket: 'seu-projeto.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abc123',
};
Também é necessário ativar no Firebase:
•	Authentication utilizando login por e-mail e senha. 
•	Firestore Database para armazenamento dos dados. 
##################################################
4. Executar o aplicativo
Após concluir a instalação e configuração do Firebase, execute para dar inicio ao expo go e toda vez que executar o projeto pode manter o clear para limpar dados de cache anteriores:
npx expo start –clear ## 
O Expo irá iniciar o projeto e gerar um QR Code.
O aplicativo pode ser aberto de duas formas:
•	Utilizando o aplicativo Expo Go no celular. 
•	Utilizando um emulador Android .
________________________________________
Aprendizados
Durante o desenvolvimento do MotoControllr foi possível adquirir experiência prática com diversas tecnologias do ecossistema React Native.
Os principais aprendizados foram:
•	Integração entre React Native e Firebase. 
•	Utilização de autenticação e banco de dados em nuvem. 
•	Implementação de funcionamento offline utilizando AsyncStorage. 
•	Criação de gráficos e visualização de dados. 
•	Estruturação da navegação utilizando React Navigation. 
•	Validação de formulários e organização de componentes. 
Além dos conhecimentos técnicos, o desenvolvimento do projeto também contribuiu para ampliar a visão de análise de sistemas, principalmente na identificação e correção de erros relacionados à compatibilidade entre versões do Node.js, Expo e Expo Go.
Durante a implementação, foi possível compreender a importância de manter o ambiente de desenvolvimento atualizado e compatível entre bibliotecas e dependências, já que pequenas diferenças de versão podem causar falhas na execução do aplicativo.
O projeto também reforçou a necessidade de seguir padrões de desenvolvimento e organização de código, utilizando conceitos de orientação a objetos, separação de responsabilidades e componentização, tornando a aplicação mais organizada.
Além disso, a experiência prática ajudou no desenvolvimento da lógica de programação, resolução de problemas e entendimento do fluxo completo de desenvolvimento de um aplicativo mobile, desde a criação das telas até a integração com serviços em nuvem.
