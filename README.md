# Sky Dash

Jogo arcade 2D de exploração espacial, feito com JavaScript, HTML, CSS e Canvas. Controle uma nave, desvie de perigos, destrua inimigos e chefes, colete créditos e melhore sua frota.

## Clonar o repositório

```bash
git clone https://github.com/hudsondfonseca/SkyDash.git
cd SkyDash
```

## Requisitos

- Node.js 18 ou superior
- Navegador moderno com suporte a Canvas 2D e Web Audio

O projeto não precisa instalar pacotes npm para rodar.

## Executar localmente

Na pasta que contém este README, rode:

```bash
npm run dev
```

Abra [http://127.0.0.1:8080](http://127.0.0.1:8080) no navegador. Para usar outra porta, defina a variável `PORT` antes de iniciar o servidor.

## Jogar

- **W / S:** mover a nave para cima e para baixo.
- **A / D:** mover para a esquerda e para a direita.
- **F:** disparo manual, quando o disparo automático estiver desativado.
- **P / Esc:** pausar ou retomar a partida.
- **Mouse ou toque:** direcionar a nave no eixo vertical; toque/clique também dispara no modo manual.

As teclas podem ser alteradas no menu **Controles**. As configurações de controles, recorde e melhorias são guardadas no armazenamento local do navegador.

## Verificações

```bash
npm run check
npm test
```

`npm run check` verifica a sintaxe dos arquivos JavaScript. `npm test` executa os testes do relógio de simulação.

## Estrutura do projeto

- `index.html` e `style.css`: página, interface e estilos responsivos.
- `game.js`: estado da partida, regras, colisões e loop de jogo.
- `game-ui.js`: menus, configurações, loja e melhorias.
- `game-input.js`: controles de teclado, ponteiro e toque.
- `game-accessibility.js`: foco, navegação por teclado e semântica dos diálogos.
- `game-clock.js`: relógio de simulação em passo fixo de 60 Hz.
- `entities.js`: nave, inimigos, chefes, projéteis e efeitos.
- `background.js` e `assets/background/config.json`: cenário espacial em camadas e sua configuração.
- `sound.js`: efeitos sonoros.
- `assets/sprites/` e `assets/psd/`: sprites e recursos visuais.
- `tools/dev-server.mjs`: servidor estático de desenvolvimento, sem dependências externas.
- `tests/`: testes automatizados.

## Ajustar o cenário

Edite `assets/background/config.json` para configurar camadas, densidade, parallax, sementes e planetas. O jogo usa esse arquivo como configuração base; preferências salvas anteriormente no navegador têm precedência sobre os valores do arquivo.

## Hospedagem

O jogo é estático e pode ser servido por qualquer servidor HTTP. Publique os arquivos do projeto mantendo os caminhos relativos, especialmente `assets/background/config.json`, sprites e scripts. Abrir `index.html` diretamente como arquivo pode impedir o carregamento da configuração do cenário; use um servidor HTTP.
