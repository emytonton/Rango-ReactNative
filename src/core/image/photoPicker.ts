import ImageEditor from '@react-native-community/image-editor';
import { PermissionsAndroid, Platform } from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  type ImagePickerResponse,
} from 'react-native-image-picker';
import { CROP_OUTPUT_SIZE, type CropRect } from './squareCrop';

export type PickedPhoto = { uri: string; width: number; height: number };

export type PhotoPickResult =
  | { kind: 'picked'; photo: PickedPhoto }
  | { kind: 'cancelled' }
  | { kind: 'permissionDenied' }
  | { kind: 'failed' };

const MAX_SIDE = 2048;

const pickOptions = {
  mediaType: 'photo',
  maxWidth: MAX_SIDE,
  maxHeight: MAX_SIDE,
  quality: 0.9,
} as const;

export type PhotoPicker = {
  takePhoto(): Promise<PhotoPickResult>;
  pickFromGallery(): Promise<PhotoPickResult>;
  cropSquare(photo: PickedPhoto, rect: CropRect): Promise<string>;
};

async function cameraAllowed(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }
  const status = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.CAMERA,
  );
  return status === PermissionsAndroid.RESULTS.GRANTED;
}

function toResult(response: ImagePickerResponse): PhotoPickResult {
  if (response.didCancel) {
    return { kind: 'cancelled' };
  }
  if (response.errorCode === 'permission') {
    return { kind: 'permissionDenied' };
  }
  const asset = response.assets?.[0];
  if (response.errorCode || !asset?.uri || !asset.width || !asset.height) {
    return { kind: 'failed' };
  }
  return {
    kind: 'picked',
    photo: { uri: asset.uri, width: asset.width, height: asset.height },
  };
}

export const photoPicker: PhotoPicker = {
  async takePhoto() {
    if (!(await cameraAllowed())) {
      return { kind: 'permissionDenied' };
    }
    return toResult(
      await launchCamera({ ...pickOptions, saveToPhotos: false }),
    );
  },
  async pickFromGallery() {
    return toResult(await launchImageLibrary(pickOptions));
  },
  async cropSquare(photo, rect) {
    const result = await ImageEditor.cropImage(photo.uri, {
      offset: { x: rect.left, y: rect.top },
      size: { width: rect.size, height: rect.size },
      displaySize: { width: CROP_OUTPUT_SIZE, height: CROP_OUTPUT_SIZE },
      resizeMode: 'cover',
      format: 'jpeg',
      quality: 0.88,
    });
    return result.uri;
  },
};
