import { Config } from "@jest/types";

export const commonConfig: Config.InitialOptions = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: "../",
  moduleFileExtensions: ["js", "jsx", "ts", "tsx"],
  testPathIgnorePatterns: ["jest.*.ts", "cdk.out", "dist"],
  transformIgnorePatterns: ["node_modules/(?!p-timeout)"],
  clearMocks: true,
};
