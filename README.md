# Controle de Verduras

Site estático para registrar diariamente quantidades de verduras por **Caixa**, **ML** ou **Unidade**.

## Recursos

- Iniciar uma sessão por data
- Verduras iniciais: Salsa, Salsa crespa, Alface americana e Alface roxa
- Cadastrar e remover novas verduras
- Registrar quantidades por Caixa, ML ou Unidade
- Botões rápidos de quantidade
- Editar e remover lançamentos
- Finalizar sessão e gerar lista pronta para copiar
- Histórico local das sessões finalizadas
- Dados salvos no `localStorage` do navegador
- Interface responsiva para celular e computador

## Como rodar

Basta abrir `index.html` no navegador. Para desenvolvimento local, você também pode usar qualquer servidor HTTP simples.

Exemplo com Python:

```bash
python -m http.server 8080
```

Depois acesse `http://localhost:8080`.

## Publicação no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie `index.html`, `styles.css` e `app.js` para a branch `main`.
3. No GitHub, vá em **Settings > Pages**.
4. Em **Build and deployment**, escolha **Deploy from a branch**.
5. Selecione `main` e `/ (root)`.

O site não precisa de backend.
