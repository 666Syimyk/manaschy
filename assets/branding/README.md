# Branding assets

Все четыре файла создаются локально из собственных SVG-примитивов в `scripts/generate-branding-assets.js`; внешние изображения, шрифтовые файлы и товарные знаки не импортируются. Текущий набор воспроизведён 2026-09-28 командой `npm run assets:generate`.

| Файл | Размер | Генератор / источник | Основание использования | Активное использование |
|---|---:|---|---|---|
| `app-icon.png` | 1024×1024 | `scripts/generate-branding-assets.js`, 2026-09-28 | Оригинальная детерминированная геометрия проекта | Общая и iOS-иконка в `app.json` |
| `adaptive-icon-foreground.png` | 1024×1024 | тот же скрипт, 2026-09-28 | Оригинальная детерминированная геометрия проекта | Android adaptive foreground |
| `logo-mark.png` | 512×512 | тот же скрипт, 2026-09-28 | Оригинальная детерминированная геометрия проекта | Онбординг, навигация и web favicon |
| `splash-icon.png` | 512×512 | тот же скрипт, 2026-09-28 | Оригинальная детерминированная геометрия проекта | Нативный splash screen |

SHA-256 текущих файлов:

```text
adaptive-icon-foreground.png  E8DA671FAC0C9610142AC85821C13D39AFD036E5BD22047DE59876B53FBF8462
app-icon.png                  F0BBAE316FFFC80F78028E1F10E17251270AD01DCA4DCFAD79F7C3A5D623C6EC
logo-mark.png                 CBA9F94A0E6BB8F763AC738A5CD4F55BA1573B6DD8A252F209F8AB7A43D6A6BA
splash-icon.png               36112B83BD6067538C45543C5B74B54E9998854EAF9A770A7F88E4A282BB864D
```

После изменения генератора выполните `npm run assets:generate && npm run assets:audit` и обновите дату и хеши.
