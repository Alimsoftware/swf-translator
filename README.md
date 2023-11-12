SWF translator
--------------

Uma tentativa de emular SWF em um ambiente HTML5. WebGL2 é necessário.

## Uso

Requisito:
- NodeJS >= 12

Construir código-fonte:
```
yarn install
yarn build
```

Traduzir tags SWF:
```
node packages/swf-translator/dist/index.js build-swf <caminho para swf> <diretório de saída>
```

Traduzir código-fonte AS3:
```
node packages/swf-translator/dist/index.js build-as3 <diretório de origem AS3> <diretório de saída>
```

Montagem necessária para executar a saída, algumas dicas:
- Alias ​​`swf-lib` no código-fonte de saída para o pacote `swf-lib` compilado.
- Definição de caractere do pacote JSON: `JSON.stringify` a variável `bundle` no caractere `index.js`.
- Construir manifesto de ativos:
  ```json5
  {
    "data": "data",
    "properties": {}, // embed properties.json
    "assets": {
      "data": {
        "url": "./data.json", // caminho para a definição de caracteres agrupados JSON
        "size": 0, // zero se não houver necessidade de relatório de progresso
      },
      "character1": {
        "url": "./character1.png",
        "size": 0,
      }
      // etc.
    }
  }
  ```
- Iniciar o SWF:
  ```js
  import lib from "swf-lib";
  const manifest = { /* ... */ };
  const library = await lib.__internal.loadManifest(manifest);
  const stage = new lib.flash.display.Stage(library.properties);
  stage.__withContext(() => stage.addChild(library.instantiateCharacter(0)))();
  document.body.appendChild(stage.__canvas.container);
  ```

## Documentação técnica
- [Tradutor](./docs/translator.md)
- [Runtime](./docs/runtime.md)

## Licença
MIT
