import {
  Application,
  DeclarationReflection,
  ProjectReflection,
  ReferenceType,
} from "typedoc";

import { load } from "../index";
import { test, expect, beforeAll, describe } from "vitest";

let project: ProjectReflection;
let app: Application;

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (_: any, value: any) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

beforeAll(async () => {
  app = await Application.bootstrap({
    entryPoints: ["src/tests/index.ts"],
  });
  load(app);
  app.options.setValue("externalModulemap", {
    "@webgpu/types": "https://gpuweb.github.io/types/",
  });

  let _project = await app.convert();
  expect(_project).toBeDefined();
  project = _project!;
});

describe("Resolves WebGPUs declared types", () => {
  test("GPUDevice Interface", () => {
    const refl = project.getChildByName("WGpuDevice");
    expect(refl).toBeInstanceOf(DeclarationReflection);
    const type = (refl as DeclarationReflection).type;
    expect(type).toBeInstanceOf(ReferenceType);

    const refType = type as ReferenceType;
    expect(refType.externalUrl).toBe(
      "https://gpuweb.github.io/types/interfaces/GPUDevice",
    );
  });

  test("GPUDevice Instance", () => {
    const refl = project.getChildByName("dev");
    expect(refl).toBeInstanceOf(DeclarationReflection);
    const type = (refl as DeclarationReflection).type;
    expect(type).toBeInstanceOf(ReferenceType);

    const refType = type as ReferenceType;
    expect(refType.externalUrl).toBe(
      "https://gpuweb.github.io/types/interfaces/GPUDevice",
    );
  });

  test("GPUShaderStage Declaration", () => {
    const refl = project.getChildByName("shaderStage");
    expect(refl).toBeInstanceOf(DeclarationReflection);
    const type = (refl as DeclarationReflection).type;
    expect(type).toBeInstanceOf(ReferenceType);

    const refType = type as ReferenceType;
    expect(refType.externalUrl).toBe(
      "https://gpuweb.github.io/types/types/GPUShaderStageFlags",
    );
  });
});
