# Plano: cenário cósmico modular em Pixel Art

## Tecnologia identificada
- Jogo web 2D feito com JavaScript puro, HTML e CSS.
- Renderização por Canvas 2D; não há engine ou framework no `package.json`.
- O loop e o cenário atual ficam em `game.js`; entidades ficam em `entities.js`.

## Etapas
1. Inspecionar a referência e o fluxo atual de inicialização, resize, câmera e desenho do fundo.
2. Criar `assets/background/` para recursos e documentação/configuração do cenário.
3. Implementar módulo independente com camadas de estrelas, nebulosas, planetas e asteroides, opções de visibilidade, posição, escala e velocidade parallax.
4. Integrar ao Canvas existente sem substituir controles, entidades, HUD ou geração de obstáculos.
5. Adaptar o canvas à resolução disponível mantendo coordenadas lógicas e pixel art sem suavização.
6. Verificar sintaxe/integração e executar o projeto quando o ambiente permitir; registrar claramente o que foi validado.

## Referência visual
Espaço profundo azul-marinho, nebulosas em azul e violeta, estrelas pequenas e estrelas brilhantes, planetas pixelados e asteroides em primeiro plano. O desenho deve usar formas em blocos e paleta limitada, sem gradientes borrados.
