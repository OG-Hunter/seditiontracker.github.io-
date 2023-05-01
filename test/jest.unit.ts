import { commonConfig } from "./jest.common";
import { Config } from "@jest/types";

const config: Config.InitialOptions = {
  ...commonConfig,
  displayName: "unit",
  testMatch: ["**/*.unit.ts"],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testEnvironment: "node",
};

export default config;
