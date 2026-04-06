import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["<rootDir>/src/__tests__/**/*.test.ts", "<rootDir>/src/__tests__/**/*.test.tsx"],
  collectCoverageFrom: [
    "src/lib/openlibrary.ts",
    "src/lib/googlebooks.ts",
    "src/lib/actions.ts",
    "src/lib/bookdetails.ts",
    "src/components/**/*.tsx",
  ],
  coverageThreshold: {
    global: {
      lines: 80,
      branches: 80,
      functions: 70,
      statements: 80,
    },
  },
};

export default config;
