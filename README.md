# Rango Delivery (React Native)

App de pedidos de comida com 21 telas, feito em React Native com TypeScript para Android e iOS, com a interface no código comum. O mesmo app foi feito em Kotlin Multiplatform em outro repositório ([Rango-Kotlin](https://github.com/emytonton/Rango-Kotlin)), para comparar os dois frameworks. Por isso este repositório também registra métricas de desenvolvimento, de desempenho e de uso de IA.

A versão final é a tag `v1.0`.

## Telas

| Funcionalidade | Telas |
|---|---|
| Autenticação | Boas-vindas, Login, Cadastro, Perfil |
| Catálogo | Home, Produto |
| Busca e filtros | Busca |
| Carrinho e pedido | Carrinho, Checkout, Endereço, Pagamento, Confirmado, Rastreio |
| Histórico de pedidos | Pedidos, Detalhe do pedido |
| Tema escuro | Configurações, Tema |
| Favoritos | Favoritos |
| Notificações | Notificações, Configuração de notificações |
| Foto de perfil | Editar perfil |

Também há duas funcionalidades transversais:
- **Persistência local:** o app guarda no aparelho uma cópia da home, dos pedidos, dos favoritos, do carrinho, do perfil, das buscas, dos endereços, das formas de pagamento e das notificações.
- **Cache offline:** sem conexão, o app usa essa cópia salva, mostra a faixa offline e reenvia os favoritos feitos sem rede quando a conexão volta.

## Tecnologias

| Item | Versão |
|---|---|
| React Native | 0.88.1 (nova arquitetura, Hermes) |
| React | 19.3.0 |
| TypeScript | 6.0.3 |
| React Navigation (native-stack) | 7.5.2 (native-stack 7.21.1) |
| react-native-keychain | 11.0.0 |
| react-native-image-picker | 8.3.0 |
| @react-native-community/image-editor | 5.1.0 |
| react-native-svg | 15.16.1 |
| react-native-safe-area-context | 5.5.2 |
| Jest | 29.7.0 |

No Android, o `minSdk` é 24, o `compileSdk` é 37 e o `targetSdk` é 36.

## Estrutura

```
App.tsx, index.js                entrada do app
src/components/                  design system (59 componentes)
src/core/                        rede, formatação, validação e pontes nativas
src/data/                        repositórios por domínio, cache e armazenamento
src/features/                    uma pasta por tela, com tela e ViewModel em hook
src/navigation/                  rotas, faixa offline e banner de push
src/theme/                       cores, tipografia e medidas
src/di/                          AppContainer
android/app/src/main/java/       módulos nativos Android em Kotlin
ios/RangoDelivery/               projeto iOS
__tests__/                       testes
tools/metrics/                   scripts de coleta de métricas
docs/                            métricas, medições, diário e avaliação
```

O código específico de plataforma fica restrito a:
- endereço do backend (`Platform.select`);
- armazenamento seguro, com Keystore no Android e Keychain no iOS, pela react-native-keychain;
- três módulos nativos Android em Kotlin: exclusão do gesto de voltar, notificação local com permissão e detecção de conexão;
- câmera, galeria e recorte da foto, pelas bibliotecas nativas.

## Como rodar

### Backend

O app consome o backend [BackEnd-Rango](https://github.com/emytonton/BackEnd-Rango), que precisa estar rodando na porta 3333. O endereço fica em `src/core/network/config.ts`:
- **Android (emulador):** `http://10.0.2.2:3333`. O HTTP é liberado no build debug pelo próprio React Native; o build release bloqueia HTTP.
- **iOS (simulador):** `http://localhost:3333`.

Conta de demonstração do seed do backend: `marina.alves@email.com`, senha `rango123`.

### Android

Requer Node.js, o Android SDK e um emulador aberto:

```bash
npm install
npm run android
```

O build debug já empacota o JavaScript (`debuggableVariants = []`), então também roda sem o Metro.

### iOS

Requer um Mac com Xcode e CocoaPods:

```bash
cd ios && pod install && cd ..
npm run ios
```

### Testes

```bash
npm test
```

## Registro do desenvolvimento

- **Issues:** cada tela teve uma issue aberta antes de começar, com o template "Registro de Feature", e fechada ao terminar. A issue guarda tempo, prompts, LOC por origem, dificuldade, confiança e observações. Bugs viraram issues com o label `bug`.
- **Commits:** seguem `tipo(escopo): resumo`, citam a issue com `Refs #N` e terminam com os trailers `AI-Tool` e `AI-Extent`.
- **Branches:** cada funcionalidade teve uma branch própria, mesclada na `main` com `--no-ff`.
- **Validação dos commits:** o hook em `.githooks/commit-msg` confere os trailers. Para ativá-lo depois de clonar:

```bash
git config core.hooksPath .githooks
```

Exemplo de mensagem:

```
feat(cadastro): valida e-mail e senha

Refs #12

AI-Tool: Claude
AI-Extent: gerado
```

- `AI-Tool`: `Claude`, `GitHub Copilot`, `ChatGPT`, `Gemini`, `Outra` ou `Nenhuma`.
- `AI-Extent`: `gerado`, `assistido` ou `manual`. `manual` exige `AI-Tool: Nenhuma`, e o inverso também vale.

## Métricas

Os scripts ficam em `tools/metrics/` e são Bash (Git Bash no Windows). Cada métrica e seu modo de coleta estão explicados em [docs/METRICAS.md](docs/METRICAS.md). Os resultados ficam em `docs/medicoes/`.

Medições finais, todas no commit da tag `v1.0`:

| Métrica | Resultado |
|---|---|
| Código comum | 98,3% (16.821 linhas comuns, 243 Android, 56 iOS) |
| Código por plataforma no JS | 0 arquivos `.android`/`.ios` e 13 usos de `Platform.OS` e `Platform.select` |
| APK release | 74.369.253 bytes (quatro ABIs do template) |
| Build Android debug | limpo 607,46 s, sem mudança 16,27 s, com um arquivo alterado 54,92 s |
| Inicialização a frio (mediana de 10, build release) | 2.619 ms |
| Memória ao fim do roteiro (mediana de 10, build debug) | PSS de 218.234 KB |
| Tempo de CPU no roteiro (mediana de 10, build debug) | 32.135 ms |
| SonarQube | 17.097 linhas, 0,0% de duplicação, 186 code smells, 0 bugs |

O build limpo e o roteiro de memória e CPU rodaram com o SonarQube no Docker e o emulador com pouca memória livre. O roteiro usa o build debug porque o release bloqueia o HTTP para o backend local.

Outros registros:
- [docs/avaliacao-qualitativa.md](docs/avaliacao-qualitativa.md): avaliação por dimensão (facilidade de uso, documentação, depuração, curva de aprendizado, APIs nativas e impacto da IA).
- `docs/diario/`: diário por dia de trabalho.
- [docs/CORRECOES.md](docs/CORRECOES.md): correções feitas nos registros.
