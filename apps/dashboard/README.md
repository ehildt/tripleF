<div align="center">

# 3F tripleF — Dashboard

The tripleF workbench UI: a Vue 3 dashboard for the 3F harness — streaming multi-modal chat with reasoning areas and compaction, system control (providers, preprocessing, health, search engines), dead-letter replay, image preprocessing preview — built with Vite, Pinia, TanStack Query, Tailwind CSS v4, and Socket.IO.

</div>

<br>

<!-- DEPBADGE:START -->
<div align="center">

![github](https://img.shields.io/github/release/ehildt/tripleF?labelColor=333&style=for-the-badge&cacheSeconds=3600&color=b16425&logo=github&logoColor=b16425&logoWidth=40&branch=main)
![github](https://img.shields.io/github/stars/ehildt/tripleF?labelColor=333&style=for-the-badge&cacheSeconds=3600&color=b16425&logo=github&logoColor=b16425&logoWidth=40&branch=main)
![license](https://img.shields.io/badge/license-PolyForm%20Strict%201.0.0-b16425?labelColor=333&style=for-the-badge&logo=github&logoColor=b16425&logoWidth=40)
[![codecov](https://img.shields.io/codecov/c/github/ehildt/tripleF?labelColor=333&cacheSeconds=3600&logo=codecov&logoColor=4021b0&logoWidth=40&style=for-the-badge&color=4021b0&branch=main)](https://about.codecov.io/)

</div>

<br>

<div align="center">

# Dependencies

[![@headlessui/vue](https://img.shields.io/badge/_headlessui_vue-v1.7.23-2c60c9.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=2c60c9&logoWidth=40&style=flat-square)](https://github.com/tailwindlabs/headlessui)
[![@lucide/icons](https://img.shields.io/badge/_lucide_icons-v1.70.0-2b36ab.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=2b36ab&logoWidth=40&style=flat-square)](https://github.com/lucide-icons/lucide)
[![@lucide/vue](https://img.shields.io/badge/_lucide_vue-v1.70.0-26e3d3.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=26e3d3&logoWidth=40&style=flat-square)](https://github.com/lucide-icons/lucide)
[![@paralleldrive/cuid2](https://img.shields.io/badge/_paralleldrive_cuid2-v3.3.0-b36e1a.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=b36e1a&logoWidth=40&style=flat-square)](https://github.com/paralleldrive/cuid2)
[![@tanstack/vue-query](https://img.shields.io/badge/_tanstack_vue_query-v5.107.1-98d22d.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=98d22d&logoWidth=40&style=flat-square)](https://github.com/tanstack/query)
[![@types/turndown](https://img.shields.io/badge/_types_turndown-v5.0.6-1ac76d.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=1ac76d&logoWidth=40&style=flat-square)](https://github.com/DefinitelyTyped/DefinitelyTyped)
[![@vueuse/core](https://img.shields.io/badge/_vueuse_core-v15.0.0-ae2964.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=ae2964&logoWidth=40&style=flat-square)](https://github.com/vueuse/vueuse)
[![d3-axis](https://img.shields.io/badge/d3_axis-v3.0.1-358ad0.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=358ad0&logoWidth=40&style=flat-square)](https://github.com/d3/d3-axis)
[![d3-force-3d](https://img.shields.io/badge/d3_force_3d-v3.0.6-ab3a26.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=ab3a26&logoWidth=40&style=flat-square)](https://github.com/vasturiano/d3-force-3d)
[![d3-scale](https://img.shields.io/badge/d3_scale-v4.0.3-21de60.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=21de60&logoWidth=40&style=flat-square)](https://github.com/d3/d3-scale)
[![d3-selection](https://img.shields.io/badge/d3_selection-v3.0.1-c5cb25.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=c5cb25&logoWidth=40&style=flat-square)](https://github.com/d3/d3-selection)
[![d3-shape](https://img.shields.io/badge/d3_shape-v3.2.1-28e2df.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=28e2df&logoWidth=40&style=flat-square)](https://github.com/d3/d3-shape)
[![d3-time-format](https://img.shields.io/badge/d3_time_format-v4.1.1-16b6ae.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=16b6ae&logoWidth=40&style=flat-square)](https://github.com/d3/d3-time-format)
[![d3-zoom](https://img.shields.io/badge/d3_zoom-v3.0.1-d51aad.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=d51aad&logoWidth=40&style=flat-square)](https://github.com/d3/d3-zoom)
[![date-fns](https://img.shields.io/badge/date_fns-v4.4.0-271ad5.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=271ad5&logoWidth=40&style=flat-square)](https://github.com/date-fns/date-fns)
[![dexie](https://img.shields.io/badge/dexie-4.4.7-41af23.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=41af23&logoWidth=40&style=flat-square)](https://github.com/dexie/Dexie.js)
[![dompurify](https://img.shields.io/badge/dompurify-v3.4.17-ab9326.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=ab9326&logoWidth=40&style=flat-square)](https://github.com/cure53/DOMPurify)
[![flag-icons](https://img.shields.io/badge/flag_icons-v7.6.0-bba12a.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=bba12a&logoWidth=40&style=flat-square)](https://github.com/lipis/flag-icons)
[![js-sha256](https://img.shields.io/badge/js_sha256-v1.0.0-4e1bbb.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=4e1bbb&logoWidth=40&style=flat-square)](https://github.com/emn178/js-sha256)
[![markdown-it](https://img.shields.io/badge/markdown_it-v15.0.3-da2f9e.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=da2f9e&logoWidth=40&style=flat-square)](https://github.com/markdown-it/markdown-it)
[![partial-json](https://img.shields.io/badge/partial_json-v0.1.7-1a6ac7.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=1a6ac7&logoWidth=40&style=flat-square)](https://github.com/promplate/partial-json-parser-js)
[![pinia](https://img.shields.io/badge/pinia-v4.1.0-2a47c6.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=2a47c6&logoWidth=40&style=flat-square)](https://github.com/vuejs/pinia)
[![socket.io-client](https://img.shields.io/badge/socket_io_client-v4.8.4-6327c4.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=6327c4&logoWidth=40&style=flat-square)](https://github.com/socketio/socket.io)
[![ts-unused-exports](https://img.shields.io/badge/ts_unused_exports-v11.0.1-5e26c0.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=5e26c0&logoWidth=40&style=flat-square)](https://github.com/pinterest/ts-unused-exports)
[![turndown](https://img.shields.io/badge/turndown-v7.2.5-ad7b1f.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=ad7b1f&logoWidth=40&style=flat-square)](https://github.com/mixmark-io/turndown)
[![vue](https://img.shields.io/badge/vue-v3.5.45-18b928.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=18b928&logoWidth=40&style=flat-square)](https://github.com/vuejs/core)
[![vue-i18n](https://img.shields.io/badge/vue_i18n-v11.4.18-3897dc.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=3897dc&logoWidth=40&style=flat-square)](https://github.com/intlify/vue-i18n)
[![vue-router](https://img.shields.io/badge/vue_router-v5.4.0-c2b724.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=c2b724&logoWidth=40&style=flat-square)](https://github.com/vuejs/router)
[![zod](https://img.shields.io/badge/zod-v4.6.7-1eabb3.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=1eabb3&logoWidth=40&style=flat-square)](https://github.com/colinhacks/zod)

</div>

<br>

<div align="center">

# DevDependencies

[![@chromatic-com/storybook](https://img.shields.io/badge/_chromatic_com_storybook-v5.6.0-e62d55.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=e62d55&logoWidth=40&style=flat-square)](https://github.com/chromaui/chromatic)
[![@eslint/css](https://img.shields.io/badge/_eslint_css-v2.0.1-e23728.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=e23728&logoWidth=40&style=flat-square)](https://github.com/eslint/eslint)
[![@eslint/js](https://img.shields.io/badge/_eslint_js-v10.0.1-7a23a9.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=7a23a9&logoWidth=40&style=flat-square)](https://github.com/eslint/eslint)
[![@eslint/json](https://img.shields.io/badge/_eslint_json-v2.1.1-46b616.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=46b616&logoWidth=40&style=flat-square)](https://github.com/eslint/eslint)
[![@eslint/markdown](https://img.shields.io/badge/_eslint_markdown-v8.0.3-29c021.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=29c021&logoWidth=40&style=flat-square)](https://github.com/eslint/eslint)
[![@storybook/addon-a11y](https://img.shields.io/badge/_storybook_addon_a11y-v10.6.6-e0b629.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=e0b629&logoWidth=40&style=flat-square)](https://github.com/storybookjs/storybook)
[![@storybook/addon-docs](https://img.shields.io/badge/_storybook_addon_docs-v10.6.6-c7d440.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=c7d440&logoWidth=40&style=flat-square)](https://github.com/storybookjs/storybook)
[![@storybook/vue3-vite](https://img.shields.io/badge/_storybook_vue3_vite-v10.6.6-1de276.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=1de276&logoWidth=40&style=flat-square)](https://github.com/storybookjs/storybook)
[![@tailwindcss/postcss](https://img.shields.io/badge/_tailwindcss_postcss-v4.3.5-b72ab0.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=b72ab0&logoWidth=40&style=flat-square)](https://github.com/tailwindlabs/tailwindcss)
[![@testing-library/jest-dom](https://img.shields.io/badge/_testing_library_jest_dom-v7.0.1-80de21.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=80de21&logoWidth=40&style=flat-square)](https://github.com/testing-library/jest-dom)
[![@testing-library/vue](https://img.shields.io/badge/_testing_library_vue-v8.1.0-e326ad.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=e326ad&logoWidth=40&style=flat-square)](https://github.com/testing-library/vue-testing-library)
[![@types/d3-axis](https://img.shields.io/badge/_types_d3_axis-v3.0.6-75ba2c.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=75ba2c&logoWidth=40&style=flat-square)](https://github.com/DefinitelyTyped/DefinitelyTyped)
[![@types/d3-scale](https://img.shields.io/badge/_types_d3_scale-v4.0.9-4127c4.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=4127c4&logoWidth=40&style=flat-square)](https://github.com/DefinitelyTyped/DefinitelyTyped)
[![@types/d3-selection](https://img.shields.io/badge/_types_d3_selection-v3.0.12-c1db1a.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=c1db1a&logoWidth=40&style=flat-square)](https://github.com/DefinitelyTyped/DefinitelyTyped)
[![@types/d3-shape](https://img.shields.io/badge/_types_d3_shape-v3.2.0-b026cf.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=b026cf&logoWidth=40&style=flat-square)](https://github.com/DefinitelyTyped/DefinitelyTyped)
[![@types/d3-time-format](https://img.shields.io/badge/_types_d3_time_format-v4.0.3-28d7b1.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=28d7b1&logoWidth=40&style=flat-square)](https://github.com/DefinitelyTyped/DefinitelyTyped)
[![@types/d3-zoom](https://img.shields.io/badge/_types_d3_zoom-v3.0.9-1895bf.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=1895bf&logoWidth=40&style=flat-square)](https://github.com/DefinitelyTyped/DefinitelyTyped)
[![@types/dompurify](https://img.shields.io/badge/_types_dompurify-v3.2.0-d0ba39.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=d0ba39&logoWidth=40&style=flat-square)](https://github.com/DefinitelyTyped/DefinitelyTyped)
[![@types/markdown-it](https://img.shields.io/badge/_types_markdown_it-v14.2.0-acbe23.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=acbe23&logoWidth=40&style=flat-square)](https://github.com/DefinitelyTyped/DefinitelyTyped)
[![@types/node](https://img.shields.io/badge/_types_node-v26.6.6-d51a33.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=d51a33&logoWidth=40&style=flat-square)](https://github.com/DefinitelyTyped/DefinitelyTyped)
[![@vitejs/plugin-vue](https://img.shields.io/badge/_vitejs_plugin_vue-v6.0.10-2943c7.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=2943c7&logoWidth=40&style=flat-square)](https://github.com/vitejs/vite-plugin-vue)
[![@vitest/coverage-v8](https://img.shields.io/badge/_vitest_coverage_v8-v5.1.0-92d435.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=92d435&logoWidth=40&style=flat-square)](https://github.com/vitest-dev/vitest)
[![@vitest/ui](https://img.shields.io/badge/_vitest_ui-5.1.0-c3441d.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=c3441d&logoWidth=40&style=flat-square)](https://github.com/vitest-dev/vitest)
[![@vue/test-utils](https://img.shields.io/badge/_vue_test_utils-v2.5.1-d2324a.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=d2324a&logoWidth=40&style=flat-square)](https://github.com/vuejs/test-utils)
[![@vue/tsconfig](https://img.shields.io/badge/_vue_tsconfig-v0.9.1-cec936.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=cec936&logoWidth=40&style=flat-square)](https://github.com/vuejs/tsconfig)
[![depcheck](https://img.shields.io/badge/depcheck-v1.4.7-28a95e.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=28a95e&logoWidth=40&style=flat-square)](https://github.com/depcheck/depcheck)
[![dependency-cruiser](https://img.shields.io/badge/dependency_cruiser-v18.7.2-c22431.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=c22431&logoWidth=40&style=flat-square)](https://github.com/sverweij/dependency-cruiser)
[![eslint](https://img.shields.io/badge/eslint-v10.14.0-3f2ab7.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=3f2ab7&logoWidth=40&style=flat-square)](https://github.com/eslint/eslint)
[![eslint-config-prettier](https://img.shields.io/badge/eslint_config_prettier-v10.1.8-c4921c.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=c4921c&logoWidth=40&style=flat-square)](https://github.com/prettier/eslint-config-prettier)
[![eslint-plugin-prettier](https://img.shields.io/badge/eslint_plugin_prettier-v5.5.7-d19d2e.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=d19d2e&logoWidth=40&style=flat-square)](https://github.com/prettier/eslint-plugin-prettier)
[![eslint-plugin-simple-import-sort](https://img.shields.io/badge/eslint_plugin_simple_import_sort-v14.0.0-39d025.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=39d025&logoWidth=40&style=flat-square)](https://github.com/lydell/eslint-plugin-simple-import-sort)
[![eslint-plugin-sonarjs](https://img.shields.io/badge/eslint_plugin_sonarjs-v4.2.2-ca216a.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=ca216a&logoWidth=40&style=flat-square)](https://github.com/SonarSource/eslint-plugin-sonarjs)
[![eslint-plugin-storybook](https://img.shields.io/badge/eslint_plugin_storybook-v10.6.6-22afb9.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=22afb9&logoWidth=40&style=flat-square)](https://github.com/storybookjs/eslint-plugin-storybook)
[![eslint-plugin-vue](https://img.shields.io/badge/eslint_plugin_vue-v10.12.0-b79b2a.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=b79b2a&logoWidth=40&style=flat-square)](https://github.com/vuejs/eslint-plugin-vue)
[![globals](https://img.shields.io/badge/globals-v17.14.0-2570b1.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=2570b1&logoWidth=40&style=flat-square)](https://github.com/sindresorhus/globals)
[![jsdom](https://img.shields.io/badge/jsdom-v30.1.3-b32623.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=b32623&logoWidth=40&style=flat-square)](https://github.com/jsdom/jsdom)
[![lint-staged](https://img.shields.io/badge/lint_staged-v17.6.0-dfba26.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=dfba26&logoWidth=40&style=flat-square)](https://github.com/lint-staged/lint-staged)
[![postcss](https://img.shields.io/badge/postcss-v8.5.32-4fb31a.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=4fb31a&logoWidth=40&style=flat-square)](https://github.com/postcss/postcss)
[![prettier](https://img.shields.io/badge/prettier-v3.9.10-48bd28.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=48bd28&logoWidth=40&style=flat-square)](https://github.com/prettier/prettier)
[![storybook](https://img.shields.io/badge/storybook-v10.6.6-1acb2c.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=1acb2c&logoWidth=40&style=flat-square)](https://github.com/storybookjs/storybook)
[![tailwindcss](https://img.shields.io/badge/tailwindcss-v4.3.5-ba1ca8.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=ba1ca8&logoWidth=40&style=flat-square)](https://github.com/tailwindlabs/tailwindcss)
[![typescript](https://img.shields.io/badge/typescript-v5.9.3-4c2eb8.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=4c2eb8&logoWidth=40&style=flat-square)](https://github.com/Microsoft/TypeScript)
[![typescript-eslint](https://img.shields.io/badge/typescript_eslint-v8.72.1-dc2e59.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=dc2e59&logoWidth=40&style=flat-square)](https://github.com/typescript-eslint/typescript-eslint)
[![vite](https://img.shields.io/badge/vite-v8.3.6-33cc66.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=33cc66&logoWidth=40&style=flat-square)](https://github.com/vitejs/vite)
[![vitest](https://img.shields.io/badge/vitest-v5.1.0-80c026.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=80c026&logoWidth=40&style=flat-square)](https://github.com/vitest-dev/vitest)
[![vue-eslint-parser](https://img.shields.io/badge/vue_eslint_parser-v10.4.2-2fc173.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=2fc173&logoWidth=40&style=flat-square)](https://github.com/vuejs/vue-eslint-parser)
[![vue-tsc](https://img.shields.io/badge/vue_tsc-v3.3.14-54bc24.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=54bc24&logoWidth=40&style=flat-square)](https://github.com/vuejs/language-tools)

</div>
<!-- DEPBADGE:END -->

<br>

<div align="center">

[E-MAIL](mailto:eugen.hildt@gmail.com) &nbsp;—&nbsp; [WIKI](https://github.com/ehildt/tripleF/wiki) &nbsp;—&nbsp; [ISSUES](https://github.com/ehildt/tripleF/issues) &nbsp;—&nbsp; [DONATE](https://github.com/sponsors/ehildt) &nbsp;—&nbsp; [AI GUIDANCE](https://github.com/ehildt/tripleF/wiki/ai-guidance)

</div>

<br>
