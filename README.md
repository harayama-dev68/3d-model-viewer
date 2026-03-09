# 3D Model Viewer

three.js を使ったシンプルな 3D モデルビューアです。3D ファイルをドラッグ & ドロップすると読み込んで表示します。

※ 依存ライブラリは CDN から読み込むため、初回表示時はインターネット接続が必要です。

## 対応フォーマット

- `.gltf` / `.glb`
- `.obj`
- `.fbx`
- `.stl`
- `.ply`
- `.3mf`
- `.dae`

## 起動方法

```bash
python3 -m http.server 8000
```

ブラウザで `http://localhost:8000` を開いて使用してください。
