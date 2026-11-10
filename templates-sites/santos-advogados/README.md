# Santos Advogados

Cópia do template `escritorio-advocacia`, personalizada para o escritório Santos Advogados, de Uberlândia (MG). A estrutura, as interações, as animações, os gatilhos de scroll e o `script.js` permanecem os do template original. Foram adaptados conteúdo, fotografias, identidade visual, logo e dados de contato.

## Abrir localmente

Na raiz do repositório:

```powershell
py -m http.server 4183 --bind 127.0.0.1 --directory .\templates-sites
```

Abra `http://127.0.0.1:4183/santos-advogados/`.

## Identidade e conteúdo

A identidade usa a logo oficial disponível em `assets/santos/logo-oficial.png` e a paleta preto, marfim e dourado. A hero mantém a estátua dourada da Justiça e a composição original do template. As fotos locais representam o escritório, sua linha do tempo e os profissionais apresentados.

Os dados de contato e endereço ficam em `site.config.js`. As áreas de atuação, perfis, princípios e artigos foram adaptados a partir das informações públicas do escritório. O formulário não envia dados por conta própria: ele abre um rascunho de e-mail para conferência e envio pela pessoa visitante.
