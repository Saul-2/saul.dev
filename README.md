# Templates de sites

Modelos reutilizáveis para criar sites. O template atual está em `templates-sites/escritorio-advocacia/` e é feito em HTML, CSS e JavaScript, sem etapa de compilação.

## Abrir localmente

No PowerShell, na raiz deste repositório:

```powershell
py -m http.server 4183 --bind 127.0.0.1 --directory .\templates-sites
```

Abra `http://127.0.0.1:4183/escritorio-advocacia/` no navegador.

## Criar outro site a partir do modelo

Duplique a pasta `templates-sites/escritorio-advocacia/` e personalize `site.config.js`, `index.html`, `styles.css`, `script.js` e os arquivos em `assets/`. Substitua os textos e as imagens de demonstração por conteúdo autorizado para cada cliente. Veja o README dentro da pasta do template para instruções e limitações do formulário.
