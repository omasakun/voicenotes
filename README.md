<!-- TODO: Translation -->
<div align="center">
  <h1>Voicenotes</h1>
  <p>大量の録音をまとめて検索・閲覧する</p>
</div>
<br>
<br>

<!-- TODO: Add screenshots here -->

## 使い方

TODO

## 開発のはじめかた

Linux や WSL2 での開発を想定しています。

```bash
# インストールしていない場合は asdf と pnpm を入れておきます。
# asdf: https://asdf-vm.com/guide/getting-started.html
# pnpm: https://pnpm.io/installation

# 必要なツールなどをインストールします。
asdf install
pdm  install -G :all
pnpm install

# これで準備完了です！
source .venv/bin/activate
python -m voicenotes
```

PDM の代わりに `requirements.txt` を使って依存関係をインストールすることもできます。
