# Demo и рабочий цикл разработки

Документ описывает актуальный запуск demo и повседневный workflow.

## Требования

- Node.js + pnpm.
- Docker и Docker Compose для nginx demo.

## Установка

```bash
pnpm install
```

## Проверка и сборка

```bash
pnpm run typecheck
pnpm run build
```

Что делает `build`:
- компилирует TypeScript в `dist`;
- копирует и адаптирует demo-файлы;
- подготавливает browser vendor-модули (`@joint/core`, `rbush`, `quickselect`);
- обновляет `dist/__reload.txt`.

## Watch + autoreload

```bash
pnpm run build:watch
```

Поведение:
- `tsc --watch` в polling-режиме;
- после успешной компиляции запускается `scripts/prepare-demo.mjs`;
- маркер `dist/__reload.txt` обновляется;
- `vanilla-index.html` опрашивает маркер и перезагружает страницу автоматически.

## Запуск demo через nginx

```bash
docker compose up -d
```

Проверка:
- открыть `http://localhost:8080`;
- root отдает `vanilla-index.html` из `dist`;
- модули и vendor-файлы отдаются напрямую из `dist`.

Остановить:

```bash
docker compose down
```

## Что редактировать в первую очередь

- Источник библиотеки: `src/**`.
- Vanilla demo: `examples/vanilla-index.html`, `examples/vanilla-launch.js`.
- Локальный веб-рантайм: `nginx.conf`, `docker-compose.yml`.
- Скрипты сборки demo: `scripts/prepare-demo.mjs`, `scripts/watch-with-autoreload.mjs`.

## Быстрая диагностика

- Если в браузере ошибки bare specifier, проверить importmap и наличие `dist/vendor/*`.
- Если модуль блокируется MIME type, проверить `nginx.conf` (`.mjs` -> `application/javascript`).
- Если после изменений нет обновления страницы, проверить что `build:watch` жив и `dist/__reload.txt` меняется.
- Если ломается восстановление графа из JSON, проверить `cellNamespace` и типы `topology.NetworkNode`/`topology.NetworkLink`.
