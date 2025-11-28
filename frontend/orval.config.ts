import { defineConfig } from 'orval';

const swaggerUrl = 'http://localhost:3000/docs-json';

export default defineConfig({
  api: {
    input: {
      target: swaggerUrl,
    },
    output: {
      target: 'src/services/generated/index.ts',
      schemas: 'src/services/generated/model',
      client: 'axios',
      httpClient: 'axios',
      mode: 'split',
      tsconfig: './tsconfig.json',
      clean: true,
      override: {
        mutator: {
          path: 'src/services/orvalMutator.ts',
          name: 'customInstance',
        },
      },
    },
  },
});
