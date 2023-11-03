/// <reference types="@webgpu/types" />

export type WGpuDevice = GPUDevice;
export let dev: GPUDevice;
export let shaderStage: GPUShaderStageFlags = GPUShaderStage.FRAGMENT;
export function doDeviceOp(device: GPUDevice) {
  return device;
}

export class DeviceClass {
  device: GPUDevice;

  constructor(device: GPUDevice) {
    this.device = device;
  }

  doClassDeviceOp() {
    return this.device;
  }
}

export async function getTextureAsync(): Promise<GPUTexture> {
  return new Promise<GPUTexture>((resolve) => {
    resolve({} as GPUTexture);
  });
}
