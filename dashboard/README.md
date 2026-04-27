<div align="center">

# @CKIR.IO/VISIONS — Dashboard

A Vue 3 frontend dashboard for CKIR.IO/VISIONS, built with Vite, Tailwind CSS v4, and Socket.IO for real-time AI image analysis results.

</div>

<br>

<!-- DEPBADGE:START -->
<div align="center">

![github](https://img.shields.io/github/release/ehildt/ckir.io-visions?labelColor=333&style=for-the-badge&cacheSeconds=3600&color=b16425&logo=github&logoColor=b16425&logoWidth=40&branch=main)
![github](https://img.shields.io/github/stars/ehildt/ckir.io-visions?labelColor=333&style=for-the-badge&cacheSeconds=3600&color=b16425&logo=github&logoColor=b16425&logoWidth=40&branch=main)
![github](https://img.shields.io/github/license/ehildt/ckir.io-visions?labelColor=333&style=for-the-badge&cacheSeconds=3600&color=b16425&logo=github&logoColor=b16425&logoWidth=40&branch=main)
[![codecov](https://img.shields.io/codecov/c/github/ehildt/ckir.io-visions?labelColor=333&cacheSeconds=3600&logo=codecov&logoColor=4021b0&logoWidth=40&style=for-the-badge&color=4021b0&branch=main)](https://about.codecov.io/)

</div>

<br>

<div align="center">



# Dependencies

[![@headlessui/vue](https://img.shields.io/badge/_headlessui_vue-v1.7.23-2c60c9.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=2c60c9&logoWidth=40&style=flat-square)](https://github.com/tailwindlabs/headlessui)
[![@paralleldrive/cuid2](https://img.shields.io/badge/_paralleldrive_cuid2-v3.3.0-b36e1a.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=b36e1a&logoWidth=40&style=flat-square)](https://github.com/paralleldrive/cuid2)
[![@tanstack/vue-query](https://img.shields.io/badge/_tanstack_vue_query-v5.100.5-98d22d.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=98d22d&logoWidth=40&style=flat-square)](https://github.com/tanstack/query)
[![lucide-vue-next](https://img.shields.io/badge/lucide_vue_next-v0.577.0-4835d4.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=4835d4&logoWidth=40&style=flat-square)](https://github.com/lucide-icons/lucide)
[![pinia](https://img.shields.io/badge/pinia-v3.0.4-2a47c6.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=2a47c6&logoWidth=40&style=flat-square)](https://github.com/vuejs/pinia)
[![socket.io-client](https://img.shields.io/badge/socket_io_client-v4.8.3-6327c4.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=6327c4&logoWidth=40&style=flat-square)](https://github.com/socketio/socket.io)
[![vue](https://img.shields.io/badge/vue-v3.5.33-18b928.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=18b928&logoWidth=40&style=flat-square)](https://github.com/vuejs/core)
[![vue3-toastify](https://img.shields.io/badge/vue3_toastify-v0.2.9-36dd9d.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=36dd9d&logoWidth=40&style=flat-square)](https://github.com/jerrywu001/vue3-toastify)

</div>

<br>

<div align="center">



# DevDependencies

[![@eslint/css](https://img.shields.io/badge/_eslint_css-v0.14.1-e23728.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=e23728&logoWidth=40&style=flat-square)](https://github.com/eslint/eslint)
[![@eslint/js](https://img.shields.io/badge/_eslint_js-v9.39.4-7a23a9.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=7a23a9&logoWidth=40&style=flat-square)](https://github.com/eslint/eslint)
[![@eslint/json](https://img.shields.io/badge/_eslint_json-v0.14.0-46b616.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=46b616&logoWidth=40&style=flat-square)](https://github.com/eslint/eslint)
[![@eslint/markdown](https://img.shields.io/badge/_eslint_markdown-v7.5.1-29c021.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=29c021&logoWidth=40&style=flat-square)](https://github.com/eslint/eslint)
[![@iconify/json](https://img.shields.io/badge/_iconify_json-v2.2.467-48d624.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=48d624&logoWidth=40&style=flat-square)](https://github.com/iconify/iconify)
[![@iconify/tailwind4](https://img.shields.io/badge/_iconify_tailwind4-v1.2.3-19be19.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=19be19&logoWidth=40&style=flat-square)](https://github.com/iconify/iconify)
[![@tailwindcss/postcss](https://img.shields.io/badge/_tailwindcss_postcss-v4.2.4-b72ab0.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=b72ab0&logoWidth=40&style=flat-square)](https://github.com/tailwindlabs/tailwindcss)
[![@testing-library/jest-dom](https://img.shields.io/badge/_testing_library_jest_dom-v6.9.1-80de21.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=80de21&logoWidth=40&style=flat-square)](https://github.com/testing-library/jest-dom)
[![@testing-library/vue](https://img.shields.io/badge/_testing_library_vue-v8.1.0-e326ad.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=e326ad&logoWidth=40&style=flat-square)](https://github.com/testing-library/vue-testing-library)
[![@types/node](https://img.shields.io/badge/_types_node-v24.12.2-d51a33.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=d51a33&logoWidth=40&style=flat-square)](https://github.com/DefinitelyTyped/DefinitelyTyped)
[![@vitejs/plugin-vue](https://img.shields.io/badge/_vitejs_plugin_vue-v6.0.6-2943c7.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=2943c7&logoWidth=40&style=flat-square)](https://github.com/vitejs/vite-plugin-vue)
[![@vitest/coverage-v8](https://img.shields.io/badge/_vitest_coverage_v8-v4.1.5-92d435.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=92d435&logoWidth=40&style=flat-square)](https://github.com/vitest-dev/vitest)
[![@vitest/ui](https://img.shields.io/badge/_vitest_ui-4.1.5-c3441d.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=c3441d&logoWidth=40&style=flat-square)](https://github.com/vitest-dev/vitest)
[![@vue/test-utils](https://img.shields.io/badge/_vue_test_utils-v2.4.9-d2324a.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=d2324a&logoWidth=40&style=flat-square)](https://github.com/vuejs/test-utils)
[![@vue/tsconfig](https://img.shields.io/badge/_vue_tsconfig-v0.9.1-cec936.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=cec936&logoWidth=40&style=flat-square)](https://github.com/vuejs/tsconfig)
[![depcheck](https://img.shields.io/badge/depcheck-v1.4.7-28a95e.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=28a95e&logoWidth=40&style=flat-square)](https://github.com/depcheck/depcheck)
[![dependency-cruiser](https://img.shields.io/badge/dependency_cruiser-v17.3.10-c22431.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=c22431&logoWidth=40&style=flat-square)](https://github.com/sverweij/dependency-cruiser)
[![eslint](https://img.shields.io/badge/eslint-v9.39.4-3f2ab7.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=3f2ab7&logoWidth=40&style=flat-square)](https://github.com/eslint/eslint)
[![eslint-config-prettier](https://img.shields.io/badge/eslint_config_prettier-v10.1.8-c4921c.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=c4921c&logoWidth=40&style=flat-square)](https://github.com/prettier/eslint-config-prettier)
[![eslint-plugin-prettier](https://img.shields.io/badge/eslint_plugin_prettier-v5.5.5-d19d2e.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=d19d2e&logoWidth=40&style=flat-square)](https://github.com/prettier/eslint-plugin-prettier)
[![eslint-plugin-simple-import-sort](https://img.shields.io/badge/eslint_plugin_simple_import_sort-v12.1.1-39d025.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=39d025&logoWidth=40&style=flat-square)](https://github.com/lydell/eslint-plugin-simple-import-sort)
[![eslint-plugin-sonarjs](https://img.shields.io/badge/eslint_plugin_sonarjs-v3.0.7-ca216a.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=ca216a&logoWidth=40&style=flat-square)](https://github.com/SonarSource/eslint-plugin-sonarjs)
[![eslint-plugin-vue](https://img.shields.io/badge/eslint_plugin_vue-v10.9.0-b79b2a.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=b79b2a&logoWidth=40&style=flat-square)](https://github.com/vuejs/eslint-plugin-vue)
[![globals](https://img.shields.io/badge/globals-v16.5.0-2570b1.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=2570b1&logoWidth=40&style=flat-square)](https://github.com/sindresorhus/globals)
[![jsdom](https://img.shields.io/badge/jsdom-v27.4.0-b32623.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=b32623&logoWidth=40&style=flat-square)](https://github.com/jsdom/jsdom)
[![lint-staged](https://img.shields.io/badge/lint_staged-v16.4.0-dfba26.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=dfba26&logoWidth=40&style=flat-square)](https://github.com/lint-staged/lint-staged)
[![postcss](https://img.shields.io/badge/postcss-v8.5.12-4fb31a.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=4fb31a&logoWidth=40&style=flat-square)](https://github.com/postcss/postcss)
[![prettier](https://img.shields.io/badge/prettier-v3.8.3-48bd28.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=48bd28&logoWidth=40&style=flat-square)](https://github.com/prettier/prettier)
[![tailwindcss](https://img.shields.io/badge/tailwindcss-v4.2.4-ba1ca8.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=ba1ca8&logoWidth=40&style=flat-square)](https://github.com/tailwindlabs/tailwindcss)
[![typescript](https://img.shields.io/badge/typescript-~5.9.3-4c2eb8.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=4c2eb8&logoWidth=40&style=flat-square)](https://github.com/Microsoft/TypeScript)
[![typescript-eslint](https://img.shields.io/badge/typescript_eslint-v8.59.0-dc2e59.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=dc2e59&logoWidth=40&style=flat-square)](https://github.com/typescript-eslint/typescript-eslint)
[![vite](https://img.shields.io/badge/vite-v7.3.2-33cc66.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=33cc66&logoWidth=40&style=flat-square)](https://github.com/vitejs/vite)
[![vitest](https://img.shields.io/badge/vitest-v4.1.5-80c026.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=80c026&logoWidth=40&style=flat-square)](https://github.com/vitest-dev/vitest)
[![vue-tsc](https://img.shields.io/badge/vue_tsc-v3.2.7-54bc24.svg?labelColor=333&cacheSeconds=3600&logo=npm&logoColor=54bc24&logoWidth=40&style=flat-square)](https://github.com/vuejs/language-tools)

</div>
<!-- DEPBADGE:END -->

<br>

<div align="center">

[E-MAIL](mailto:eugen.hildt@gmail.com) &nbsp;—&nbsp; [WIKI](https://github.com/ehildt/ckir.io-visions/wiki) &nbsp;—&nbsp; [ISSUES](https://github.com/ehildt/ckir.io-visions/issues) &nbsp;—&nbsp; [DONATE](https://github.com/sponsors/ehildt) &nbsp;—&nbsp; [AI GUIDANCE](https://github.com/ehildt/ckir.io-visions/wiki/ai-guidance)

</div>

<br>
