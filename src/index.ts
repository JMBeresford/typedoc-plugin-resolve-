import {
  createProgram,
  forEachChild,
  isClassDeclaration,
  isEnumDeclaration,
  isFunctionDeclaration,
  isInterfaceDeclaration,
  isModuleDeclaration,
  isNamespaceExportDeclaration,
  isTypeAliasDeclaration,
  isVariableDeclaration,
  Node,
  Program,
} from "typescript";
import { Application, ParameterType, ReferenceType } from "typedoc";

declare module "typedoc" {
  export interface TypeDocOptionMap {
    externalModulemap: Record<string, string>;
  }
}
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

const version = Application.VERSION.split(/[\.-]/);
const supportsObjectReturn = +version[1] > 23 || +version[2] >= 26;

const packageToProgramMap = new Map<string, Program>();

let app: Application;

export function load(_app: Application) {
  app = _app;
  const log = app.logger;

  app.options.addDeclaration({
    name: "externalModulemap",
    help: "Map external module names to their documentation location",
    type: ParameterType.Mixed,
    defaultValue: {},
    configFileOnly: true,
  });

  app.converter.addUnknownSymbolResolver((declaration, reflection) => {
    const externalModulemap = app.options.getValue("externalModulemap");

    const packageName = (reflection as any)?.type?.package;
    const name = declaration.symbolReference?.path
      ?.map((p) => p.path)
      .join(".");

    if (!name || !packageName) return;

    let baseUrl = externalModulemap[packageName];
    if (!baseUrl) return;
    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, -1);
    }

    let result: string = "";
    const type = (reflection as any)?.type as ReferenceType | undefined;
    if (!type) return;

    const reflSymbol = type.symbolId;
    if (!reflSymbol) return;
    const source = reflSymbol.fileName;

    let program = packageToProgramMap.get(packageName);
    if (!program) {
      program = createProgram({
        rootNames: [source],
        options: {},
      });

      packageToProgramMap.set(packageName, program);
    }

    const sourceFile = program.getSourceFile(source);
    if (!sourceFile) return;

    forEachChild(sourceFile, (node) => {
      if (result.length > 0) return;

      const uri = resolveNodeUri(node, name);
      if (!uri) return;

      result = `${baseUrl}/${uri}`;
    });

    if (supportsObjectReturn) {
      return {
        target: result,
        caption: name,
      };
    }

    return result;
  });
}

function resolveNodeUri(node: Node, name: string) {
  const nodeName = getNodeName(node);
  if (nodeName !== name) return;

  if (isInterfaceDeclaration(node)) {
    return `interfaces/${nodeName}`;
  }

  if (isFunctionDeclaration(node)) {
    return `functions/${nodeName}`;
  }

  if (isTypeAliasDeclaration(node)) {
    return `types/${nodeName}`;
  }

  if (isClassDeclaration(node)) {
    return `classes/${nodeName}`;
  }

  if (isEnumDeclaration(node)) {
    return `enums/${nodeName}`;
  }

  if (isNamespaceExportDeclaration(node) || isModuleDeclaration(node)) {
    return `modules/${nodeName}`;
  }

  if (isVariableDeclaration(node)) {
    return `variables/${nodeName}`;
  }

  return;
}

function getNodeName(node: Node) {
  let name = (node as any).name?.text;
  if (!name) {
    name = (node as any).name?.escapedText;
  }
  return name;
}
