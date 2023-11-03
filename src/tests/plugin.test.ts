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
  test("Type Alias", () => {
    const refl = project.getChildByName("WGpuDevice");
    expect(refl).toBeInstanceOf(DeclarationReflection);
    const type = (refl as DeclarationReflection).type;
    expect(type).toBeInstanceOf(ReferenceType);

    const refType = type as ReferenceType;
    expect(refType.externalUrl).toBe(
      "https://gpuweb.github.io/types/interfaces/GPUDevice",
    );
  });

  test("Variable", () => {
    const refl = project.getChildByName("dev");
    expect(refl).toBeInstanceOf(DeclarationReflection);
    const type = (refl as DeclarationReflection).type;
    expect(type).toBeInstanceOf(ReferenceType);

    const refType = type as ReferenceType;
    expect(refType.externalUrl).toBe(
      "https://gpuweb.github.io/types/interfaces/GPUDevice",
    );
  });

  test("Value Declaration", () => {
    const refl = project.getChildByName("shaderStage");
    expect(refl).toBeInstanceOf(DeclarationReflection);
    const type = (refl as DeclarationReflection).type;
    expect(type).toBeInstanceOf(ReferenceType);

    const refType = type as ReferenceType;
    expect(refType.externalUrl).toBe(
      "https://gpuweb.github.io/types/types/GPUShaderStageFlags",
    );
  });

  test("Function Signature", () => {
    const refl = project.getChildByName("doDeviceOp");
    expect(refl).toBeInstanceOf(DeclarationReflection);

    const signatures = (refl as DeclarationReflection).signatures;
    expect(signatures).toBeDefined();
    expect(signatures!.length).toBe(1);
    const signature = signatures![0];

    // return type
    const type = signature.type;
    expect(type).toBeInstanceOf(ReferenceType);
    const retType = type as ReferenceType;

    expect(retType.externalUrl).toBe(
      "https://gpuweb.github.io/types/interfaces/GPUDevice",
    );
  });

  test("Function Param", () => {
    const refl = project.getChildByName("doDeviceOp");
    expect(refl).toBeInstanceOf(DeclarationReflection);

    const signatures = (refl as DeclarationReflection).signatures;
    expect(signatures).toBeDefined();
    expect(signatures!.length).toBe(1);
    const signature = signatures![0];

    // param type
    expect(signature.parameters).toBeDefined();
    expect(signature.parameters!.length).toBe(1);
    const param = signature.parameters![0];
    expect(param.type).toBeInstanceOf(ReferenceType);
    const paramType = param.type as ReferenceType;

    expect(paramType.externalUrl).toBe(
      "https://gpuweb.github.io/types/interfaces/GPUDevice",
    );
  });

  test("Class Property", () => {
    const refl = project.getChildByName("DeviceClass");
    expect(refl).toBeInstanceOf(DeclarationReflection);

    const properties = (refl as DeclarationReflection).children;
    expect(properties).toBeDefined();
    expect(properties!.length).toBe(3);
    const property = properties!.find((p) => p.name === "device");
    expect(property).toBeDefined();

    expect(property!.type).toBeInstanceOf(ReferenceType);
    const propType = property!.type as ReferenceType;

    expect(propType.externalUrl).toBe(
      "https://gpuweb.github.io/types/interfaces/GPUDevice",
    );
  });

  test("Class Method", () => {
    const refl = project.getChildByName("DeviceClass");
    expect(refl).toBeInstanceOf(DeclarationReflection);

    const methods = (refl as DeclarationReflection).children;
    expect(methods).toBeDefined();
    expect(methods!.length).toBe(3);
    const method = methods!.find((p) => p.name === "doClassDeviceOp");
    expect(method).toBeDefined();

    expect(method!.signatures).toBeDefined();
    expect(method!.signatures!.length).toBe(1);
    const signature = method!.signatures![0];

    expect(signature.type).toBeInstanceOf(ReferenceType);
    const sigType = signature.type as ReferenceType;

    expect(sigType.externalUrl).toBe(
      "https://gpuweb.github.io/types/interfaces/GPUDevice",
    );
  });
});
