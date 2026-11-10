# Escritório de Advocacia · template

Template de apresentação para escritórios de advocacia, adaptado da progressão visual e das interações observadas no site público da Consilio. A identidade, os textos e os exemplos foram reescritos para o contexto jurídico; não há logos, textos, depoimentos, métricas ou imagens da referência.

## Abrir localmente

Na raiz do repositório:

```powershell
py -m http.server 4183 --bind 127.0.0.1 --directory .\templates-sites
```

Abra `http://127.0.0.1:4183/escritorio-advocacia/`.

## Personalização

Edite `site.config.js` para definir nome, cidade, endereço, e-mail e telefone. Atualize `index.html` e troque as imagens ilustrativas por ativos licenciados ou autorizados pelo escritório. As áreas de atuação, etapas de trabalho, FAQs e pautas são exemplos editáveis, não consultoria jurídica nem descrição de um escritório real.

Os cards de casos estão explicitamente marcados como demonstrativos: substitua-os por casos autorizados e dados verificáveis antes de apresentar o site a um cliente. O formulário não tem backend: depois de configurar `contactEmail`, ele abre uma mensagem pré-preenchida no aplicativo de e-mail da pessoa. Nenhum dado é enviado ou armazenado pela página; o visitante decide se envia a mensagem. O formulário orienta a não incluir informações sigilosas.

A imagem da hero é um PNG gerado de uma estátua dourada da Deusa da Justiça, com fundo transparente. As demais imagens usam URLs públicas do Unsplash como material ilustrativo; revise licenças, disponibilidade e adequação de cada imagem ao escritório antes do uso final.

## Movimento e acessibilidade

A implementação é independente de frameworks e respeita `prefers-reduced-motion`. A navegação usa âncoras nativas, e os controles interativos funcionam por teclado.

## Uso como base para outros sites

Duplique `escritorio-advocacia/` para cada novo projeto. Personalize nome, identidade visual, textos, imagens, áreas de atuação, formulário e dados de contato. Não publique casos, depoimentos ou dados de clientes sem autorização. Revise os direitos de uso de toda imagem antes de colocar o site no ar.

## Estrutura

- `index.html`: página única com navegação por âncoras e seções adaptadas.
- `styles.css`: tokens, layout responsivo, estados e movimento.
- `site.config.js`: dados de marca e contato para adaptação.
- `script.js`: menu móvel, revelações de scroll e formulário via e-mail.
