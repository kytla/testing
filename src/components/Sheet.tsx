import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetScrollView,
    useBottomSheetTimingConfigs,
    type BottomSheetBackdropProps,
    type BottomSheetScrollViewMethods,
} from "@gorhom/bottom-sheet";
import { X } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { BackHandler, Pressable, Text, View } from "react-native";
import { Easing } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Icons and sheet chrome can't read Tailwind classes. Use the real hex values from your tailwind config.
const INK = "#700D0A"; // ink
const CARD = "#FFFAF1"; // card
const LINE = "#D9BFA8"; // line

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  titleId?: string; // accepted so existing callers don't change, but unused on native
  description?: React.ReactNode;
  footer?: React.ReactNode;
  snapPoints?: string[]; // new: replaces max-h-[80vh]
  scrollRef?: React.Ref<BottomSheetScrollViewMethods>; // new: lets a caller scroll the body
  children: React.ReactNode;
}

export function Sheet({
  open,
  onClose,
  title,
  description,
  footer,
  snapPoints = ["80%"],
  scrollRef,
  children,
}: SheetProps) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const points = useMemo(() => snapPoints, [snapPoints.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  // Same 260ms and curve as the web sheet.
  const animationConfigs = useBottomSheetTimingConfigs({
    duration: 260,
    easing: Easing.bezier(0.23, 1, 0.32, 1),
  });

  //ADRIAN - I just added right now
  useEffect(() => {
    console.log('Sheet open =', open, 'ref =', !!sheetRef.current);
    if (open) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [open]);


  // The `open` prop drives the sheet.
  useEffect(() => {
    if (open) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [open]);

  // Replaces the Escape key: the Android back button closes the sheet.
  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [open, onClose]);

  // Replaces `fixed inset-0 bg-ink/30`.
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        style={[props.style, { backgroundColor: INK }]}
        opacity={0.3}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={points}
      enableDynamicSizing={false}
      animationConfigs={animationConfigs}
      onDismiss={onClose} // swipe-down or backdrop tap tells the parent
      backdropComponent={renderBackdrop}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      // rounded-t-2xl border-2 border-b-0 border-dashed border-ink bg-card
      backgroundStyle={{
        backgroundColor: CARD,
        borderWidth: 1.5,
        borderBottomWidth: 0,
        borderStyle: "solid",
        borderColor: INK,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
      }}
      handleIndicatorStyle={{ backgroundColor: LINE }}
    >
      <View className="flex-1">
        <View className="flex-row items-start justify-between gap-4 px-6 pb-3 pt-2">
          <View className="flex-1">
            <Text
              accessibilityRole="header"
              className="font-display text-base font-semibold text-ink"
            >
              {title}
            </Text>
            {description && (
              <Text className="mt-1 font-display text-xs leading-relaxed text-muted">
                {description}
              </Text>
            )}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            hitSlop={8}
            className="-mr-2 -mt-1 rounded-[6px] p-2 active:bg-ink/5"
          >
            <X color={INK} size={20} />
          </Pressable>
        </View>

        <BottomSheetScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingBottom: footer ? 0 : insets.bottom + 16,
          }}
        >
          {children}
        </BottomSheetScrollView>

        {footer && (
          <View style={{ paddingBottom: insets.bottom }}>{footer}</View>
        )}
      </View>
    </BottomSheetModal>
  );
}
