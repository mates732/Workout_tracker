import {
  BottomSheetModal as FallbackBottomSheetModal,
  BottomSheetModalProvider as FallbackBottomSheetModalProvider,
  BottomSheetScrollView as FallbackBottomSheetScrollView,
  type BottomSheetModalHandle,
} from './BottomSheetFallback';

type BottomSheetRuntimeModule = {
  BottomSheetModalProvider?: typeof FallbackBottomSheetModalProvider;
  BottomSheetModal?: typeof FallbackBottomSheetModal;
  BottomSheetScrollView?: typeof FallbackBottomSheetScrollView;
};

function resolveBottomSheetModule(): BottomSheetRuntimeModule | null {
  try {
    return require('@gorhom/bottom-sheet') as BottomSheetRuntimeModule;
  } catch {
    return null;
  }
}

const runtimeModule = resolveBottomSheetModule();

export const BottomSheetModalProvider =
  runtimeModule?.BottomSheetModalProvider ?? FallbackBottomSheetModalProvider;

export const BottomSheetModal = runtimeModule?.BottomSheetModal ?? FallbackBottomSheetModal;

export const BottomSheetScrollView =
  runtimeModule?.BottomSheetScrollView ?? FallbackBottomSheetScrollView;

export type { BottomSheetModalHandle };
