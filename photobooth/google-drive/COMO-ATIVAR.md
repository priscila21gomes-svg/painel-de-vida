# Álbum da campanha no Google Drive — como ativar (≈ 5 minutos)

As fotos só são enviadas quando a pessoa toca em **"Enviar para o álbum da campanha"**. Elas caem na pasta **Photobooth Peak Season** do Drive,
separadas por dia.

> Dica: use uma conta Google só da campanha (ou um Drive do Google Workspace da empresa).
> A conta gratuita tem 15 GB divididos com Gmail e Fotos — dá para ~30 mil fotos.

## 1. Criar o script
1. Entre em **script.google.com** com a conta que vai guardar as fotos.
2. Clique em **Novo projeto** e dê o nome **Photobooth Peak Season**.
3. Apague o conteúdo do arquivo `Código.gs` e cole todo o conteúdo de `Code.gs` desta pasta.
4. Clique em **Salvar** (ícone de disquete).

## 2. Autorizar o acesso ao Drive
1. No menu de funções lá em cima, escolha **testar** e clique em **Executar**.
2. Clique em **Revisar permissões** → escolha a conta → **Avançado** → **Acessar Photobooth Peak Season (não seguro)** → **Permitir**.
   (O aviso aparece porque o script é seu e não foi publicado na loja do Google.)
3. Confira no Drive: deve aparecer a pasta **Photobooth Peak Season** com as 7 pastas dos dias.

## 3. Publicar
1. Clique em **Implantar** → **Nova implantação**.
2. Em **Selecionar tipo** (engrenagem), escolha **App da Web**.
3. Preencha:
   - **Executar como:** Eu
   - **Quem pode acessar:** Qualquer pessoa
4. Clique em **Implantar** e copie a **URL do app da Web** (termina em `/exec`).

## 4. Ligar no site
Cole a URL em `photobooth/config.js`, no campo `drive.urlScript`:

```js
drive: {
  urlScript: "https://script.google.com/macros/s/XXXXXXXX/exec",
},
```

Publique o site de novo. O bloco de autorização + botão aparece na tela da foto pronta.

## Conferir se está tudo certo
Abra a URL do script (a que termina em `/exec`) numa aba anônima. Deve aparecer:
`{"ok":true,"servico":"photobooth-drive","versao":3}`
Se não aparecer `"versao":3`, a versão nova ainda não foi implantada (veja abaixo).

## Se mudar o código do script depois
Use **Implantar → Gerenciar implantações → editar (lápis) → Versão: Nova versão → Implantar**.
Assim a URL continua a mesma.

## Cuidados (LGPD)
- A foto só é enviada com a autorização marcada pela própria pessoa.
- Defina quem da organização acessa a pasta e por quanto tempo as fotos ficam guardadas
  (ex.: apagar 30 dias após a campanha). Vale alinhar com Jurídico/RH.
