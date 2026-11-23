# Avaliação qualitativa: React Native, versão v1.0

Rascunho montado a partir das Observações adicionais das issues (#1 a #28) e do diário em `docs/diario/`. As citações indicam a issue de origem. A dona do projeto edita e aprova o texto.

Apoio numérico da versão (tag `v1.0`, commit adecd22):

| Dado | Valor | Fonte |
|---|---|---|
| Tempo registrado | 40h04 (código 36h19, configuração e build 0h41, depuração 1h24, espera de ferramenta 1h40) | `tempo-segmentos.sh` |
| Compartilhamento de código | 98,3% em `src/` e na entrada do app (16.821 linhas comuns, 243 Android, 56 iOS) | `compartilhamento.sh` |
| Código por plataforma no JS | 0 arquivos `.android`/`.ios` e 13 usos de `Platform.OS` e `Platform.select` | `compartilhamento.sh` |
| LOC adicionadas por origem | assistido 20.092, manual 2.470, gerado 359 | `loc-por-origem.sh` |
| Linhas finais por origem | assistido 87,8%, manual 10,6%, gerado 1,6% | `sobrevivencia.sh` |
| Prompts | 188 em 25 issues | issues |
| Dificuldade média | 2,20 (25 issues) | issues |
| Confiança média no código da IA | 4,92 (25 issues) | issues |
| Retrabalho relevante | nenhum (25 issues com "Não") | issues |
| Bugs registrados | 10 | issues com label `bug` |

## 1. Facilidade de uso

**Pontos positivos.** Todas as telas ficaram em `src/`, com tela, ViewModel em hook e componentes no código comum. Login (#2), Cadastro (#10), Home (#3), Produto (#13), Carrinho (#14), Checkout (#15), Endereço (#16), Perfil (#11), Configurações (#22), Tema (#23) e Favoritos (#24) não tiveram nenhum código por plataforma. A partir do Cadastro, cada tela reaproveitou o padrão de hook, toast e os 59 componentes do design system (#5). Fotos por URL, gradiente e sombra saíram do próprio React Native, sem biblioteca extra (#3).

**Pontos trabalhosos.** O React Native não tem slider no core, e o `Modal` abre numa janela separada no Android, o que levou a um slider próprio com `PanResponder` e a um bottom sheet na própria tela (#12). A notificação local (#25, #26), a conexão (#28) e a exclusão do gesto de voltar (#12) precisaram de módulos nativos em Kotlin escritos à mão. Câmera, galeria e recorte vieram de bibliotecas com código nativo, que pedem recompilar o app (#27).

## 2. Documentação

**Ajudou.** "useFocusEffect" do React Navigation (#13, #15, #19, #20, #22, #24), "useSyncExternalStore" do React (#22, #23, #24), "Animated" (#3, #16, #18, #19), "TextInput" (#2, #10, #14, #17) e "PermissionsAndroid" (#25, #26, #27) do React Native, "Create a notification" (#25) e "Read network state" (#28) do Android.

**Falhou ou ficou incompleta.**
- **Exemplos ausentes.** A página "Testing" do React Native não explica como simular módulos nativos no Jest (#9). A do KeyboardAvoidingView só lista os valores de `behavior`, sem explicar a diferença entre Android e iOS (#10).
- **Documentação legada.** "Android Native Modules", usada nos três módulos nativos, está marcada como legado da arquitetura antiga (#12, #28).
- **Documentação só do Android.** Notificação, permissão de notificação e conexão vieram da documentação do Android e precisaram ser ligadas ao JavaScript à mão (#25, #26, #28).

## 3. Depuração

**Apoio numérico.** 1h24 em segmentos de depuração (3,5% das 40h04) e 10 bugs registrados.

**Erros de tipo e de teste.** Foram achados pela mensagem do `tsc` ou do Jest:
- repositórios falsos sem os métodos novos (#2, #13, #14, #26, #28);
- tipo do `ref` do `TextInput` no React Native 0.88 (#10);
- React Navigation em ESM no Jest (#9) e módulos nativos ausentes no Jest (#27);
- laço de renderização por objeto novo a cada leitura no `useSyncExternalStore` (#25) e por relógio recriado a cada render (#20);
- timer aberto que impedia o Jest de terminar (#22).

**Erros de execução.** Exigiram o emulador:
- sessão tratada como expirada sem rede (#3, #8);
- gesto de voltar fechando os filtros (#12);
- número do carrinho desatualizado ao voltar para a Home (#13);
- tema do backend no Perfil (#23).

**Erros de interface.** Os problemas visuais foram achados por captura de tela no emulador (#19, #20).

## 4. Curva de aprendizado

**Base conhecida.** Com um ano de React Native, a maioria das telas registrou curva baixa e "repetiu os padrões das telas anteriores" (#2, #13, #14, #16, #21).

**O que foi novo.** O React Native 0.88 com edge-to-edge obrigatório e o React Navigation 7 (#9), o `ref` como prop do React 19 (#10) e o `useSyncExternalStore` para estado compartilhado entre telas (#24).

**Como a curva evoluiu.**
- **Ficou baixa nas telas comuns.** As notas de #13 a #24 registram curva baixa.
- **Subiu nos pontos nativos.** A Busca (#12) e a foto de perfil (#27) tiveram curva média, e a central de notificações custou mais que as telas anteriores por causa do módulo nativo (#25).

## 5. Acesso a APIs nativas

**Apoio numérico.** 243 linhas específicas do Android e 56 do iOS. Nenhum arquivo `.android` ou `.ios` no JavaScript; 13 usos de `Platform.OS` e `Platform.select`, a maioria para a fonte monoespaçada (#17 a #20).

**Telas com integração nativa:**

| Recurso | Android | iOS | Issues |
|---|---|---|---|
| Armazenamento seguro | Keystore pela react-native-keychain | Keychain pela react-native-keychain | #8, #9 |
| Exclusão do gesto de voltar | módulo nativo com `setSystemGestureExclusionRects` | não se aplica | #12 |
| Câmera, galeria e recorte | react-native-image-picker, image-editor e permissão CAMERA | textos de uso da câmera e da galeria | #27 |
| Notificações | módulo nativo com canal, `POST_NOTIFICATIONS` e `PendingIntent` | não implementado | #25, #26 |
| Conexão | módulo nativo com `ConnectivityManager` | não implementado, considerado conectado | #28 |

**Limitação.** O código iOS não foi compilado nesta máquina, porque exige Mac (#9, #25, #27). Notificação e conexão ficaram sem implementação nativa no iOS.

## 6. Impacto da IA

**Apoio numérico.** As linhas finais vêm 87,8% de commits assistidos, 10,6% de commits manuais e 1,6% de commits gerados. Foram 188 prompts em 25 issues, com confiança média de 4,92 e nenhum retrabalho relevante.

**Onde a IA ajudou.** Nas notas, a IA aparece como apoio em:
- estrutura dos ViewModels em hook e dos testes (#2, #3, #10, #13 a #24);
- módulos nativos em Kotlin (#12, #25, #28);
- correções pequenas, geradas a partir do erro do compilador ou do Jest (#4, #26, #28).

**O que ficou com a dona do projeto.**
- ícones;
- ligação das telas com a navegação;
- parte dos repositórios e das validações (#10, #17, #20);
- testes manuais no emulador, que acharam os bugs de execução (#12, #13, #19, #23).
