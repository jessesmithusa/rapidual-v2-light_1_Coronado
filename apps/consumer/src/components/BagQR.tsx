import { View } from "react-native";

// Real QR when the library is present; a deterministic placeholder otherwise.
let QRCode: any = null;
try {
  QRCode = require("react-native-qrcode-svg").default;
} catch {
  QRCode = null;
}

export function BagQR({ value, size = 96 }: { value: string; size?: number }) {
  if (QRCode) return <QRCode value={value} size={size} backgroundColor="transparent" color="#17181C" />;

  // Fallback: a stable pseudo-QR grid derived from the value.
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  const cells = 7;
  const cell = size / cells;
  return (
    <View style={{ width: size, height: size, flexDirection: "row", flexWrap: "wrap" }}>
      {Array.from({ length: cells * cells }).map((_, i) => {
        const on = ((h >> (i % 31)) & 1) === 1 || i % 8 === 0;
        return <View key={i} style={{ width: cell, height: cell, backgroundColor: on ? "#17181C" : "transparent" }} />;
      })}
    </View>
  );
}
